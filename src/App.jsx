import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Categories from "./pages/Categories"
import Items from "./pages/Items"
import AddItem from "./pages/AddItem"
import EditItem from "./pages/EditItem"
import StockBatches from "./pages/Batches"
import Transactions from "./pages/Transactions"
import ItemDetails from "./pages/ItemDetails"
import Reports from "./pages/Reports"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}