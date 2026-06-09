import { Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import PublicLayout from '../layouts/PublicLayout'
import NotFoundPage from '../pages/NotFoundPage'
import { pageComponents } from './pageComponents'
import ProtectedRoute from './ProtectedRoute'
import { getRoutesByLayout, toRoutePath } from './routeRegistry'

function renderRoute(route) {
  const Page = pageComponents[route.page]
  let element = <Page />

  if (route.access && route.access !== 'anyone') {
    element = (
      <ProtectedRoute access={route.access}>
        <Page />
      </ProtectedRoute>
    )
  }

  if (route.path === '/') {
    return <Route key={route.path} index element={element} />
  }

  return <Route key={route.path} path={toRoutePath(route.path)} element={element} />
}

export default function AppRoutes() {
  const publicRoutes = getRoutesByLayout('public')
  const appRoutes = getRoutesByLayout('app')

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        {publicRoutes.map(renderRoute)}
      </Route>

      <Route element={<AppLayout />}>
        {appRoutes.map(renderRoute)}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
