-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions (run this if you get permission errors)
-- GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Tabel Master Data: Jenis Pupuk
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Master Data: Kategori Pupuk
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Master Data: Satuan Kemasan
CREATE TABLE product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default data
INSERT INTO product_types (name, description) VALUES
  ('Urea', 'Pupuk nitrogen dengan kandungan N 46%'),
  ('NPK', 'Pupuk majemuk nitrogen, fosfor, kalium'),
  ('ZA', 'Pupuk Zwavelzure Ammoniak'),
  ('TSP', 'Triple Super Phosphate'),
  ('Organik', 'Pupuk dari bahan organik alami'),
  ('KCL', 'Kalium Klorida');

INSERT INTO product_categories (name, description) VALUES
  ('Nitrogen', 'Pupuk dengan kandungan nitrogen tinggi'),
  ('Fosfat', 'Pupuk dengan kandungan fosfor tinggi'),
  ('Kalium', 'Pupuk dengan kandungan kalium tinggi'),
  ('Majemuk', 'Pupuk dengan kombinasi unsur hara'),
  ('Organik', 'Pupuk dari bahan organik');

INSERT INTO product_units (name, description) VALUES
  ('Karung', 'Kemasan karung standar'),
  ('Sak', 'Kemasan sak besar'),
  ('Ton', 'Satuan berat ton'),
  ('Kg', 'Satuan kilogram'),
  ('Zak', 'Kemasan zak');

-- Tabel Produk (Enhanced)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- Jenis pupuk (Urea, NPK, Organik, dll)
  category VARCHAR(100), -- Kategori (Nitrogen, Fosfat, Kalium, dll)
  unit VARCHAR(50) NOT NULL, -- Satuan kemasan (karung, sak, ton)
  weight_per_sack DECIMAL(10,2), -- Berat per karung (kg)
  cost_price DECIMAL(10,2) NOT NULL, -- Harga modal
  selling_price DECIMAL(10,2) NOT NULL, -- Harga jual normal
  wholesale_price DECIMAL(10,2), -- Harga grosir
  description TEXT, -- Deskripsi produk
  photo_url TEXT, -- URL foto produk
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true, -- Status aktif/nonaktif
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Supplier
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Toko
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  region VARCHAR(100) NOT NULL,
  debt DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Stok Masuk
CREATE TABLE stock_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Custom Pricing (Harga khusus per toko)
CREATE TABLE custom_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2) NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- Tabel Pegawai
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'driver', 'loader'
  wage_per_sack DECIMAL(10,2) DEFAULT 0,
  wage_per_delivery DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Order (Enhanced untuk sistem distribusi pupuk)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_delivery', -- pending_delivery, scheduled, on_delivery, delivered, cancelled
  payment_method VARCHAR(50) NOT NULL, -- cash, transfer, tempo
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid
  due_date DATE, -- Untuk pembayaran tempo
  notes TEXT,
  order_date TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Pengiriman (Enhanced)
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number VARCHAR(50) UNIQUE NOT NULL,
  delivery_date DATE NOT NULL,
  truck_number VARCHAR(50),
  driver_id UUID REFERENCES employees(id),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, on_delivery, delivered, cancelled
  total_orders INTEGER DEFAULT 0,
  total_sacks INTEGER DEFAULT 0,
  route_notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Delivery Orders (Relasi many-to-many antara deliveries dan orders)
CREATE TABLE delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  route_order INTEGER DEFAULT 0, -- Urutan pengiriman
  delivery_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, on_delivery, delivered
  delivered_at TIMESTAMP,
  proof_photo_url TEXT, -- URL foto bukti sampai
  signature_data TEXT, -- Data tanda tangan digital (base64)
  recipient_name VARCHAR(255), -- Nama penerima
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(delivery_id, order_id)
);

-- Tabel Penugasan Pegawai Bongkar Muat
CREATE TABLE delivery_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  sacks_loaded INTEGER DEFAULT 0,
  wage_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Pembayaran (Enhanced)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL, -- cash, transfer
  proof_url TEXT, -- URL bukti transfer
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Surat Jalan
CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  note_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Invoice
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid, overdue
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Stock Logs (Enhanced)
CREATE TABLE stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment', 'damaged'
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reference_type VARCHAR(50), -- 'order', 'stock_in', 'manual', 'damaged'
  reference_id UUID,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes untuk performa
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_delivery_orders_delivery ON delivery_orders(delivery_id);
CREATE INDEX idx_delivery_orders_order ON delivery_orders(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_store ON payments(store_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_stock_logs_product ON stock_logs(product_id);
CREATE INDEX idx_stock_logs_date ON stock_logs(created_at);
CREATE INDEX idx_stock_in_product ON stock_in(product_id);
CREATE INDEX idx_stock_in_date ON stock_in(date);
CREATE INDEX idx_custom_pricing_product ON custom_pricing(product_id);
CREATE INDEX idx_custom_pricing_store ON custom_pricing(store_id);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_orders_updated_at BEFORE UPDATE ON delivery_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function untuk auto-update stock dan create log
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock produk
  UPDATE products 
  SET stock = stock + NEW.quantity 
  WHERE id = NEW.product_id;
  
  -- Create stock log
  INSERT INTO stock_logs (
    product_id, 
    type, 
    quantity, 
    stock_before,
    stock_after,
    reference_type, 
    reference_id,
    notes,
    created_by
  )
  SELECT 
    NEW.product_id,
    'in',
    NEW.quantity,
    stock,
    stock + NEW.quantity,
    'stock_in',
    NEW.id,
    NEW.notes,
    NEW.created_by
  FROM products WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_in_update
AFTER INSERT ON stock_in
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();
