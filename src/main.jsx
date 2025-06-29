import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { App as AntdApp } from 'antd';

// Start application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AntdApp>
      <App />
    </AntdApp>
  </React.StrictMode>,
)
