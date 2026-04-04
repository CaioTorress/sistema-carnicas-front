import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-w-0 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
