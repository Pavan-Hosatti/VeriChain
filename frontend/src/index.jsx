import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker in production for offline demos (app shell + revocation snapshot)
if ('serviceWorker' in navigator) {
  // register only in production builds to avoid interfering with dev server
  if (import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Service worker registered:', reg.scope);
    }).catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
}
