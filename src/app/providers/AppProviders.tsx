import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import type { ReactNode } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1877F2',
      light: '#73BAFB',
      dark: '#0C44AE',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8E33FF',
      contrastText: '#fff',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#141A21',
      secondary: '#637381',
    },
    divider: 'rgba(145, 158, 171, 0.2)',
    success: {
      main: '#22C55E',
    },
    warning: {
      main: '#FFAB00',
    },
    error: {
      main: '#FF5630',
    },
    info: {
      main: '#00B8D9',
    },
    grey: {
      100: '#F9FAFB',
      200: '#F4F6F8',
      300: '#DFE3E8',
      500: '#919EAB',
      600: '#637381',
      800: '#1C252E',
      900: '#141A21',
    },
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    h1: {
      fontFamily: '"Barlow", sans-serif',
      fontSize: '34px',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h2: {
      fontFamily: '"Barlow", sans-serif',
      fontSize: '34px',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h3: {
      fontFamily: '"Barlow", sans-serif',
      fontSize: '30px',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '26px',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '22px',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '17px',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '15px',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '17px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    button: {
      fontSize: '15px',
      fontWeight: 700,
      lineHeight: 1.5,
      textTransform: 'unset',
      letterSpacing: '0',
    },
    caption: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'url(/overlay.jpg) no-repeat center center fixed',
          backgroundSize: 'cover',
          backgroundColor: '#F9FAFB',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#F9FAFB',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#919EAB',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: '#637381',
            },
          },
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.7)',
            pointerEvents: 'none',
            zIndex: -1,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'unset',
          fontWeight: 700,
          padding: '10px 24px',
          boxShadow: 'none',
          borderRadius: '8px',
          minHeight: '44px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(24, 119, 242, 0.2)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          backgroundColor: '#1877F2',
          boxShadow: '0 4px 12px rgba(24, 119, 242, 0.2)',
          '&:hover': {
            backgroundColor: '#0C44AE',
            boxShadow: '0 8px 20px rgba(24, 119, 242, 0.3)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        },
        outlined: {
          borderWidth: '1px',
          borderColor: '#DFE3E8',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderWidth: '1px',
            backgroundColor: '#F9FAFB',
            borderColor: '#919EAB',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: '#F4F6F8',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(249, 250, 251, 0.8)',
          backdropFilter: 'blur(8px)',
          color: '#141A21',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(145, 158, 171, 0.16)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'rgba(145, 158, 171, 0.08)',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.20), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.20), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
          backgroundImage: 'none',
          borderRadius: '16px',
          border: '1px solid rgba(145, 158, 171, 0.16)',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(145, 158, 171, 0.08)',
        },
        elevation2: {
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.20), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
        },
        elevation3: {
          boxShadow: '0 12px 32px rgba(145, 158, 171, 0.15)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            minHeight: '44px',
            '& fieldset': {
              borderColor: '#DFE3E8',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#919EAB',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(24, 119, 242, 0.15)',
              '& fieldset': {
                borderWidth: '1px',
                borderColor: '#1877F2',
              },
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          margin: '4px 12px',
          padding: '12px 16px',
          transition: 'all 0.2s ease',
          position: 'relative',
          height: '44px',
          '&.Mui-selected': {
            backgroundColor: '#D0ECFE',
            color: '#0C44AE',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(24, 119, 242, 0.15)',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '4px',
              height: '60%',
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#1877F2',
            },
            '&:hover': {
              backgroundColor: '#73BAFB',
              boxShadow: '0 4px 12px rgba(24, 119, 242, 0.2)',
            },
            '& .MuiListItemIcon-root': {
              color: '#1877F2',
            },
          },
          '&:hover': {
            backgroundColor: '#F4F6F8',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '15px',
        },
        colorSuccess: {
          backgroundColor: '#DCFCE7',
          color: '#15803D',
        },
        colorWarning: {
          backgroundColor: '#FFED4E',
          color: '#92600B',
        },
        colorError: {
          backgroundColor: '#FFE7D9',
          color: '#B42318',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F4F6F8',
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '15px',
            color: '#637381',
            borderBottom: '1px solid rgba(145, 158, 171, 0.20)',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: '#F9FAFB',
            },
          },
          '& .MuiTableCell-root': {
            borderBottom: '1px solid rgba(145, 158, 171, 0.20)',
            fontSize: '15px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.20), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
          borderRadius: '16px',
          border: '1px solid rgba(145, 158, 171, 0.16)',
          padding: '20px',
          '&:hover': {
            boxShadow: '0 12px 32px rgba(145, 158, 171, 0.15)',
          },
          transition: 'box-shadow 0.3s ease',
        },
      },
    },
  },
})

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={2500}>
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  )
}
