-- Glamour Cuts Salon Database Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS glamour_salon;
USE glamour_salon;

-- =====================================================
-- SALON SETTINGS TABLE
-- Stores salon information and contact details
-- =====================================================
CREATE TABLE IF NOT EXISTS salon_settings (
    id INT PRIMARY KEY DEFAULT 1,
    salon_name VARCHAR(255) NOT NULL DEFAULT 'Glamour Cuts',
    tagline VARCHAR(500) DEFAULT 'Premium Hair Salon',
    description TEXT,
    address VARCHAR(500),
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    pincode VARCHAR(10),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    google_maps_url TEXT,
    opening_time TIME DEFAULT '10:00:00',
    closing_time TIME DEFAULT '21:00:00',
    slot_duration INT DEFAULT 30 COMMENT 'Duration in minutes',
    lunch_start TIME DEFAULT '13:00:00',
    lunch_end TIME DEFAULT '14:00:00',
    working_days JSON,
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_twitter VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- =====================================================
-- ADMIN USERS TABLE
-- Stores admin/owner credentials
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('owner', 'admin', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- SERVICE CATEGORIES TABLE
-- Custom categories for services
-- =====================================================
CREATE TABLE IF NOT EXISTS service_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    icon VARCHAR(50) DEFAULT '✂️',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- SERVICES TABLE
-- All salon services with pricing
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    icon VARCHAR(50) DEFAULT '✂️',
    image_url VARCHAR(500),
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- =====================================================
-- STYLISTS TABLE
-- Salon staff members
-- =====================================================
CREATE TABLE IF NOT EXISTS stylists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(100) DEFAULT 'Stylist',
    experience VARCHAR(50),
    speciality VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    avatar_emoji VARCHAR(10) DEFAULT '👨‍🦱',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- STYLIST WORKING HOURS TABLE
-- Custom working hours per stylist
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
-- BOOKINGS TABLE
-- Customer appointments
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    stylist_id INT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_duration INT NOT NULL COMMENT 'Total duration in minutes',
    total_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    whatsapp_notified BOOLEAN DEFAULT FALSE,
    owner_notified BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE SET NULL,
    INDEX idx_booking_date (booking_date),
    INDEX idx_stylist_date (stylist_id, booking_date),
    INDEX idx_status (status)
);

-- =====================================================
-- BOOKING SERVICES TABLE
-- Services included in each booking
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
-- CONTACT MESSAGES TABLE
-- Customer inquiries
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GALLERY TABLE
-- Salon work showcase
-- =====================================================
CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TESTIMONIALS TABLE
-- Customer reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    customer_avatar VARCHAR(500),
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    service_received VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATION LOG TABLE
-- Track WhatsApp and other notifications
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
-- INSERT DEFAULT DATA
-- =====================================================

-- Default salon settings
INSERT INTO salon_settings (id, salon_name, tagline, description, address, city, phone, whatsapp, email, working_days)
VALUES (1, 'Glamour Cuts', 'Premium Hair Salon', 'Experience the art of grooming at Glamour Cuts. We offer premium haircuts, styling, and grooming services.', 
'Shop No. 5, ABC Complex, Keshav Nagar', 'Pune', '+91 98765 43210', '919876543210', 'info@glamourcuts.com',
'["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]')
ON DUPLICATE KEY UPDATE id = 1;

-- Default service categories
INSERT INTO service_categories (name, slug, description, icon, display_order) VALUES
('Haircut', 'haircut', 'Professional haircut services', '✂️', 1),
('Beard', 'beard', 'Beard styling and grooming', '🧔', 2),
('Hair Color', 'color', 'Professional hair coloring', '🎨', 3),
('Treatments', 'treatment', 'Hair and scalp treatments', '🧴', 4),
('Facial', 'facial', 'Facial and skincare services', '✨', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Default services
INSERT INTO services (category_id, name, description, price, duration, icon, is_popular) VALUES
(1, 'Classic Haircut', 'Traditional cuts with a modern touch', 150.00, 30, '✂️', FALSE),
(1, 'Premium Haircut', 'Includes consultation, cut, wash, and styling', 300.00, 45, '💇‍♂️', TRUE),
(1, 'Kids Haircut', 'Gentle haircuts for children', 100.00, 25, '👦', FALSE),
(2, 'Beard Styling', 'Perfect shaping and trimming', 100.00, 20, '🧔', FALSE),
(2, 'Royal Shave', 'Hot towel treatment with precision shaving', 200.00, 30, '🪒', FALSE),
(3, 'Hair Color', 'Professional coloring with ammonia-free dyes', 500.00, 60, '🎨', TRUE),
(3, 'Highlights', 'Partial or full head highlights', 800.00, 90, '✨', FALSE),
(4, 'Hair Spa', 'Deep conditioning treatment', 400.00, 45, '🧴', FALSE),
(4, 'Keratin Treatment', 'Smoothing and strengthening treatment', 2000.00, 120, '💆', FALSE),
(4, 'Head Massage', 'Relaxing scalp massage', 150.00, 20, '💆‍♂️', FALSE),
(5, 'Basic Facial', 'Deep cleansing facial', 350.00, 40, '✨', FALSE),
(5, 'Premium Facial', 'Advanced facial with premium products', 600.00, 60, '🌟', FALSE);

-- Default stylists
INSERT INTO stylists (name, role, experience, speciality, avatar_emoji, display_order) VALUES
('Rajesh Kumar', 'Master Stylist', '15 years', 'Classic Cuts & Styling', '👨‍🦱', 1),
('Amit Sharma', 'Senior Barber', '10 years', 'Beard Styling & Shaves', '🧔‍♂️', 2),
('Priya Deshmukh', 'Color Specialist', '8 years', 'Hair Coloring & Treatments', '👩‍🦰', 3),
('Vikram Patel', 'Junior Stylist', '3 years', 'Modern & Trendy Cuts', '👨‍🎨', 4);

