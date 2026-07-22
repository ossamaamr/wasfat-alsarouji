import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { isConfigured } from './lib/supabase'
import Layout from './components/Layout'
import { Loading, Alert } from './components/ui'

import Login from './pages/Login'
import FirstSetup from './pages/FirstSetup'
import Home from './pages/Home'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'
import MyRecipes from './pages/MyRecipes'
import Review from './pages/Review'
import Notifications from './pages/Notifications'
import Suggestions from './pages/Suggestions'
import More from './pages/More'
import Admin from './pages/Admin'

function NotConfigured() {
  return (
    <div className="page">
      <div className="mt-lg" />
      <Alert type="error">
        الاتصال بالخادم غير مضبوط. انسخ ملف <code>.env.example</code> إلى <code>.env</code> واملأ
        قيم Supabase ثم أعد التشغيل.
      </Alert>
    </div>
  )
}

// يحمي المسارات التي تتطلب دخولًا؛ ويحوّل لإعداد أول مرة عند الحاجة
function RequireAuth({ children, roles }) {
  const { isAuthenticated, needsSetup, loading, role } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (needsSetup) return <Navigate to="/setup" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  if (!isConfigured) return <NotConfigured />
  if (loading) return <Loading text="جارٍ التحضير…" />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<FirstSetup />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/add" element={<RecipeForm />} />
        <Route path="/edit/:id" element={<RecipeForm />} />
        <Route path="/my" element={<MyRecipes />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="/more" element={<More />} />
        <Route
          path="/review"
          element={
            <RequireAuth roles={['supervisor', 'admin']}>
              <Review />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={['admin']}>
              <Admin />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
