-- Tabel Master Data untuk Product Types
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Master Data untuk Districts (Kecamatan)
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Master Data untuk Units (Satuan)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default Product Types
INSERT INTO product_types (name) VALUES
  ('Urea'),
  ('NPK'),
  ('TSP'),
  ('ZA'),
  ('Organik'),
  ('KCL'),
  ('Phonska')
ON CONFLICT (name) DO NOTHING;

-- Insert default Districts (Kecamatan Banyuwangi)
INSERT INTO districts (name) VALUES
  ('Banyuwangi'),
  ('Giri'),
  ('Kalipuro'),
  ('Glagah'),
  ('Licin'),
  ('Songgon'),
  ('Singojuruh'),
  ('Cluring'),
  ('Gambiran'),
  ('Tegaldlimo'),
  ('Purwoharjo'),
  ('Muncar'),
  ('Siliragung'),
  ('Bangorejo'),
  ('Pesanggaran'),
  ('Srono'),
  ('Genteng'),
  ('Glenmore'),
  ('Kalibaru'),
  ('Kabat'),
  ('Rogojampi'),
  ('Wongsorejo'),
  ('Sempu'),
  ('Tegalsari')
ON CONFLICT (name) DO NOTHING;

-- Insert default Units
INSERT INTO units (name) VALUES
  ('Karung'),
  ('Kg'),
  ('Ton'),
  ('Liter'),
  ('Sak')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_types_name ON product_types(name);
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);
CREATE INDEX IF NOT EXISTS idx_units_name ON units(name);
