import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import type { ReactNode } from 'react'

const PRIMARY = {
  lighter: '#D0ECFE',
  light: '#73BAFB',
  main: '#1877F2',
  dark: '#0C44AE',
  darker: '#042174',
}

const SECONDARY = {
  lighter: '#EFD6FF',
  light: '#C684FF',
  main: '#8E33FF',
  dark: '#5119B7',
  darker: '#27097A',
}

const GREY = {
  50: '#FCFDFD',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#1C252E',
  900: '#141A21',
}

const primaryFont = '"DM Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const secondaryFont = '"Barlow", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

function varAlpha(rgb: string, opacity: number): string {
  return `rgba(${rgb}, ${opacity})`
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

const grey500Rgb = hexToRgb(GREY[500])
const primaryRgb = hexToRgb(PRIMARY.main)

const theme = createTheme({
  palette: {
    primary: {
      main: PRIMARY.main,
      light: PRIMARY.light,
      dark: PRIMARY.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: SECONDARY.main,
      light: SECONDARY.light,
      dark: SECONDARY.dark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: GREY[100],
      paper: '#FFFFFF',
    },
    text: {
      primary: GREY[800],
      secondary: GREY[600],
    },
    divider: varAlpha(grey500Rgb, 0.2),
    success: { main: '#22C55E', contrastText: '#ffffff' },
    warning: { main: '#FFAB00', contrastText: '#1C252E' },
    error: { main: '#FF5630', contrastText: '#FFFFFF' },
    info: { main: '#00B8D9', contrastText: '#FFFFFF' },
    grey: GREY,
    action: {
      hover: varAlpha(grey500Rgb, 0.08),
      selected: varAlpha(grey500Rgb, 0.16),
      focus: varAlpha(grey500Rgb, 0.24),
      disabled: varAlpha(grey500Rgb, 0.8),
      disabledBackground: varAlpha(grey500Rgb, 0.24),
      hoverOpacity: 0.08,
      disabledOpacity: 0.48,
      active: GREY[600],
    },
  },
  typography: {
    fontFamily: primaryFont,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: secondaryFont,
      fontWeight: 800,
      lineHeight: 80 / 64,
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: secondaryFont,
      fontWeight: 800,
      lineHeight: 64 / 48,
      fontSize: '2rem',
    },
    h3: {
      fontFamily: secondaryFont,
      fontWeight: 700,
      lineHeight: 1.5,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 700,
      lineHeight: 1.5,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 700,
      lineHeight: 1.5,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      lineHeight: 28 / 18,
      fontSize: '1.0625rem',
    },
    subtitle1: {
      fontWeight: 600,
      lineHeight: 1.5,
      fontSize: '1rem',
    },
    subtitle2: {
      fontWeight: 600,
      lineHeight: 22 / 14,
      fontSize: '0.875rem',
    },
    body1: {
      lineHeight: 1.5,
      fontSize: '1rem',
    },
    body2: {
      lineHeight: 22 / 14,
      fontSize: '0.875rem',
    },
    caption: {
      lineHeight: 1.5,
      fontSize: '0.75rem',
    },
    overline: {
      fontWeight: 700,
      lineHeight: 1.5,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
    },
    button: {
      fontWeight: 700,
      lineHeight: 24 / 14,
      fontSize: '0.875rem',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: GREY[100] },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: GREY[500],
            borderRadius: '10px',
            '&:hover': { backgroundColor: GREY[600] },
          },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: varAlpha(hexToRgb(GREY[900]), 0.8),
        },
        invisible: {
          background: 'transparent',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: '8px',
        },
        sizeLarge: {
          minHeight: 48,
        },
        sizeMedium: {
          minHeight: 40,
        },
        containedPrimary: {
          backgroundColor: PRIMARY.main,
          color: '#FFFFFF',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: PRIMARY.dark,
            boxShadow: `0 8px 16px 0 ${varAlpha(primaryRgb, 0.24)}`,
          },
        },
        containedInherit: {
          color: '#FFFFFF',
          backgroundColor: GREY[800],
          '&:hover': {
            color: '#FFFFFF',
            backgroundColor: GREY[800],
          },
        },
        outlined: {
          borderColor: varAlpha(grey500Rgb, 0.32),
          '&:hover': {
            backgroundColor: varAlpha(grey500Rgb, 0.08),
          },
        },
        text: {
          '&:hover': {
            backgroundColor: varAlpha(grey500Rgb, 0.08),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          position: 'relative',
          borderRadius: '16px',
          boxShadow: `0 0 2px 0 ${varAlpha(grey500Rgb, 0.2)}, 0 12px 24px -4px ${varAlpha(grey500Rgb, 0.12)}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: varAlpha(grey500Rgb, 0.16),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: varAlpha(hexToRgb('#F9FAFB'), 0.8),
          backdropFilter: 'blur(8px)',
          color: GREY[800],
          boxShadow: 'none',
          borderBottom: `1px solid ${varAlpha(grey500Rgb, 0.16)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          boxShadow: `0 0 2px 0 ${varAlpha(grey500Rgb, 0.2)}, 0 12px 24px -4px ${varAlpha(grey500Rgb, 0.12)}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            '& fieldset': {
              borderColor: varAlpha(grey500Rgb, 0.2),
            },
            '&:hover fieldset': {
              borderColor: varAlpha(grey500Rgb, 0.4),
            },
            '&.Mui-focused fieldset': {
              borderWidth: '1px',
              borderColor: PRIMARY.main,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${varAlpha(primaryRgb, 0.12)}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: varAlpha(grey500Rgb, 0.2),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '0.875rem',
          color: GREY[600],
          fontWeight: 600,
          backgroundColor: GREY[200],
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: GREY[200],
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.875rem',
            color: GREY[600],
            borderBottom: `1px solid ${varAlpha(grey500Rgb, 0.2)}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: GREY[100],
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${varAlpha(grey500Rgb, 0.2)}`,
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          transition: 'all 0.15s ease',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          boxShadow: `-40px 40px 80px -8px rgba(0, 0, 0, 0.24)`,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.875rem',
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
