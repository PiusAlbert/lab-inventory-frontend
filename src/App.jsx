import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import StudentDashboard from "./pages/StudentDashboard"
import Categories from "./pages/Categories"
import Items from "./pages/Items"
import AddItem from "./pages/AddItem"
import EditItem from "./pages/EditItem"
import StockBatches from "./pages/Batches"
import Transactions from "./pages/Transactions"
import ItemDetails from "./pages/ItemDetails"
import Reports from "./pages/Reports"
import Experiments from "./pages/Experiments"
import ExperimentEditor from "./pages/ExperimentEditor"
import ExperimentView from "./pages/ExperimentView"
import ExperimentWizard from "./pages/ExperimentWizard"
import StudentsManagement from "./pages/StudentsManagement"
import Profile from "./pages/Profile"
import BulkImport from "./pages/BulkImport"
import Laboratories from "./pages/Laboratories"
import Users from "./pages/Users"
import Bookings from "./pages/Bookings"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<Login />} />
        <Route path="/register"  element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Layout>
                <Categories />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Layout>
                <Items />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/items/new"
          element={
            <ProtectedRoute>
              <Layout>
                <AddItem />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/items/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EditItem />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/items/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ItemDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/batches"
          element={
            <ProtectedRoute>
              <Layout>
                <StockBatches />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <Transactions />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/experiments"
          element={
            <ProtectedRoute>
              <Layout>
                <Experiments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/experiments/wizard"
          element={
            <ProtectedRoute>
              <Layout>
                <ExperimentWizard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/experiments/new"
          element={
            <ProtectedRoute>
              <Layout>
                <ExperimentEditor />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/experiments/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ExperimentView />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/experiments/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <ExperimentEditor />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Layout>
                <StudentsManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/laboratories"
          element={
            <ProtectedRoute>
              <Layout>
                <Laboratories />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Layout>
                <Bookings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bulk-import"
          element={
            <ProtectedRoute>
              <Layout>
                <BulkImport />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}