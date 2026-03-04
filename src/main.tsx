import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';

const theme = createTheme({
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif'
  },
  palette: {
    background: {
      default: '#f6f4ef'
    }
  },
  shape: {
    borderRadius: 10
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
