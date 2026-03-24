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
  TablePagination,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { formatPhoneForUi } from '../../shared/utils/phoneUtils'
import { getParents, addParent } from '../../entities/parent/api'
import type { ParentListItem } from '../../entities/parent/types'
import { AddParentDialog } from '../../features/parent-dialogs/AddParentDialog'
import { ManageParentStudentsDialog } from '../../features/parent-dialogs/ManageParentStudentsDialog'

const ParentsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()

  const [parents, setParents] = useState<ParentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [contextParent, setContextParent] = useState<ParentListItem | null>(null)

  const [manageOpen, setManageOpen] = useState(false)
  const [manageParent, setManageParent] = useState<ParentListItem | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 400)

  const fetchParents = async () => {
    setLoading(true)
    try {
      const result = await getParents({
        page,
        size,
        q: debouncedSearch || undefined,
      })
      setParents(result.items)
      setTotal(result.total)
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Ошибка при загрузке', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => setPage(0), [debouncedSearch])
  useEffect(() => {
    fetchParents()
  }, [page, size, debouncedSearch])

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>, parent: ParentListItem) => {
    setAnchorEl(e.currentTarget)
    setContextParent(parent)
  }

  const handleCloseContext = () => {
    setAnchorEl(null)
    setContextParent(null)
  }

  const handleManageStudents = () => {
    if (!contextParent) return
    setManageParent(contextParent)
    setManageOpen(true)
    handleCloseContext()
  }

  const handleAddParent = async (userId: number) => {
    try {
      await addParent(userId)
      enqueueSnackbar('Родитель добавлен', { variant: 'success' })
      await fetchParents()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Ошибка')
      setErrorModal(msg)
      throw err
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Родители
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <TextField
          placeholder="Поиск по ФИО, ID, телефону..."
          size="small"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': { height: 48, borderRadius: 2, bgcolor: '#fff' },
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
          onClick={() => setAddOpen(true)}
          sx={{ height: 48, borderRadius: 2, px: 3, whiteSpace: 'nowrap' }}
        >
          Добавить
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {loading && parents.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <CircularProgress size={48} />
          </Box>
        ) : parents.length === 0 && !loading ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>Родители не найдены</Box>
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
                  <TableCell width={70}>ID</TableCell>
                  <TableCell>Фамилия и имя</TableCell>
                  <TableCell>Номер телефона</TableCell>
                  <TableCell width={60} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {parents.map((p) => (
                  <TableRow
                    key={p.parentId}
                    hover
                    sx={{ '& td': { borderBottom: '1px solid rgba(145,158,171,0.12)', px: 2 } }}
                  >
                    <TableCell>{p.parentId}</TableCell>
                    <TableCell>{p.lastName} {p.firstName}</TableCell>
                    <TableCell>{p.phoneNumber ? formatPhoneForUi(p.phoneNumber) : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleContextMenu(e, p)}>
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
        <MenuItem onClick={handleManageStudents}>Управлять учениками</MenuItem>
      </Menu>

      <AddParentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddParent}
      />

      {manageParent && (
        <ManageParentStudentsDialog
          open={manageOpen}
          onClose={() => {
            setManageOpen(false)
            setManageParent(null)
          }}
          parentId={manageParent.parentId}
          parentName={`${manageParent.lastName} ${manageParent.firstName}`}
        />
      )}

      <Dialog open={!!errorModal} onClose={() => setErrorModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ошибка</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>{errorModal}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setErrorModal(null)}>
            ОК
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ParentsPage
