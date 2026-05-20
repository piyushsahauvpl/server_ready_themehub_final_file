import React, { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
 
 
 
 
// Main website components
import TopNavbar from "./components/TopNavbar";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Chatbot from "./components/Chatbot";
import Categories from "./components/Categories";
import Featured from "./components/Featured";
import TemplateMonster from "./components/TemplateMonster";
import LatestTemplates from "./components/LatestTemplates";
import ItemsSection from "./components/ItemsSection";
import WhyChooseUptula from "./components/WhyChooseUptula";
// import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import RegisterModal from "./components/RegisterModal";
import LoginModal from "./components/LoginModal";
import CartPage from "./components/CartPage.jsx";
import ProductPage from "./components/ProductPage";
import AllCategoriesPage from "./pages/AllCategories";
import Contact from "./components/Contact";
import Blog from "./components/Blog";
import  Payment  from "./pages/Payment";
import BlogDetails from "./pages/BlogDetails";
import Templates from "./pages/Templates";
import Support from "./pages/Support";
import TemplateDetails from "./pages/TemplateDetails";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HtmlCss from "./pages/HtmlCss";
import WordPress from "./pages/WordPress";
import ReactPage from "./pages/ReactPage";
import Showticket from "./pages/Showticket";
import Ticketdetails from "./pages/Ticketdetails";
import Profile from "./pages/Profile";
import About from "./pages/About";
// import Payment from "./pages/Payment";
import Wishlist from "./pages/Wishlist";
import UserPurchases from "./pages/UserPurchases";
import BecomeSeller from "./components/BecomeSeller";
 
import { CartProvider } from "./components/CartContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
 
// Admin & CS
import AdminRoutes from "./admin/AdminRoutes";
import CsRoutes from "./cs/CsRoutes";

import SellerDashboard from "./seller/SellerDashboard";
import SellerProducts from "./seller/SellerProducts";
import AddProduct from "./seller/AddProduct";
import Earnings from "./seller/Earnings";
import Analytics from "./seller/Analytics";
import SellerPaymentPage from "./seller/SellerPaymentPage";
import SellerPurchaseHistory from "./seller/SellerPurchaseHistory";
import WalletPage from "./seller/WalletPage";
import Notifications from "./seller/Notifications";
import SellerProtectedRoute from "./seller/Auth/SellerProtectedRoute";

import AccountSettings from "./seller/AccountSettings";
import TicketList from "./support/TicketList";
import TicketCreate from "./support/TicketCreate";
import TicketDetail from "./support/TicketDetail";
import "./index.css";
import "./HomeLayout.css";
 
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
 
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
 
  // Modal background routing (register / login)
  const background = location.state && location.state.background;
 
  // Listen for auth required event
  useEffect(() => {
    const handleAuthRequired = () => {
      navigate('/login', { state: { background: location } });
    };
    window.addEventListener('authRequired', handleAuthRequired);
    return () => window.removeEventListener('authRequired', handleAuthRequired);
  }, [navigate, location]);
 
  // Detect admin / cs routes
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isCsRoute = location.pathname.startsWith("/cs");
 
  const isPublicRoute = !isAdminRoute && !isCsRoute;

  return (
    <CurrencyProvider>
      <div
        className={`app-shell ${isPublicRoute ? "public-app-shell" : ""}`}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        {/* Hide TopNavbar and Nav on admin & CS */}
        {isPublicRoute && (
          <header className="public-header">
            <TopNavbar />
            <Nav />
          </header>
        )}

        <CartProvider>
          <div className="app-main-shell" style={{ flex: '1 0 auto' }}>
          <Routes location={background || location}>
          {/* ================= MAIN WEBSITE ================= */}
 
          <Route
            path="/"
            element={
              <main className="home-main">
                <Hero />
                <Categories />
                <LatestTemplates />
                <Featured />
                <ItemsSection />
                <WhyChooseUptula />
                <TemplateMonster />
              </main>
            }
          />
 
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route
            path="/register"
            element={<RegisterModal onClose={() => navigate(-1)} />}
          />
          <Route
            path="/login"
            element={<LoginModal onClose={() => navigate(-1)} />}
          />
          <Route path="/allcategories" element={<AllCategoriesPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetails />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/template/:slug" element={<TemplateDetails />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/htmlcss" element={<HtmlCss />} />
          <Route path="/wordpress" element={<WordPress />} />
            <Route path="/react" element={<ReactPage />} />
            <Route path="/payment" element={<Payment />} />
          
          {/* Support tickets for users/sellers */}
          <Route path="/support/tickets" element={<TicketList />} />
          <Route path="/support/tickets/new" element={<TicketCreate />} />
          <Route path="/support/tickets/:id" element={<TicketDetail />} />
          <Route path="/support" element={<Support />} />
          <Route path="/showticket" element={<Showticket />} />
          <Route path="/ticketdetails" element={<Ticketdetails />} />
          <Route path="/profile" element={<Profile />} />
          {/* <Route path="/payment" element={<Payment />} /> */}
          <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/purchases" element={<UserPurchases />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
 
          {/* ================= ADMIN PANEL ================= */}
          <Route path="/admin/*" element={<AdminRoutes />} />
 
          {/* ================= CUSTOMER SUPPORT ================= */}
          <Route path="/cs/*" element={<CsRoutes />} />
          
          {/* ================= SELLER ================= */}
                    <Route path="/seller/dashboard" element={
                      <SellerProtectedRoute>
                        <SellerDashboard />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/purchases" element={
                      <SellerProtectedRoute>
                        <SellerPurchaseHistory />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/products" element={
                      <SellerProtectedRoute>
                        <SellerProducts />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/products/add" element={
                      <SellerProtectedRoute>
                        <AddProduct />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/products/:id/edit" element={
                      <SellerProtectedRoute>
                        <AddProduct />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/earnings" element={
                      <SellerProtectedRoute>
                        <Earnings />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/analytics" element={
                      <SellerProtectedRoute>
                        <Analytics />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/wallet" element={
                      <SellerProtectedRoute>
                        <WalletPage />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/notifications" element={
                      <SellerProtectedRoute>
                        <Notifications />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/payment" element={
                      <SellerProtectedRoute>
                        <SellerPaymentPage />
                      </SellerProtectedRoute>
                    } />
                    <Route path="/seller/account" element={
                      <SellerProtectedRoute>
                        <AccountSettings />
                      </SellerProtectedRoute>
                    } />
          
          {/* Fallback route - redirect any unmatched paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </CartProvider>

      {/* Modal overlay rendering */}
      {background && location.pathname === "/register" && (
        <RegisterModal onClose={() => navigate(-1)} />
      )}
      {background && location.pathname === "/login" && (
        <LoginModal onClose={() => navigate(-1)} />
      )}

      {/* Hide Footer on admin & CS */}
      {!isAdminRoute && !isCsRoute && <Footer />}

      {/* Chatbot - Only on main website */}
      {!isAdminRoute && !isCsRoute && <Chatbot />}
      </div>
    </CurrencyProvider>
  );
}
 
 
