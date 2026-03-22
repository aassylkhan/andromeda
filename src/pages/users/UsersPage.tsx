import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  TablePagination,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { getUsers } from '../../entities/user/api'
import type { UserDto } from '../../entities/user/types'
import { formatDocumentForDisplay } from '../../shared/utils/documentUtils'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import { AddUserModal } from '../../features/user-dialogs/AddUserModal'
import { EditDocumentModal } from '../../features/user-dialogs/EditDocumentModal'

const UsersPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()

  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const debouncedSearch = useDebounce(searchQuery, 400)

  const [openAddModal, setOpenAddModal] = useState(false)
  const [editDocUser, setEditDocUser] = useState<UserDto | null>(null)
  const [openEditDocModal, setOpenEditDocModal] = useState(false)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [contextUser, setContextUser] = useState<UserDto | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await getUsers({
        page,
        size,
        q: debouncedSearch || undefined,
      })
      setUsers(result.items)
      setTotal(result.total)
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при загрузке', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => setPage(0), [debouncedSearch])
  useEffect(() => {
    fetchUsers()
  }, [page, size, debouncedSearch])

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>, user: UserDto) => {
    setAnchorEl(e.currentTarget)
    setContextUser(user)
  }

  const handleCloseContext = () => {
    setAnchorEl(null)
    setContextUser(null)
  }

  const handleEditDocument = () => {
    if (!contextUser) return handleCloseContext()
    setEditDocUser(contextUser)
    setOpenEditDocModal(true)
    handleCloseContext()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Все пользователи
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <TextField
          placeholder="Поиск по ФИО, документу, ID, телефону..."
          size="small"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: 48,
              borderRadius: 2,
              bgcolor: '#fff',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddModal(true)}
          sx={{ height: 48, borderRadius: 2, px: 3, whiteSpace: 'nowrap' }}
        >
          Добавить
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          bgcolor: '#fff',
          p: 0,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <CircularProgress size={48} />
          </Box>
        ) : users.length === 0 && !loading ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Пользователи не найдены</Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#637381',
                      bgcolor: '#F3F6FB',
                      borderBottom: '1px solid rgba(145,158,171,0.20)',
                      py: 1.5,
                      px: 2,
                    },
                  }}
                >
                  <TableCell width={80}>ID</TableCell>
                  <TableCell>Фамилия и имя</TableCell>
                  <TableCell>Вид документа и номер</TableCell>
                  <TableCell>Номер телефона</TableCell>
                  <TableCell width={60} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2 } }}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.lastName} {u.firstName}</TableCell>
                    <TableCell>{formatDocumentForDisplay(u.pnOrIin)}</TableCell>
                    <TableCell>{u.phoneNumber ? formatPhoneForUi(u.phoneNumber) : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleContextMenu(e, u)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={size}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setSize(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Строк на странице"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`
          }
        />
      </Paper>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseContext}>
        <MenuItem onClick={handleEditDocument}>Редактировать номер документа</MenuItem>
      </Menu>

      <AddUserModal open={openAddModal} onClose={() => setOpenAddModal(false)} onSuccess={fetchUsers} />

      <EditDocumentModal
        open={openEditDocModal}
        onClose={() => {
          setOpenEditDocModal(false)
          setEditDocUser(null)
        }}
        onSuccess={fetchUsers}
        user={editDocUser}
      />
    </Box>
  )
}

export default UsersPage
