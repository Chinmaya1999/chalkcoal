import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Story from './pages/Story';
import Product from './pages/Product';
import { useSeo } from './seo';

// Only the storefront pages above ship in the first download; everything else loads on demand.
const Checkout = lazy(() => import('./pages/Checkout'));
const Order = lazy(() => import('./pages/Order'));
const Login = lazy(() => import('./pages/Login'));
const Account = lazy(() => import('./pages/Account'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const Products = lazy(() => import('./admin/Products'));
const ProductForm = lazy(() => import('./admin/ProductForm'));
const Orders = lazy(() => import('./admin/Orders'));
const Customers = lazy(() => import('./admin/Customers'));
const Coupons = lazy(() => import('./admin/Coupons'));
const Site = lazy(() => import('./admin/Site'));

function NotFound() {
  useSeo({ title: 'Page not found', noindex: true });
  return <div className="empty wrap" style={{ minHeight: '50vh' }}><h1>Page not found</h1><a href="/shop" className="link">Continue shopping</a></div>;
}

export default function App() {
  return (
    <Suspense fallback={<div className="empty muted" style={{ minHeight: '60vh' }}>Loading…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="men" element={<Shop gender="men" />} />
          <Route path="women" element={<Shop gender="women" />} />
          <Route path="story" element={<Story />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/:number" element={<Order />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Login register />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="customers" element={<Customers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="site" element={<Site />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
