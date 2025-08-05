CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) UNIQUE NOT NULL,  
    username VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP                      
);


CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    transaction_date DATETIME NOT NULL,
    narration VARCHAR(255) NOT NULL DEFAULT "",
    debit_amount DECIMAL(10, 2) ,
    credit_amount DECIMAL(10, 2) ,
    product VARCHAR(1000),
    mode VARCHAR(50),
    tag VARCHAR(50),
    source VARCHAR(50),
    filename VARCHAR(50),
    month_year VARCHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(transaction_date, '%Y-%m')) STORED,
    created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    last_updated_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE product_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    product VARCHAR(255) NOT NULL,
    tag VARCHAR(255) NULL,
    created_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    last_updated_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TRIGGER update_transactions_tag
AFTER UPDATE ON product_tags
FOR EACH ROW
UPDATE transactions
SET tag = NEW.tag
WHERE session_id = NEW.session_id
AND product = NEW.product;


CREATE INDEX idx_session_id ON transactions (session_id);
CREATE INDEX idx_session_expiry ON sessions (expires_at);
CREATE INDEX idx_session_expense_data ON expense_data (session_id);
