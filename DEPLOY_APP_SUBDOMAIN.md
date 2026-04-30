# Deploy: app.andromeda.kz subdomain

Этот документ объясняет, что нужно сделать на сервере, чтобы открытие
`https://app.andromeda.kz` показывало приложение для **родителей и учеников**
(а не employee CRM, который живёт на `https://yadro.andromeda.kz`).

> Само приложение — тот же React-бандл; режим выбирается по hostname в
> `src/app/App.tsx`. Список валидных hostnames для app:
> `app.andromeda.kz`, `app.andromedaedu.kz`.

---

## 0. Чек-лист

| Шаг | Где | Готово |
|---|---|---|
| 1 | DNS A-record `app.andromeda.kz → 109.235.119.34` | ✅ (сделано пользователем) |
| 2 | Frontend Docker container принимает Host: `app.*` | ✅ (`nginx.conf` обновлён, `server_name ... app.andromeda.kz ... _;`) |
| 3 | Backend CORS разрешает `https://app.andromeda.kz` | ✅ (`SecurityConfig` + `application.yml`) |
| 4 | Frontend код различает employee CRM и app по hostname | ✅ (`src/app/App.tsx`) |
| 5 | **Host-level nginx vhost** для `app.andromeda.kz` → frontend container | 👈 **сделать на сервере** |
| 6 | **TLS-сертификат** для `app.andromeda.kz` (Let's Encrypt) | 👈 **сделать на сервере** |

---

## 1. Что нужно сделать на сервере

> Предполагается, что у вас уже работает `yadro.andromeda.kz` через host-nginx,
> который проксирует трафик на frontend-контейнер на `127.0.0.1:8082`
> (значение `FRONTEND_PORT` из `docker-compose.yml`, по умолчанию 8082).

### 1.1. Скопировать готовый vhost

Создайте файл на сервере: `/etc/nginx/sites-available/app.andromeda.kz`

```nginx
# /etc/nginx/sites-available/app.andromeda.kz

# 1) HTTP -> HTTPS redirect + acme-challenge
server {
    listen 80;
    listen [::]:80;
    server_name app.andromeda.kz app.andromedaedu.kz;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# 2) HTTPS — проксируем на тот же frontend-контейнер.
#    Контейнер сам отдаст React-бандл, а App.tsx определит, что hostname
#    в whitelist (app.andromeda.kz) и покажет parent/student app.
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.andromeda.kz app.andromedaedu.kz;

    ssl_certificate     /etc/letsencrypt/live/app.andromeda.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.andromeda.kz/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}
```

> Если у вас `FRONTEND_PORT` другой — поправьте `proxy_pass http://127.0.0.1:8082;`.

Включите vhost и проверьте:

```bash
sudo ln -s /etc/nginx/sites-available/app.andromeda.kz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 1.2. Получить TLS-сертификат

> Перед запуском certbot убедитесь, что есть **HTTP**-блок vhost'а (он уже в файле выше) и nginx перезагружен.

```bash
sudo certbot --nginx \
  -d app.andromeda.kz \
  -d app.andromedaedu.kz \
  --non-interactive --agree-tos \
  -m admin@andromeda.kz \
  --redirect
```

Или, если используете webroot:

```bash
sudo certbot certonly --webroot -w /var/www/letsencrypt \
  -d app.andromeda.kz \
  -d app.andromedaedu.kz
sudo systemctl reload nginx
```

Авто-обновление (если ещё не настроено):

```bash
sudo systemctl enable --now certbot.timer
```

---

## 2. Что нужно сделать в репозитории

Уже сделано в этой ветке:

- `nginx.conf` (контейнер) — добавлен `server_name yadro.andromeda.kz app.andromeda.kz ... _;`.
- `src/app/App.tsx` — whitelist hostnames для app: `app.andromeda.kz`, `app.andromedaedu.kz`, `app.localhost`.
- Backend `SecurityConfig` + `application.yml` — `https://app.andromeda.kz` в `app.cors.allowed-origins`.

> Если разворачивались с уже собранным образом (без пересборки), нужно **пересобрать frontend контейнер**, чтобы nginx взял новый `server_name`:
>
> ```bash
> docker compose build frontend
> docker compose up -d frontend
> ```

---

## 3. Проверка после деплоя

1. **DNS:** `nslookup app.andromeda.kz` → `109.235.119.34`.
2. **TLS:** `curl -I https://app.andromeda.kz` → `HTTP/2 200`.
3. **Routing:** `curl -sk https://app.andromeda.kz/ | grep -i "<title"` → должно вернуться `index.html` фронтенд-контейнера.
4. **App mode:** открыть `https://app.andromeda.kz/` в браузере → должна открыться страница входа с ракетой и заголовком "Веб приложение / для родителей и учеников". Если показалось окно входа сотрудников — проверьте, что фронтенд контейнер пересобран с новым `App.tsx`.
5. **API call:** в DevTools → Network — POST на `/api/v1/app-auth/send-code` должен идти на тот же домен, что и в employee CRM (`VITE_API_BASE_URL`), без CORS-ошибок. Если CORS-ошибка — проверьте, что `APP_CORS_ALLOWED_ORIGINS` на бэкенде содержит `https://app.andromeda.kz`.
6. **Изоляция токенов:** залогиньтесь как сотрудник на `yadro.andromeda.kz`, в новой вкладке откройте `app.andromeda.kz` — она должна попросить логин (потому что localStorage у разных origin'ов разный).
7. **Cross-mode:** залогинившись как родитель в app, попробуйте `curl -H "Authorization: Bearer <APP_PARENT_TOKEN>" https://api.andromedaedu.kz/api/v1/employees` — должен вернуть `401`.

---

## 4. Откат

Если что-то пошло не так:

```bash
sudo rm /etc/nginx/sites-enabled/app.andromeda.kz
sudo nginx -t && sudo systemctl reload nginx
```

DNS-запись можно оставить — без host-vhost'а трафик просто не попадёт на сервис, и поломки employee CRM не будет.

---

## 5. Возможные подводные камни

- **`andromedaedu.kz` vs `andromeda.kz`** — это **два разных домена**. Backend настроен на оба варианта. Сейчас DNS-запись добавлена только для `andromeda.kz`. Если в будущем будете использовать второй домен, добавьте DNS + повторите пп. 1.1–1.2.
- **VITE_API_BASE_URL.** Frontend бьёт API по абсолютному URL из `.env.production` (по умолчанию `https://api.andromedaedu.kz`). Если API живёт на другом домене — задайте `VITE_API_BASE_URL` при сборке (см. `Dockerfile` ARG).
- **localStorage namespace.** Token keys у employee и app совпадают (`accessToken` / `refreshToken`), но это **безопасно**, потому что `localStorage` изолируется по origin (yadro.* и app.* — разные origin'ы).
- **Cookies / SameSite.** Мы не используем cookie для auth (только Bearer в headers), поэтому SameSite-проблем нет.
- **Кеш CDN/прокси.** Если перед сервером есть Cloudflare/прочий прокси — добавьте `app.andromeda.kz` в его конфиг и сбросьте кеш после деплоя.
