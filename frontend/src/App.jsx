import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ScanProgress from './pages/ScanProgress'
import ScanResults from './pages/ScanResults'
import History from './pages/History'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="scan/:scanId/progress" element={<ScanProgress />} />
        <Route path="scan/:scanId/results" element={<ScanResults />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  )
}
