import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Sites from './pages/Sites'
import MealRules from './pages/MealRules'
import MealCategories from './pages/MealCategories'
import Suppliers from './pages/Suppliers'
import FoodRequests from './pages/FoodRequests'
import Complaints from './pages/Complaints'
import DeliveryNotes from './pages/DeliveryNotes'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Logs from './pages/Logs'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RequirePermission from './components/RequirePermission'

const gated = (permission, element) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={gated('dashboard.view', <Dashboard />)} />
        <Route path="/employees" element={gated('employees.view', <Employees />)} />
        <Route path="/sites" element={gated('sites.view', <Sites />)} />
        <Route path="/suppliers" element={gated('suppliers.view', <Suppliers />)} />
        <Route path="/meal-rules" element={gated('meal-rules.view', <MealRules />)} />
        <Route path="/meal-categories" element={gated('meal-categories.view', <MealCategories />)} />
        <Route path="/food-requests" element={gated('food-requests.view', <FoodRequests />)} />
        <Route path="/complaints" element={gated('complaints.view', <Complaints />)} />
        <Route path="/delivery-notes" element={gated('delivery-notes.view', <DeliveryNotes />)} />
        <Route path="/users" element={gated('users.view', <Users />)} />
        <Route path="/roles" element={gated('roles.view', <Roles />)} />
        <Route path="/logs" element={gated('logs.view', <Logs />)} />
        <Route path="/reports" element={gated('reports.view', <Reports />)} />
        <Route path="/settings" element={gated('settings.view', <Settings />)} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
