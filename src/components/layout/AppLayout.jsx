import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-2">
      <Sidebar />
      <div className="ml-60 flex min-h-screen flex-col">
        <Outlet />
      </div>
    </div>
  )
}
