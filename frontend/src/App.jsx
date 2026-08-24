import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import PendingVerification from "./pages/PendingVerification";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SupplyChain from "./pages/SupplyChain";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/pending-verification"
            element={<PendingVerification />}
          />

          {/* Authenticated routes */}
          <Route element={<ProtectedRoute />}>

            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/supply-chain" element={<SupplyChain />} />

            <Route path="/profile" element={<Profile />} />

            {/* Admin-only route */}
            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;