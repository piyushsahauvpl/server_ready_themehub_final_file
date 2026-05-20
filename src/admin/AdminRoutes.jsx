import { Routes, Route, Navigate } from "react-router-dom";
 
// Auth
import Login from "./Auth/Login";
import ProtectedRoute from "./Auth/ProtectedRoute";
import ResetPassword from "./Auth/ResetPassword";
 
// Pages
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import AddProduct from "./Products/AddProduct";
import Orders from "./Orders/Orders";
import UserList from "./Users/UserList";
import AddUser from "./Users/AddUser";
import PaymentStatus from "./Orders/PaymentStatus";
import AddBlog from "./Blog/AddBlog";
import ViewBlogs from "./Blog/ViewBlogs";
import Categories from "./Products/Categories";
import ProductApproval from "./Products/ProductApproval";
import FeaturedProducts from "./Products/FeaturedProducts";
import SellerList from "./Sellers/SellerList";
import SellerApproval from "./Sellers/SellerApproval";
import WithdrawRequests from "./WithdrawRequests";
import EarningsApproval from "./EarningsApproval";
import WalletDashboard from "./WalletDashboard";
import SellerWallets from "./SellerWallets";
import WalletTransactions from "./WalletTransactions";
import PayoutHistory from "./PayoutHistory";
import Refundproduct from "./Products/Refundproduct";
import ContactMessages from "./components/ContactMessages";
// Tailwind entry
// import "./Admin.css";
 
export default function AdminRoutes() {
  return (
    <Routes>
      {/* Login - PUBLIC (no protection) */}
      <Route
        path="login"
        element={<Login/>}/>
       
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
        path="products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="add-product"
        element={
          <ProtectedRoute>
            <AddProduct />
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
        path="payment-status"
        element={
          <ProtectedRoute>
            <PaymentStatus />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="product-approval"
        element={
          <ProtectedRoute>
            <ProductApproval />
          </ProtectedRoute>
        }
      />

       <Route
        path="refund-products"
        element={
          <ProtectedRoute>
            <Refundproduct />
          </ProtectedRoute>
        }
      />
 
 
      <Route
        path="featured-products"
        element={
          <ProtectedRoute>
            <FeaturedProducts />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="add-blog"
        element={
          <ProtectedRoute>
            <AddBlog />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="blogs"
        element={
          <ProtectedRoute>
            <ViewBlogs />
          </ProtectedRoute>
        }
      />
 
      {/* New Marketplace Features */}
      <Route
        path="sellers"
        element={
          <ProtectedRoute>
            <SellerList />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="seller-approval"
        element={
          <ProtectedRoute>
            <SellerApproval />
          </ProtectedRoute>
        }
      />
 
      <Route
        path="seller-details"
        element={
          <ProtectedRoute>
            <SellerApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="withdraw-requests"
        element={
          <ProtectedRoute>
            <WithdrawRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="earnings-approval"
        element={
          <ProtectedRoute>
            <EarningsApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="wallet-dashboard"
        element={
          <ProtectedRoute>
            <WalletDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="seller-wallets"
        element={
          <ProtectedRoute>
            <SellerWallets />
          </ProtectedRoute>
        }
      />

      <Route
        path="wallet-transactions"
        element={
          <ProtectedRoute>
            <WalletTransactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="payout-history"
        element={
          <ProtectedRoute>
            <PayoutHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="contact-messages"
        element={
          <ProtectedRoute>
            <ContactMessages />
          </ProtectedRoute>
        }
      />
 

 
      {/* Fallback */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
 
 