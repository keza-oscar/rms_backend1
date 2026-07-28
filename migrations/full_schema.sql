-- ============================================================================
-- RESTAURANT MANAGEMENT SYSTEM - FULL DATABASE SCHEMA
-- ============================================================================

-- Categories
CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

-- Suppliers
CREATE TABLE IF NOT EXISTS supplier (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT
);

-- User Accounts
CREATE TABLE IF NOT EXISTS useraccount (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL
);

-- Customers
CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255)
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_item (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES category(category_id),
    price NUMERIC(10, 2),
    description TEXT,
    availability BOOLEAN DEFAULT true,
    image_url TEXT
);

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_table (
    table_id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL,
    capacity INTEGER DEFAULT 4,
    status VARCHAR(50) DEFAULT 'Available'
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customer(customer_id),
    staff_id INTEGER DEFAULT 1,
    table_id INTEGER REFERENCES restaurant_table(table_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending'
);

-- Order Details
CREATE TABLE IF NOT EXISTS order_detail (
    detail_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    item_id INTEGER REFERENCES menu_item(item_id),
    quantity INTEGER DEFAULT 1,
    subtotal NUMERIC(10, 2) DEFAULT 0
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 0,
    unit VARCHAR(50),
    reorder_level NUMERIC(10, 2) DEFAULT 10,
    supplier_id INTEGER REFERENCES supplier(supplier_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payment (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    amount NUMERIC(10, 2),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    number_of_guests INTEGER DEFAULT 2,
    special_requests TEXT,
    status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Categories
INSERT INTO category (category_name) VALUES
    ('Appetizers'), ('Main Course'), ('Beverages'), ('Desserts'), ('Sides')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO supplier (supplier_name, phone, email) VALUES
    ('Fresh Produce Co', '+255 712 345 678', 'info@freshproduce.co'),
    ('Beverage Distributors', '+255 723 456 789', 'contact@bevdist.co'),
    ('Meat & Fish Supply', '+255 734 567 890', 'orders@meatsupply.co')
ON CONFLICT DO NOTHING;

-- Menu Items
INSERT INTO menu_item (item_name, category_id, price, description, availability, image_url) VALUES
    ('Samosa', 1, 3000, 'Crispy pastry filled with spiced meat and vegetables', true, '/images/menu/samosa.jpg'),
    ('Chapati', 5, 2000, 'Soft layered flatbread, perfect with any dish', true, '/images/menu/chapati.jpg'),
    ('Ugali with Fish', 2, 8000, 'Traditional ugali served with grilled tilapia fish', true, '/images/menu/ugali-fish.jpg'),
    ('Mango Juice', 3, 3500, 'Freshly squeezed tropical mango juice', true, '/images/menu/mango-juice.jpg'),
    ('Chocolate Cake', 4, 5000, 'Rich and moist chocolate cake slice', true, '/images/menu/chocolate-cake.jpg'),
    ('Pilau Rice', 2, 6000, 'Aromatic spiced rice cooked with meat', true, NULL),
    ('Nyama Choma', 2, 12000, 'Grilled meat platter with kachumbari', true, NULL),
    ('Chips Mayai', 2, 5000, 'Tanzanian-style French fry omelette', true, NULL),
    ('Passion Juice', 3, 3000, 'Fresh passion fruit juice', true, NULL),
    ('Mandazi', 1, 1500, 'Sweet fried dough, great with tea', true, NULL)
ON CONFLICT DO NOTHING;

-- User Accounts
INSERT INTO useraccount (username, password, role_id) VALUES
    ('admin', 'admin123', 1),
    ('manager', 'manager123', 2),
    ('cashier', 'cashier123', 3),
    ('waiter', 'waiter123', 4),
    ('chef', 'chef123', 5),
    ('auditor', 'auditor123', 6)
ON CONFLICT DO NOTHING;

-- Restaurant Tables
INSERT INTO restaurant_table (table_number, capacity, status) VALUES
    (1, 4, 'Available'),
    (2, 4, 'Available'),
    (3, 6, 'Available'),
    (4, 2, 'Available'),
    (5, 8, 'Available'),
    (6, 4, 'Available'),
    (7, 2, 'Available'),
    (8, 6, 'Available')
ON CONFLICT DO NOTHING;

-- Inventory
INSERT INTO inventory (item_name, quantity, unit, reorder_level, supplier_id) VALUES
    ('Rice', 50, 'kg', 10, 1),
    ('Flour', 30, 'kg', 8, 1),
    ('Cooking Oil', 20, 'liters', 5, 1),
    ('Tilapia Fish', 15, 'kg', 5, 3),
    ('Chicken', 20, 'kg', 5, 3),
    ('Beef', 25, 'kg', 8, 3),
    ('Mangoes', 10, 'kg', 5, 1),
    ('Passion Fruit', 5, 'kg', 3, 1),
    ('Chocolate', 3, 'kg', 2, 1),
    ('Sugar', 10, 'kg', 5, 1)
ON CONFLICT DO NOTHING;
