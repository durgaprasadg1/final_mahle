DROP FUNCTION IF EXISTS get_next_batch_in_shift(INTEGER, shift_type, DATE) CASCADE;
DROP FUNCTION IF EXISTS generate_batch_number(INTEGER, shift_type, INTEGER, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_shift_production(INTEGER, shift_type, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_daily_production_summary(INTEGER, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_batches_by_shift(INTEGER, shift_type, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_used_time_slots(INTEGER, shift_type, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS tier_templates CASCADE;
DROP TABLE IF EXISTS cell_templates CASCADE;
DROP TABLE IF EXISTS fractile_templates CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_fractiles CASCADE;
DROP TABLE IF EXISTS product_cells CASCADE;
DROP TABLE IF EXISTS product_tiers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;


DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS product_type;
DROP TYPE IF EXISTS shift_type;

CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE user_status AS ENUM ('active', 'blocked');
CREATE TYPE product_type AS ENUM ('coolers', 'radiators', 'pumps', 'fuel_tanks', 'other');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');


CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'active',
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    permissions VARCHAR(255) DEFAULT 'create,read,update, delete',
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
    description TEXT,
    specifications VARCHAR(1000), 
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE product_fractiles (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cell_id INTEGER,
    name VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_fractile UNIQUE(product_id, name)
);


CREATE TABLE product_cells (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tier_id INTEGER,
    name VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_cell UNIQUE(product_id, name)
);

CREATE TABLE product_tiers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_tier UNIQUE(product_id, name)
);

ALTER TABLE product_cells
ADD CONSTRAINT fk_product_cells_tier
FOREIGN KEY (tier_id) REFERENCES product_tiers(id) ON DELETE CASCADE;

ALTER TABLE product_fractiles
ADD CONSTRAINT fk_product_fractiles_cell
FOREIGN KEY (cell_id) REFERENCES product_cells(id) ON DELETE CASCADE;

-- Templates for reusable components (global) with hierarchy: Fractile → Cell → Tier
CREATE TABLE fractile_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cell_templates (
    id SERIAL PRIMARY KEY,
    fractile_id INTEGER NOT NULL REFERENCES fractile_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cell_per_fractile UNIQUE(fractile_id, name)
);

CREATE TABLE tier_templates (
    id SERIAL PRIMARY KEY,
    cell_id INTEGER NOT NULL REFERENCES cell_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tier_per_cell UNIQUE(cell_id, name)
);

CREATE INDEX idx_cell_templates_fractile ON cell_templates(fractile_id);
CREATE INDEX idx_tier_templates_cell ON tier_templates(cell_id);

CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    quantity_produced INTEGER NOT NULL DEFAULT 0,
    
    shift shift_type NOT NULL, 
    batch_in_shift INTEGER NOT NULL, 
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    start_time TIME NOT NULL, 
    end_time TIME NOT NULL,   
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    had_delay VARCHAR(3) DEFAULT 'no',
    delay_reason TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
    CONSTRAINT batch_in_shift_positive CHECK (batch_in_shift > 0),
    CONSTRAINT unique_product_shift_time UNIQUE(product_id, shift, batch_date, start_time)
);


CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_unit ON products(unit_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_product_fractiles_product ON product_fractiles(product_id);
CREATE INDEX idx_product_fractiles_cell ON product_fractiles(cell_id);
CREATE INDEX idx_product_cells_product ON product_cells(product_id);
CREATE INDEX idx_product_cells_tier ON product_cells(tier_id);
CREATE INDEX idx_product_tiers_product ON product_tiers(product_id);
CREATE UNIQUE INDEX ux_product_cells_tier_unique ON product_cells(tier_id) WHERE tier_id IS NOT NULL;
CREATE UNIQUE INDEX ux_product_fractiles_cell_unique ON product_fractiles(cell_id) WHERE cell_id IS NOT NULL;
CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_batches_unit ON batches(unit_id);
CREATE INDEX idx_batches_shift ON batches(shift);
CREATE INDEX idx_batches_date_shift ON batches(batch_date, shift);
CREATE INDEX idx_batches_product_date ON batches(product_id, batch_date);


INSERT INTO units (name, code, description, location) VALUES 
('Unit Alpha', 'U-ALPHA', 'Primary manufacturing unit for cooling systems', 'Building A - Floor 1'),
('Unit Beta', 'U-BETA', 'Radiator production and assembly unit', 'Building B - Floor 2'),
('Unit Gamma', 'U-GAMMA', 'Pump manufacturing and testing facility', 'Building C - Floor 1'),
('Unit Delta', 'U-DELTA', 'Fuel tank production unit', 'Building D - Floor 3'),
('Unit Epsilon', 'U-EPSILON', 'Multi-purpose manufacturing unit', 'Building E - Floor 2');


INSERT INTO users (email, password, name, role, status, permissions) VALUES 
('admin@mahle.com', '$2a$10$K8zX6aJ3yYqX3X3X3X3X3.rJ/k8Kx8J8Kx8J8Kx8J8Kx8J8Kx8J8K', 'System Administrator', 'admin', 'active', 'create,read,update,delete');


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fractile_templates_updated_at BEFORE UPDATE ON fractile_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cell_templates_updated_at BEFORE UPDATE ON cell_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tier_templates_updated_at BEFORE UPDATE ON tier_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Get next batch sequence number for a specific product, shift, and date
CREATE OR REPLACE FUNCTION get_next_batch_in_shift(
    p_product_id INTEGER,
    p_shift shift_type,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
    next_batch INTEGER;
BEGIN
    SELECT COALESCE(MAX(batch_in_shift), 0) + 1
    INTO next_batch
    FROM batches
    WHERE product_id = p_product_id
    AND shift = p_shift
    AND batch_date = p_date;
    
    RETURN next_batch;
END;
$$ LANGUAGE plpgsql;

-- Get total production for a shift
CREATE OR REPLACE FUNCTION get_shift_production(
    p_unit_id INTEGER,
    p_shift shift_type,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    total_batches BIGINT,
    total_quantity BIGINT,
    products_produced TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_batches,
        COALESCE(SUM(quantity_produced), 0)::BIGINT as total_quantity,
        ARRAY_AGG(DISTINCT p.name) as products_produced
    FROM batches b
    JOIN products p ON b.product_id = p.id
    WHERE b.unit_id = p_unit_id
    AND b.shift = p_shift
    AND b.batch_date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily production summary
CREATE OR REPLACE FUNCTION get_daily_production_summary(
    p_unit_id INTEGER,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    shift shift_type,
    total_batches BIGINT,
    total_quantity BIGINT,
    avg_quantity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.shift,
        COUNT(*)::BIGINT as total_batches,
        SUM(b.quantity_produced)::BIGINT as total_quantity,
        ROUND(AVG(b.quantity_produced), 2) as avg_quantity
    FROM batches b
    WHERE b.unit_id = p_unit_id
    AND b.batch_date = p_date
    GROUP BY b.shift
    ORDER BY 
        CASE b.shift
            WHEN 'morning' THEN 1
            WHEN 'afternoon' THEN 2
            WHEN 'night' THEN 3
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get all batches for a specific shift on a specific date
CREATE OR REPLACE FUNCTION get_batches_by_shift(
    p_unit_id INTEGER,
    p_shift shift_type,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    batch_id INTEGER,
    product_name VARCHAR,
    quantity_produced INTEGER,
    batch_in_shift INTEGER,
    start_time TIME,
    end_time TIME,
    status VARCHAR,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        p.name,
        b.quantity_produced,
        b.batch_in_shift,
        b.start_time,
        b.end_time,
        b.status,
        b.notes
    FROM batches b
    JOIN products p ON b.product_id = p.id
    WHERE b.unit_id = p_unit_id
    AND b.shift = p_shift
    AND b.batch_date = p_date
    ORDER BY b.batch_in_shift;
END;
$$ LANGUAGE plpgsql;

-- Function to get used time slots for a specific product on a date and shift
CREATE OR REPLACE FUNCTION get_used_time_slots(
    p_product_id INTEGER,
    p_shift shift_type,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    start_time TIME,
    end_time TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.start_time,
        b.end_time
    FROM batches b
    WHERE b.product_id = p_product_id
    AND b.shift = p_shift
    AND b.batch_date = p_date
    ORDER BY b.start_time;
END;
$$ LANGUAGE plpgsql;


COMMENT ON TABLE units IS 'Manufacturing units table';
COMMENT ON TABLE users IS 'System users (admin and unit users)';
COMMENT ON TABLE products IS 'Products manufactured in each unit';
COMMENT ON TABLE product_fractiles IS 'Fractile components for each product';
COMMENT ON TABLE product_cells IS 'Cell components for each product';
COMMENT ON TABLE product_tiers IS 'Tier components for each product';
COMMENT ON TABLE batches IS 'Manufacturing batches with shift tracking and batch sequence per shift';

