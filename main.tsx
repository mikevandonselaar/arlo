import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './lib/theme.tsx';
import { CurrencyProvider } from './lib/currency.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </ThemeProvider>
);
