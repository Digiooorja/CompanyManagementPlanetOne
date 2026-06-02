import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { OperationalDashboard } from "./pages/OperationalDashboard";
import { Blocks } from "./pages/Blocks";
import { BlockDetail } from "./pages/BlockDetail";
import { Projects } from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import { Activities } from "./pages/Activities";
import { ActivityDetail } from "./pages/ActivityDetail";
import { Documents } from "./pages/Documents";
import { DocumentDetail } from "./pages/DocumentDetail";
import { Workflows } from "./pages/Workflows";
import { WorkflowDetail } from "./pages/WorkflowDetail";
import { Registers } from "./pages/Registers";
import { RegisterDetail } from "./pages/RegisterDetail";
import { Finance } from "./pages/Finance";
import { AfeDetail } from "./pages/AfeDetail";
import { Reports } from "./pages/Reports";
import { Admin } from "./pages/Admin";
import { Notifications } from "./pages/Notifications";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login
  },
  {
    path: "/register",
    Component: Register
  },
  {
    path: "/",
    Component: ProtectedRoute,
    errorElement: <Navigate to="/login" replace />,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: ExecutiveDashboard },
          { path: "operational", Component: OperationalDashboard },
          { path: "blocks", Component: Blocks },
          { path: "blocks/:id", Component: BlockDetail },
          { path: "projects", Component: Projects },
          { path: "projects/:id", Component: ProjectDetail },
          { path: "activities", Component: Activities },
          { path: "activities/:id", Component: ActivityDetail },
          { path: "documents", Component: Documents },
          { path: "documents/:id", Component: DocumentDetail },
          { path: "workflows", Component: Workflows },
          { path: "workflows/:id", Component: WorkflowDetail },
          { path: "registers", Component: Registers },
          { path: "registers/:id", Component: RegisterDetail },
          { path: "finance", Component: Finance },
          { path: "finance/:id", Component: AfeDetail },
          { path: "reports", Component: Reports },
          { path: "admin", Component: Admin },
          { path: "notifications", Component: Notifications },
        ],
      }
    ],
  },
  {
    path: "*",
    Component: () => <Navigate to="/" replace />
  }
]);
