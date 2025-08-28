// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Router should be on the outside */}
      <AuthProvider> {/* AuthProvider should be on the inside */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);