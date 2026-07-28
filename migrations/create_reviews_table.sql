CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    rating INTEGER DEFAULT 5,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
