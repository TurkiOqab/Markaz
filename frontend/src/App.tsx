import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { NewEmployeePage } from "./pages/employees/NewEmployeePage";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { NewVehiclePage } from "./pages/vehicles/NewVehiclePage";
import { VehicleDetailPage } from "./pages/vehicles/VehicleDetailPage";
import { VehiclesListPage } from "./pages/vehicles/VehiclesListPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesListPage />} />
            <Route path="/employees/new" element={<NewEmployeePage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/vehicles" element={<VehiclesListPage />} />
            <Route path="/vehicles/new" element={<NewVehiclePage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
