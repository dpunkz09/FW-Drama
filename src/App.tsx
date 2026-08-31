import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import './index.css'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-black">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
