// ============================================================================
// RESTAURANT MANAGEMENT SYSTEM - EXPRESS BACKEND
// Group 8 - DIT Backend - CLEAN VERSION
// ============================================================================

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
});

// ============================================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ============================================================================
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role_id;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'OK',
            timestamp: result.rows[0].now,
            database: 'Connected'
        });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
});

// ============================================================================
// LOGIN ENDPOINT
// ============================================================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const result = await pool.query(
            'SELECT ua.user_id, ua.username, ua.password, ua.role_id FROM useraccount ua WHERE ua.username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role_id: user.role_id
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                role_id: user.role_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

app.get('/api/customers', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customer ORDER BY customer_id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
    try {
        const { first_name, last_name, phone, email } = req.body;
        const result = await pool.query(
            'INSERT INTO customer (first_name, last_name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [first_name, last_name, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================================================
// MENU ENDPOINTS
// ============================================================================

app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                mi.item_id,
                mi.item_name,
                mi.price,
                mi.description,
                mi.availability,
                mi.image_url,
                c.category_name 
            FROM menu_item mi
            LEFT JOIN category c ON mi.category_id = c.category_id
            ORDER BY c.category_name, mi.item_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/menu', authenticateToken, checkRole([1, 4, 5]), async (req, res) => {
    try {
        const { item_name, category_id, price, description, availability } = req.body;
        const result = await pool.query(
            'INSERT INTO menu_item (item_name, category_id, price, description, availability) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [item_name, category_id, price, description, availability !== false]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/menu/:id', authenticateToken, checkRole([1, 4, 5]), async (req, res) => {
    try {
        const { item_name, price, description, availability } = req.body;
        const result = await pool.query(
            'UPDATE menu_item SET item_name = $1, price = $2, description = $3, availability = $4 WHERE item_id = $5 RETURNING *',
            [item_name, price, description, availability, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/menu/:id', authenticateToken, checkRole([1, 4, 5]), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM menu_item WHERE item_id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================================================
// ORDERS ENDPOINTS
// ============================================================================

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, c.first_name as customer_name 
            FROM orders o
            LEFT JOIN customer c ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { customer_id, staff_id, table_id, items } = req.body;

        await client.query('BEGIN');

        const orderResult = await client.query(
            'INSERT INTO orders (customer_id, staff_id, table_id, order_date, status) VALUES ($1, $2, $3, NOW(), $4) RETURNING order_id',
            [customer_id || null, staff_id || 1, table_id || null, 'Pending']
        );

        const order_id = orderResult.rows[0].order_id;

        if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                await client.query(
                    'INSERT INTO order_detail (order_id, item_id, quantity, subtotal) VALUES ($1, $2, $3, $4)',
                    [order_id, item.item_id, item.quantity, item.subtotal || 0]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            order_id,
            status: 'Pending',
            message: 'Order created successfully'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================================================
// INVENTORY ENDPOINTS
// ============================================================================

app.get('/api/inventory', authenticateToken, checkRole([1, 2, 5, 6]), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, s.supplier_name 
            FROM inventory i
            LEFT JOIN supplier s ON i.supplier_id = s.supplier_id
            ORDER BY i.item_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/inventory/low-stock', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM inventory WHERE quantity < reorder_level ORDER BY quantity ASC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', authenticateToken, checkRole([1, 2]), async (req, res) => {
    try {
        const { item_name, quantity, unit, reorder_level, supplier_id } = req.body;
        const result = await pool.query(
            'INSERT INTO inventory (item_name, quantity, unit, reorder_level, supplier_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [item_name, quantity, unit, reorder_level, supplier_id || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', authenticateToken, checkRole([1, 2]), async (req, res) => {
    try {
        const { quantity, reorder_level } = req.body;
        const result = await pool.query(
            'UPDATE inventory SET quantity = $1, reorder_level = $2 WHERE inventory_id = $3 RETURNING *',
            [quantity, reorder_level, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/inventory/:id', authenticateToken, checkRole([1, 2]), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM inventory WHERE inventory_id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        res.json({ message: 'Inventory item deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================================================
// PAYMENT ENDPOINTS
// ============================================================================

app.post('/api/payments', authenticateToken, checkRole([1, 3]), async (req, res) => {
    try {
        const { order_id, amount, payment_method } = req.body;

        const result = await pool.query(
            'INSERT INTO payment (order_id, amount, payment_method, payment_status) VALUES ($1, $2, $3, $4) RETURNING *',
            [order_id, amount, payment_method, 'Completed']
        );

        await pool.query('UPDATE orders SET status = $1 WHERE order_id = $2', ['Completed', order_id]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/payments/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment WHERE payment_id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

app.get('/api/reports/daily-sales', authenticateToken, checkRole([1, 2, 6]), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_orders,
                COALESCE(SUM(
                    (SELECT COALESCE(SUM(subtotal), 0) FROM order_detail WHERE order_id = orders.order_id)
                ), 0) as total_revenue
            FROM orders
            WHERE DATE(order_date) = CURRENT_DATE
        `);
        res.json(result.rows[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/top-items', authenticateToken, checkRole([1, 2, 6]), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                mi.item_id,
                mi.item_name,
                SUM(od.quantity) as total_quantity,
                SUM(od.subtotal) as total_revenue
            FROM order_detail od
            JOIN menu_item mi ON od.item_id = mi.item_id
            GROUP BY mi.item_id, mi.item_name
            ORDER BY total_quantity DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// CATEGORIES ENDPOINTS
// ============================================================================

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM category ORDER BY category_name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// TABLES ENDPOINTS
// ============================================================================

app.get('/api/tables', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurant_table ORDER BY table_number');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     RESTAURANT MANAGEMENT SYSTEM (RMS)         ║
║            Group 8 - DIT Backend               ║
╚════════════════════════════════════════════════╝
✓ Server running on port ${PORT}
✓ Database: ${process.env.DB_NAME || 'rms_db'}
✓ Environment: ${process.env.NODE_ENV || 'development'}
✓ API URL: http://localhost:${PORT}/api

Ready for demo! 🚀
    `);
});

module.exports = app;
