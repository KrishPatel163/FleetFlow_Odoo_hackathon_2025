import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Analytics } from "./pages/Analytics";
import { Dashboard } from "./pages/Dashboard";
import { DriverProfiles } from "./pages/DriverProfiles";
import { FuelLogs } from "./pages/FuelLogs";
import { Login } from "./pages/Login";
import { MaintenanceLogs } from "./pages/MaintenanceLogs";
import { TripDispatcher } from "./pages/TripDispatcher";
import { VehicleRegistry } from "./pages/VehicleRegistry";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/app",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "vehicles",
        Component: VehicleRegistry,
      },
      {
        path: "trips",
        Component: TripDispatcher,
      },
      {
        path: "maintenance",
        Component: MaintenanceLogs,
      },
      {
        path: "fuel",
        Component: FuelLogs,
      },
      {
        path: "drivers",
        Component: DriverProfiles,
      },
      {
        path: "analytics",
        Component: Analytics,
      },
    ],
  },
]);
