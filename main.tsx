import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CurrencyProvider } from './lib/currency.tsx';
import '@fontsource/familjen-grotesk/400.css';
import '@fontsource/familjen-grotesk/500.css';
import '@fontsource/familjen-grotesk/700.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <CurrencyProvider>
    <App />
  </CurrencyProvider>
);
