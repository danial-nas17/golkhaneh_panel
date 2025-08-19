import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './font.css';
import App from './App';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css'; // Ant Design reset styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <ConfigProvider direction="rtl">
      <App />
    </ConfigProvider>
  // </React.StrictMode>
);
