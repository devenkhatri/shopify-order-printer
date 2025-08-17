-- Production Database Setup for Shopify Order Printer App
-- This script creates the necessary tables for production deployment

-- Create sessions table for Shopify authentication
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    shop VARCHAR(255) NOT NULL,
    state VARCHAR(255),
    isOnline BOOLEAN DEFAULT FALSE,
    scope VARCHAR(1000),
    expires TIMESTAMP,
    accessToken VARCHAR(255),
    userId VARCHAR(255),
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255),
    accountOwner BOOLEAN DEFAULT FALSE,
    locale VARCHAR(10),
    collaborator BOOLEAN DEFAULT FALSE,
    emailVerified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on shop for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_shop ON sessions(shop);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Create app_settings table for storing app configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop VARCHAR(255) NOT NULL UNIQUE,
    store_state VARCHAR(100) DEFAULT 'Gujarat',
    gstin VARCHAR(15),
    business_name VARCHAR(255),
    business_address TEXT,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    gst_rate_below_1000 DECIMAL(4,3) DEFAULT 0.050,
    gst_rate_above_1000 DECIMAL(4,3) DEFAULT 0.120,
    default_template_id VARCHAR(255),
    settings_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create templates table for storing custom templates
CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(255) PRIMARY KEY,
    shop VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    layout_config JSON,
    business_info JSON,
    styling_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on shop for templates
CREATE INDEX IF NOT EXISTS idx_templates_shop ON templates(shop);
CREATE INDEX IF NOT EXISTS idx_templates_default ON templates(shop, is_default);

-- Create print_jobs table for tracking bulk print operations
CREATE TABLE IF NOT EXISTS print_jobs (
    id VARCHAR(255) PRIMARY KEY,
    shop VARCHAR(255) NOT NULL,
    job_type ENUM('pdf', 'csv') NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    order_ids JSON,
    date_range_start DATE,
    date_range_end DATE,
    file_path VARCHAR(500),
    file_size BIGINT,
    error_message TEXT,
    progress_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Create indexes for print jobs
CREATE INDEX IF NOT EXISTS idx_print_jobs_shop ON print_jobs(shop);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created ON print_jobs(created_at);

-- Create webhook_logs table for monitoring webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop VARCHAR(255) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    webhook_id VARCHAR(255),
    payload JSON,
    headers JSON,
    status ENUM('received', 'processed', 'failed') DEFAULT 'received',
    error_message TEXT,
    processing_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL
);

-- Create indexes for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_shop ON webhook_logs(shop);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_topic ON webhook_logs(topic);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at);

-- Create app_installations table for tracking app installs/uninstalls
CREATE TABLE IF NOT EXISTS app_installations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop VARCHAR(255) NOT NULL UNIQUE,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uninstalled_at TIMESTAMP NULL,
    installation_data JSON,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index on shop for installations
CREATE INDEX IF NOT EXISTS idx_installations_shop ON app_installations(shop);
CREATE INDEX IF NOT EXISTS idx_installations_active ON app_installations(is_active);

-- Insert default GST rates and settings
INSERT IGNORE INTO app_settings (shop, store_state, gst_rate_below_1000, gst_rate_above_1000) 
VALUES ('default', 'Gujarat', 0.050, 0.120);

-- Create a view for active sessions
CREATE OR REPLACE VIEW active_sessions AS
SELECT * FROM sessions 
WHERE expires IS NULL OR expires > NOW();

-- Create a view for recent webhook activity
CREATE OR REPLACE VIEW recent_webhook_activity AS
SELECT 
    shop,
    topic,
    status,
    COUNT(*) as count,
    MAX(created_at) as last_received,
    AVG(processing_time_ms) as avg_processing_time
FROM webhook_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY shop, topic, status;

-- Create a view for print job statistics
CREATE OR REPLACE VIEW print_job_stats AS
SELECT 
    shop,
    job_type,
    status,
    COUNT(*) as job_count,
    AVG(file_size) as avg_file_size,
    MAX(created_at) as last_job_created
FROM print_jobs 
GROUP BY shop, job_type, status;