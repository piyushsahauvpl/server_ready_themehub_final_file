import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "./Auth/Login";
import ProtectedRoute from "./Auth/ProtectedRoute";
import ResetPassword from "./Auth/ResetPassword";

// Pages
import Dashboard from "./components/Dashboard";
import Ticket from "./components/Ticket";
import Createticket from "./Ticketmanagement/Createticket";
import Ticketdetails from "./Ticketmanagement/Ticketdetails";
import CsTicketDetail from "./Ticketmanagement/CsTicketDetail";
import TicketTracking from "./Ticketmanagement/TicketTracking";
import UserList from "./Users/UserList";
import AddUser from "./Users/AddUser";
import ResetUserPassword from "./Users/ResetPassword";
import Orders from "./Orders/Orders";
import PaymentStatus from "./Orders/PaymentStatus";
import CommunicationTools from "./components/CommunicationTools";
import CustomerInformation from "./components/CustomerInformation";
import AutomationProductivity from "./components/AutomationProductivity";
import ReportsAnalytics from "./components/ReportAnalysis";
import CustomerFeedback from "./Users/CustomerFeedback";
import Integration from "./Users/Integration";
import CommunicationDetails from "./components/CommunicationDetails";

// Tailwind entry
// import "./cs.css";

export default function CsRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="login" element={<Login />} />

      {/* Reset Password */}
      <Route path="reset-password" element={<ResetPassword />} />

      {/* Dashboard */}
      <Route
        path=""
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="ticket"
        element={
          <ProtectedRoute>
            <Ticket />
          </ProtectedRoute>
        }
      />

      <Route
        path="createticket"
        element={
          <ProtectedRoute>
            <Createticket />
          </ProtectedRoute>
        }
      />

      <Route
        path="ticketdetails/:id"
        element={
          <ProtectedRoute>
            <CsTicketDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="ticketdetails"
        element={
          <ProtectedRoute>
            <Ticketdetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="tickettracking"
        element={
          <ProtectedRoute>
            <TicketTracking />
          </ProtectedRoute>
        }
      />

      <Route
        path="user-list"
        element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        }
      />

      <Route
        path="add-user"
        element={
          <ProtectedRoute>
            <AddUser />
          </ProtectedRoute>
        }
      />

      <Route
        path="reset-user-password"
        element={
          <ProtectedRoute>
            <ResetUserPassword />
          </ProtectedRoute>
        }
      />

      <Route
        path="orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />

      <Route
        path="payment-status"
        element={
          <ProtectedRoute>
            <PaymentStatus />
          </ProtectedRoute>
        }
      />

      <Route
        path="communicationtools"
        element={
          <ProtectedRoute>
            <CommunicationTools />
          </ProtectedRoute>
        }
      />

      <Route
        path="customerInformation"
        element={
          <ProtectedRoute>
            <CustomerInformation />
          </ProtectedRoute>
        }
      />

      <Route
        path="reportanalysis"
        element={
          <ProtectedRoute>
            <ReportsAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="customerfeedback"
        element={
          <ProtectedRoute>
            <CustomerFeedback />
          </ProtectedRoute>
        }
      />

      <Route
        path="integration"
        element={
          <ProtectedRoute>
            <Integration />
          </ProtectedRoute>
        }
      />

      <Route
        path="automation"
        element={
          <ProtectedRoute>
            <AutomationProductivity />
          </ProtectedRoute>
        }
      />

      <Route
        path="communicationdetails"
        element={
          <ProtectedRoute>
            <CommunicationDetails />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
