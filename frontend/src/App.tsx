import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { LoginTransitionProvider } from "./components/LoginTransition";
import { OperationsPlaceholderPage } from "./rabea/OperationsPlaceholderPage";
import { RabeaWelcomeTransitionProvider } from "./rabea/RabeaWelcomeTransition";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/building/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { NewEmployeePage } from "./pages/employees/NewEmployeePage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { EditIncidentPage } from "./pages/incidents/EditIncidentPage";
import { HeatmapPage } from "./pages/incidents/HeatmapPage";
import { IncidentDetailPage } from "./pages/incidents/IncidentDetailPage";
import { IncidentsListPage } from "./pages/incidents/IncidentsListPage";
import { NewIncidentPage } from "./pages/incidents/NewIncidentPage";
import { LoginPage } from "./pages/LoginPage";
import { ProxiesPage } from "./pages/ProxiesPage";
import { SetupPage } from "./pages/SetupPage";
import { NewVehiclePage } from "./pages/vehicles/NewVehiclePage";
import { VehicleDetailPage } from "./pages/vehicles/VehicleDetailPage";
import { VehiclesListPage } from "./pages/vehicles/VehiclesListPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoginTransitionProvider>
        <RabeaWelcomeTransitionProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/operations" element={<OperationsPlaceholderPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/control-panel" element={<Navigate to="/" replace />} />
            <Route path="/alerts" element={<Navigate to="/" replace />} />
            <Route path="/teams" element={<Navigate to="/employees" replace />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/incidents" element={<IncidentsListPage />} />
            <Route path="/incidents/heatmap" element={<HeatmapPage />} />
            <Route path="/incidents/new" element={<NewIncidentPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/incidents/:id/edit" element={<EditIncidentPage />} />
            <Route path="/proxies" element={<ProxiesPage />} />
            <Route path="/employees" element={<EmployeesListPage />} />
            <Route path="/employees/new" element={<NewEmployeePage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/vehicles" element={<VehiclesListPage />} />
            <Route path="/vehicles/new" element={<NewVehiclePage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
        </RabeaWelcomeTransitionProvider>
        </LoginTransitionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
