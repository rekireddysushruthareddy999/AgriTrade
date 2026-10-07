import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import PaperBackground from "./components/PaperBackground";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import FarmerList from "./pages/FarmerList";
import LotList from "./pages/LotList";
import LotDetail from "./pages/LotDetail";
import CreateLot from "./pages/CreateLot";
import InspectionQueue from "./pages/InspectionQueue";
import PurchaseOrderList from "./pages/PurchaseOrderList";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import WarehouseInventory from "./pages/WarehouseInventory";
import ShipmentTracker from "./pages/ShipmentTracker";
import SettlementList from "./pages/SettlementList";
import AdminSettings from "./pages/AdminSettings";
import Profile from "./pages/Profile";

function NotFound() {
  return (
    <div className="empty-state card">
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
      <a className="primary-btn" href="/">
        Back to dashboard
      </a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <PaperBackground />
        <Navbar />
        <main className="page-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/farmers" element={<FarmerList />} />
              <Route path="/lots" element={<LotList />} />
              <Route path="/lots/:id" element={<LotDetail />} />
              <Route element={<ProtectedRoute roles={["admin", "farmer"]} />}>
                <Route path="/lots/new" element={<CreateLot />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    roles={["admin", "inspector", "warehouse_manager"]}
                  />
                }
              >
                <Route path="/inspections" element={<InspectionQueue />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    roles={["admin", "buyer", "warehouse_manager"]}
                  />
                }
              >
                <Route
                  path="/purchase-orders"
                  element={<PurchaseOrderList />}
                />
                <Route
                  path="/purchase-orders/:id"
                  element={<PurchaseOrderDetail />}
                />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    roles={["admin", "warehouse_manager", "logistics"]}
                  />
                }
              >
                <Route
                  path="/warehouse-inventory"
                  element={<WarehouseInventory />}
                />
                <Route path="/shipments" element={<ShipmentTracker />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute
                    roles={["admin", "warehouse_manager", "farmer"]}
                  />
                }
              >
                <Route path="/settlements" element={<SettlementList />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/admin" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
export default App;