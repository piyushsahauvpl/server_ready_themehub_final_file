import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import './assets/css/style.css';
import './assets/css/fonts.css';
import './assets/css/hero.css';
import './admin/Admin.css';
import './cs/cs.css';

// Font Awesome (local): use local install so icons display reliably
import '@fortawesome/fontawesome-free/css/all.min.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
