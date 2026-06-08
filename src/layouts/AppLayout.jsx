import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

// TODO: replace with user type from auth context
const PLACEHOLDER_USER_TYPE = 'admin'

export default function AppLayout() {
  return (
    <div className="layout layout-app">
      <Header userType={PLACEHOLDER_USER_TYPE} />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
