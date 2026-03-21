-- =====================================================
-- MIGRATION V2: Single Salon → Multi-Salon Marketplace
-- Database: glamour_salon → salon_marketplace
-- =====================================================

CREATE DATABASE IF NOT EXISTS salon_marketplace;
USE salon_marketplace;

-- =====================================================
-- CUSTOMERS TABLE (App users who search & book)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_location (latitude, longitude)
);

-- =====================================================
-- SALONS TABLE (Each salon shop registered on platform)
-- =====================================================
CREATE TABLE IF NOT EXISTS salons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    tagline VARCHAR(500),
    description TEXT,
    -- Location
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    -- Contact
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    google_maps_url TEXT,
    -- Working hours
    opening_time TIME DEFAULT '10:00:00',
    closing_time TIME DEFAULT '21:00:00',
    slot_duration INT DEFAULT 30,
    lunch_start TIME DEFAULT '13:00:00',
    lunch_end TIME DEFAULT '14:00:00',
    working_days JSON,
    -- Media
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    photos JSON COMMENT 'Array of photo URLs',
    -- Social
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_twitter VARCHAR(255),
    -- Business info
    type ENUM('men', 'women', 'unisex') DEFAULT 'unisex',
    amenities JSON COMMENT '["AC", "WiFi", "Parking", "Card Payment"]',
    -- Rating (denormalized for fast queries)
    avg_rating DECIMAL(2, 1) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    subscription_plan ENUM('free', 'basic', 'premium') DEFAULT 'free',
    subscription_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_city (city),
    INDEX idx_rating (avg_rating DESC),
    INDEX idx_type (type),
    FULLTEXT idx_search (name, description, city, address)
);

-- =====================================================
-- SALON OWNERS TABLE (Salon admin users)
-- =====================================================
CREATE TABLE IF NOT EXISTS salon_owners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('owner', 'admin', 'staff') DEFAULT 'owner',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id)
);

-- =====================================================
-- SERVICE CATEGORIES TABLE (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS service_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(50) DEFAULT '???',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_salon_slug (salon_id, slug)
);

-- =====================================================
-- SERVICES TABLE (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    icon VARCHAR(50) DEFAULT '???',
    image_url VARCHAR(500),
    gender ENUM('men', 'women', 'unisex') DEFAULT 'unisex',
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
    INDEX idx_salon (salon_id),
    INDEX idx_price (price)
);

-- =====================================================
-- STYLISTS TABLE (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS stylists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(100) DEFAULT 'Stylist',
    experience VARCHAR(50),
    speciality VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    avatar_emoji VARCHAR(10) DEFAULT '????',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id)
);

-- =====================================================
-- STYLIST WORKING HOURS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stylist_working_hours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stylist_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE,
    UNIQUE KEY unique_stylist_day (stylist_id, day_of_week)
);

-- =====================================================
-- BOOKINGS TABLE (links customer → salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    salon_id INT NOT NULL,
    customer_id INT,
    -- Customer info (for guest bookings without account)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    -- Booking details
    stylist_id INT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_duration INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    -- Status
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'upi', 'card', 'online') DEFAULT 'cash',
    -- Notifications
    whatsapp_notified BOOLEAN DEFAULT FALSE,
    owner_notified BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE SET NULL,
    INDEX idx_salon_date (salon_id, booking_date),
    INDEX idx_customer (customer_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status)
);

-- =====================================================
-- BOOKING SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    service_id INT,
    service_name VARCHAR(255) NOT NULL,
    service_price DECIMAL(10, 2) NOT NULL,
    service_duration INT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- =====================================================
-- REVIEWS TABLE (customers rate salons)
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    customer_id INT NOT NULL,
    booking_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    photos JSON COMMENT 'Array of review photo URLs',
    is_approved BOOLEAN DEFAULT TRUE,
    owner_reply TEXT,
    owner_replied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_salon_rating (salon_id, rating),
    UNIQUE KEY unique_booking_review (booking_id)
);

-- =====================================================
-- FAVORITES TABLE (customers save salons)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_fav (customer_id, salon_id)
);

-- =====================================================
-- GALLERY TABLE (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
);

-- =====================================================
-- CONTACT MESSAGES TABLE (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
);

-- =====================================================
-- NOTIFICATION LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_type ENUM('customer', 'owner', 'stylist') NOT NULL,
    notification_type ENUM('booking_created', 'booking_confirmed', 'booking_reminder', 'booking_completed', 'booking_cancelled') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- =====================================================
-- PLATFORM ADMIN TABLE (super admins managing the marketplace)
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'support') DEFAULT 'support',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Platform admin
INSERT INTO platform_admins (name, email, password, role) VALUES
('Platform Admin', 'admin@salonnear.com', '$2b$12$placeholder', 'super_admin');

-- Sample salons
INSERT INTO salons (name, slug, tagline, description, address, city, state, pincode, latitude, longitude, phone, whatsapp, type, working_days, avg_rating, total_ratings) VALUES
('Glamour Cuts', 'glamour-cuts-keshav-nagar', 'Premium Hair Salon', 'Experience the art of grooming at Glamour Cuts.', 'Shop No. 5, ABC Complex, Keshav Nagar', 'Pune', 'Maharashtra', '411036', 18.5362, 73.9272, '+91 98765 43210', '919876543210', 'men', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]', 4.5, 120),
('Style Studio', 'style-studio-viman-nagar', 'Unisex Salon & Spa', 'Your one-stop destination for all grooming needs.', 'Shop No. 12, XYZ Mall, Viman Nagar', 'Pune', 'Maharashtra', '411014', 18.5679, 73.9143, '+91 98765 43211', '919876543211', 'unisex', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]', 4.2, 85),
('The Beauty Bar', 'beauty-bar-koregaon-park', 'Premium Women Salon', 'Luxury salon experience for women.', 'Lane 7, Koregaon Park', 'Pune', 'Maharashtra', '411001', 18.5362, 73.8937, '+91 98765 43212', '919876543212', 'women', '["Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]', 4.8, 200);

-- Sample salon owners
INSERT INTO salon_owners (salon_id, name, email, password, phone, role) VALUES
(1, 'Rajesh Owner', 'rajesh@glamourcuts.com', '$2b$12$placeholder', '+91 98765 43210', 'owner'),
(2, 'Amit Owner', 'amit@stylestudio.com', '$2b$12$placeholder', '+91 98765 43211', 'owner'),
(3, 'Priya Owner', 'priya@beautybar.com', '$2b$12$placeholder', '+91 98765 43212', 'owner');

-- Sample categories for salon 1
INSERT INTO service_categories (salon_id, name, slug, description, icon, display_order) VALUES
(1, 'Haircut', 'haircut', 'Professional haircut services', '???', 1),
(1, 'Beard', 'beard', 'Beard styling and grooming', '????', 2),
(1, 'Hair Color', 'color', 'Professional hair coloring', '????', 3),
(1, 'Treatments', 'treatment', 'Hair and scalp treatments', '????', 4);

-- Sample services for salon 1
INSERT INTO services (salon_id, category_id, name, description, price, duration, icon, is_popular) VALUES
(1, 1, 'Classic Haircut', 'Traditional cuts with a modern touch', 150.00, 30, '???', FALSE),
(1, 1, 'Premium Haircut', 'Includes consultation, cut, wash, and styling', 300.00, 45, '?????????', TRUE),
(1, 2, 'Beard Styling', 'Perfect shaping and trimming', 100.00, 20, '????', FALSE),
(1, 3, 'Hair Color', 'Professional coloring with ammonia-free dyes', 500.00, 60, '????', TRUE),
(1, 4, 'Hair Spa', 'Deep conditioning treatment', 400.00, 45, '????', FALSE);

-- Sample stylists for salon 1
INSERT INTO stylists (salon_id, name, role, experience, speciality, avatar_emoji, display_order) VALUES
(1, 'Rajesh Kumar', 'Master Stylist', '15 years', 'Classic Cuts & Styling', '????', 1),
(1, 'Amit Sharma', 'Senior Barber', '10 years', 'Beard Styling & Shaves', '?????????', 2);

-- Sample customer
INSERT INTO customers (name, phone, email, password, city, latitude, longitude) VALUES
('Test Customer', '+91 99999 00001', 'customer@test.com', '$2b$12$placeholder', 'Pune', 18.5400, 73.9100);
