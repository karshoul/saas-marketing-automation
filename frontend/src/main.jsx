import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Khóa cứng nền tối sâu toàn cục tại DOM gốc để triệt tiêu hoàn toàn lỗi lóe màu cũ
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.style.backgroundColor = '#060907';
  rootElement.style.minHeight = '100vh';
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)