import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/routes/home'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
