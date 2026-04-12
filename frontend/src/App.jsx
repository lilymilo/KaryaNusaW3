import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { WalletProvider } from './context/WalletContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CreateProductPage = lazy(() => import('./pages/CreateProductPage'));
const EditProductPage = lazy(() => import('./pages/EditProductPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const ThreadDetailPage = lazy(() => import('./pages/ThreadDetailPage'));
const QuotePage = lazy(() => import('./pages/QuotePage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  
  if (!user) return <Navigate to="/login" />;

  const isProfileIncomplete = !user.username || !user.shop_name;
  if (isProfileIncomplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" state={{ requireSetup: true }} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  
  if (user) {
    if (!user.username) {
      return <Navigate to="/profile" />;
    }
    return <Navigate to="/home" />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/order-success/:id" element={<PrivateRoute><OrderSuccessPage /></PrivateRoute>} />
        <Route path="/create-product" element={<PrivateRoute><CreateProductPage /></PrivateRoute>} />
        <Route path="/edit-product/:id" element={<PrivateRoute><EditProductPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/shop/:username" element={<PrivateRoute><ShopPage /></PrivateRoute>} />
        <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
        <Route path="/thread/:id" element={<PrivateRoute><ThreadDetailPage /></PrivateRoute>} />
        <Route path="/quote/:id" element={<PrivateRoute><QuotePage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:username" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
          <CartProvider>
            <AppRoutes />
            <Toaster
              position="top-center"
              containerStyle={{ top: 72, zIndex: 9999 }}
              gutter={6}
              toastOptions={{
                duration: 2500,
                className: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg font-medium !text-sm !max-w-[85vw] sm:!max-w-sm !py-2 !px-3 !pr-8',
                style: {
                  borderRadius: '14px',
                  fontSize: '13px',
                  lineHeight: '1.3',
                  pointerEvents: 'auto',
                },
                success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 3500 },
              }}
            >
              {(t) => (
                <ToastBar toast={t} style={{ ...t.style, padding: '8px 12px' }}>
                  {({ icon, message }) => (
                    <div className="flex items-center w-full gap-2">
                      <div className="flex-shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0 text-[13px] leading-tight line-clamp-2">{message}</div>
                      {t.type !== 'loading' && (
                        <button 
                          onClick={() => toast.dismiss(t.id)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Tutup"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </ToastBar>
              )}
            </Toaster>
          </CartProvider>
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
