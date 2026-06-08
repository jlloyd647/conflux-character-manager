import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

export default function PublicLayout() {
  return (
    <div className="layout layout-public">
      <Header userType="guest" />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
