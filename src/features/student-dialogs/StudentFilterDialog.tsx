import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  TextField,
  Autocomplete,
  Checkbox,
} from '@mui/material'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import type { LookupDto } from '../../entities/lookup/types'
import {
  getGrades,
  getProducts,
  getLearningLanguages,
  getOffices,
  getLearningHourOptions,
  getCurators,
} from '../../entities/lookup/api'

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

export interface StudentFilters {
  gradeIds: number[]
  productIds: number[]
  learningLanguageIds: number[]
  officeIds: number[]
  learningHourOptionIds: number[]
  curatorIds: number[]
  offlineGroupHoursMin?: number
  offlineGroupHoursMax?: number
  offlineIndividualHoursMin?: number
  offlineIndividualHoursMax?: number
  onlineIndividualHoursMin?: number
  onlineIndividualHoursMax?: number
  freezingsMin?: number
  freezingsMax?: number
  offerStartDateFrom?: string
  offerStartDateTo?: string
}

export const emptyFilters: StudentFilters = {
  gradeIds: [],
  productIds: [],
  learningLanguageIds: [],
  officeIds: [],
  learningHourOptionIds: [],
  curatorIds: [],
}

interface Props {
  open: boolean
  onClose: () => void
  onApply: (filters: StudentFilters) => void
  initial: StudentFilters
}

export function StudentFilterDialog({ open, onClose, onApply, initial }: Props) {
  const [grades, setGrades] = useState<LookupDto[]>([])
  const [products, setProducts] = useState<LookupDto[]>([])
  const [languages, setLanguages] = useState<LookupDto[]>([])
  const [offices, setOffices] = useState<LookupDto[]>([])
  const [hourOptions, setHourOptions] = useState<LookupDto[]>([])
  const [curators, setCurators] = useState<LookupDto[]>([])
  const [loading, setLoading] = useState(false)

  const [f, setF] = useState<StudentFilters>(initial)

  useEffect(() => {
    if (open) {
      setF(initial)
      setLoading(true)
      Promise.all([
        getGrades(),
        getProducts(),
        getLearningLanguages(),
        getOffices(),
        getLearningHourOptions(),
        getCurators(),
      ])
        .then(([g, p, l, o, h, c]) => {
          setGrades(g)
          setProducts(p)
          setLanguages(l)
          setOffices(o)
          setHourOptions(h)
          setCurators(c)
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleReset = () => setF(emptyFilters)

  const handleApply = () => {
    onApply(f)
    onClose()
  }

  const setIds = useCallback(
    (key: keyof Pick<StudentFilters, 'gradeIds' | 'productIds' | 'learningLanguageIds' | 'officeIds' | 'learningHourOptionIds' | 'curatorIds'>) =>
      (_: unknown, value: LookupDto[]) =>
        setF((prev) => ({ ...prev, [key]: value.map((v) => v.id) })),
    []
  )

  const numField = (label: string, key: keyof StudentFilters) => (
    <TextField
      label={label}
      type="number"
      size="small"
      fullWidth
      value={f[key] ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? undefined : Number(e.target.value)
        setF((prev) => ({ ...prev, [key]: val }))
      }}
    />
  )

  const selectedLookups = (ids: number[], options: LookupDto[]) =>
    options.filter((o) => ids.includes(o.id))

  const multiSelect = (
    label: string,
    options: LookupDto[],
    key: 'gradeIds' | 'productIds' | 'learningLanguageIds' | 'officeIds' | 'learningHourOptionIds' | 'curatorIds'
  ) => (
    <Autocomplete
      multiple
      size="small"
      options={options}
      disableCloseOnSelect
      getOptionLabel={(o) => o.name}
      value={selectedLookups(f[key], options)}
      onChange={setIds(key)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={option.id}>
          <Checkbox icon={icon} checkedIcon={checkedIcon} sx={{ mr: 1 }} checked={selected} />
          {option.name}
        </li>
      )}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Фильтры</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {multiSelect('Класс', grades, 'gradeIds')}
            {multiSelect('Продукт', products, 'productIds')}
            {multiSelect('Язык обучения', languages, 'learningLanguageIds')}
            {multiSelect('Офис', offices, 'officeIds')}
            {multiSelect('Время обучения', hourOptions, 'learningHourOptionIds')}
            {multiSelect('Куратор', curators, 'curatorIds')}

            <Box sx={{ display: 'flex', gap: 2 }}>
              {numField('Кол. гр. офф. часов (мин)', 'offlineGroupHoursMin')}
              {numField('Кол. гр. офф. часов (макс)', 'offlineGroupHoursMax')}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {numField('Кол. инд. офф. часов (мин)', 'offlineIndividualHoursMin')}
              {numField('Кол. инд. офф. часов (макс)', 'offlineIndividualHoursMax')}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {numField('Кол. инд. онл. часов (мин)', 'onlineIndividualHoursMin')}
              {numField('Кол. инд. онл. часов (макс)', 'onlineIndividualHoursMax')}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {numField('Кол. заморозок (мин)', 'freezingsMin')}
              {numField('Кол. заморозок (макс)', 'freezingsMax')}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Дата начала обучения (от)"
                type="date"
                size="small"
                fullWidth
                value={f.offerStartDateFrom ?? ''}
                onChange={(e) => setF((prev) => ({ ...prev, offerStartDateFrom: e.target.value || undefined }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Дата начала обучения (до)"
                type="date"
                size="small"
                fullWidth
                value={f.offerStartDateTo ?? ''}
                onChange={(e) => setF((prev) => ({ ...prev, offerStartDateTo: e.target.value || undefined }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Сбросить</Button>
        <Button onClick={onClose}>Отменить</Button>
        <Button onClick={handleApply} variant="contained">
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
