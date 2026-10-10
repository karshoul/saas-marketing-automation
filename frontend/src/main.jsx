import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Khóa cứng nền tối sâu toàn cục tại DOM gốc để triệt tiêu hoàn toàn lỗi lóe màu cũ
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.style.backgroundColor = '#060907';
  rootElement.style.minHeight = '100vh';
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(rootElement).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)