import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import ProductDetail from './pages/ProductDetail'
import StockIn from './pages/StockIn'
import StockAdjustment from './pages/StockAdjustment'
import ProductReports from './pages/ProductReports'
import ProductMaster from './pages/ProductMaster'
import Stores from './pages/Stores'
import StoreForm from './pages/StoreForm'
import StoreDetail from './pages/StoreDetail'
import StoreReports from './pages/StoreReports'
import Orders from './pages/Orders'
import OrderCreate from './pages/OrderCreate'
import OrderManagement from './pages/OrderManagement'
import OrderNew from './pages/OrderNew'
import OrderDetail from './pages/OrderDetail'
import Deliveries from './pages/Deliveries'
import DeliveryManagement from './pages/DeliveryManagement'
import DeliverySchedule from './pages/DeliverySchedule'
import DeliveryDetail from './pages/DeliveryDetail'
import DriverMode from './pages/DriverMode'
import Employees from './pages/Employees'
import EmployeeForm from './pages/EmployeeForm'
import Finance from './pages/Finance'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/edit/:id" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/stock-in" element={<StockIn />} />
          <Route path="/stock-adjustment" element={<StockAdjustment />} />
          <Route path="/product-reports" element={<ProductReports />} />
          <Route path="/product-master" element={<ProductMaster />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/stores/new" element={<StoreForm />} />
          <Route path="/stores/edit/:id" element={<StoreForm />} />
          <Route path="/stores/:id" element={<StoreDetail />} />
          <Route path="/store-reports" element={<StoreReports />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/create" element={<OrderCreate />} />
          <Route path="/order-management" element={<OrderManagement />} />
          <Route path="/orders/new" element={<OrderNew />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/delivery-management" element={<DeliveryManagement />} />
          <Route path="/deliveries/schedule" element={<DeliverySchedule />} />
          <Route path="/deliveries/:id" element={<DeliveryDetail />} />
          <Route path="/driver-mode" element={<DriverMode />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeForm />} />
          <Route path="/employees/edit/:id" element={<EmployeeForm />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
