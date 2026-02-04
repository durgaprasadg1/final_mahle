-- Mahle Inventory Management System Database Schema
-- PostgreSQL Database

-- Drop existing tables if they exist
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS product_type;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE user_status AS ENUM ('active', 'blocked');
CREATE TYPE product_type AS ENUM ('coolers', 'radiators', 'pumps', 'fuel_tanks', 'other');

-- Units Table (5 manufacturing units)
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Admin and Users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'active',
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{"create": true, "read": true, "update": true, "delete": false}',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type product_type NOT NULL,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    fractiles INTEGER DEFAULT 0,
    cells INTEGER DEFAULT 0,
    tiers INTEGER DEFAULT 0,
    description TEXT,
    specifications JSONB,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches Table (1-hour manufacturing batches)
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    quantity_produced INTEGER NOT NULL DEFAULT 0,
    batch_start_time TIMESTAMP NOT NULL,
    batch_end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT batch_duration_check CHECK (batch_end_time > batch_start_time)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_unit ON products(unit_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_batches_unit ON batches(unit_id);
CREATE INDEX idx_batches_time ON batches(batch_start_time, batch_end_time);

-- Insert default units (5 manufacturing units)
INSERT INTO units (name, code, description, location) VALUES
('Unit Alpha', 'U-ALPHA', 'Primary manufacturing unit for cooling systems', 'Building A - Floor 1'),
('Unit Beta', 'U-BETA', 'Radiator production and assembly unit', 'Building B - Floor 2'),
('Unit Gamma', 'U-GAMMA', 'Pump manufacturing and testing facility', 'Building C - Floor 1'),
('Unit Delta', 'U-DELTA', 'Fuel tank production unit', 'Building D - Floor 3'),
('Unit Epsilon', 'U-EPSILON', 'Multi-purpose manufacturing unit', 'Building E - Floor 2');

-- Insert default admin user (password: admin123 - hashed with bcrypt)
-- Password hash for 'admin123': $2a$10$rJ7qYZ9QxXxqYZ9QxXxqYehKGZW3bZvKZW3bZvKZW3bZvKZW3bZvK
INSERT INTO users (email, password, name, role, status, permissions) VALUES
('admin@mahle.com', '$2a$10$rJ7qYZ9QxXxqYZ9QxXxqYehKGZW3bZvKZW3bZvKZW3bZvKZW3bZvK', 'System Administrator', 'admin', 'active', '{"create": true, "read": true, "update": true, "delete": true}');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
COMMENT ON TABLE units IS 'Manufacturing units table';
COMMENT ON TABLE users IS 'System users (admin and unit users)';
COMMENT ON TABLE products IS 'Products manufactured in each unit';
COMMENT ON TABLE batches IS 'Manufacturing batches with production data';
