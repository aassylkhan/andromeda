import React, { useState } from 'react'
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material'
import PaymentRequests2Tab from './tabs/PaymentRequests2Tab'
import OldPaymentRequestsTab from './tabs/OldPaymentRequestsTab'
import ExtensionRequestsTab from './tabs/ExtensionRequestsTab'

const AccountingPage: React.FC = () => {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Бухгалтерия
      </Typography>

      <Paper variant="outlined" sx={{ bgcolor: '#fff', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid rgba(145,158,171,0.12)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 48,
            },
          }}
        >
          <Tab label="Запросы на оплату 2" />
          <Tab label="Запросы на оплату" />
          <Tab label="Запросы на пролонгацию" />
        </Tabs>

        <Box sx={{ p: 0 }}>
          {tab === 0 && <PaymentRequests2Tab />}
          {tab === 1 && <OldPaymentRequestsTab />}
          {tab === 2 && <ExtensionRequestsTab />}
        </Box>
      </Paper>
    </Box>
  )
}

export default AccountingPage
