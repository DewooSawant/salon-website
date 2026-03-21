-- =====================================================
-- SalonNear Marketplace - PostgreSQL Schema with PostGIS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- CUSTOMERS (App users who search & book)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    city VARCHAR(100),
    location GEOGRAPHY(POINT, 4326),
    is_active BOOLEAN DEFAULT TRUE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers USING GIST(location);

-- =====================================================
-- SALONS (Each salon shop on the platform)
-- =====================================================
CREATE TABLE IF NOT EXISTS salons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    tagline VARCHAR(500),
    description TEXT,
    -- Location
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(10),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
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
    working_days JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]',
    -- Media
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    photos JSONB DEFAULT '[]',
    -- Social
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_twitter VARCHAR(255),
    -- Business info
    type VARCHAR(20) DEFAULT 'unisex' CHECK (type IN ('men', 'women', 'unisex')),
    amenities JSONB DEFAULT '[]',
    -- Denormalized ratings
    avg_rating NUMERIC(2, 1) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salons_location ON salons USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);
CREATE INDEX IF NOT EXISTS idx_salons_rating ON salons(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_salons_type ON salons(type);
CREATE INDEX IF NOT EXISTS idx_salons_search ON salons USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || city || ' ' || address));

-- =====================================================
-- SALON OWNERS
-- =====================================================
CREATE TABLE IF NOT EXISTS salon_owners (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_owners_salon ON salon_owners(salon_id);

-- =====================================================
-- SERVICE CATEGORIES (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(50) DEFAULT '✂️',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, slug)
);

-- =====================================================
-- SERVICES (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    category_id INT REFERENCES service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    discounted_price NUMERIC(10, 2),
    duration INT NOT NULL, -- minutes
    icon VARCHAR(50) DEFAULT '✂️',
    image_url VARCHAR(500),
    gender VARCHAR(20) DEFAULT 'unisex' CHECK (gender IN ('men', 'women', 'unisex')),
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);

-- =====================================================
-- STYLISTS (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS stylists (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stylists_salon ON stylists(salon_id);

-- =====================================================
-- STYLIST WORKING HOURS
-- =====================================================
CREATE TABLE IF NOT EXISTS stylist_working_hours (
    id SERIAL PRIMARY KEY,
    stylist_id INT NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE(stylist_id, day_of_week)
);

-- =====================================================
-- BOOKINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    stylist_id INT REFERENCES stylists(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_duration INT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    final_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','refunded')),
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash','upi','card','online')),
    whatsapp_notified BOOLEAN DEFAULT FALSE,
    owner_notified BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_salon_date ON bookings(salon_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =====================================================
-- BOOKING SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_services (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE SET NULL,
    service_name VARCHAR(255) NOT NULL,
    service_price NUMERIC(10, 2) NOT NULL,
    service_duration INT NOT NULL
);

-- =====================================================
-- REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    photos JSONB DEFAULT '[]',
    is_approved BOOLEAN DEFAULT TRUE,
    owner_reply TEXT,
    owner_replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id, rating);

-- =====================================================
-- FAVORITES
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, salon_id)
);

-- =====================================================
-- GALLERY (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTACT MESSAGES (per salon)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    salon_id INT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('customer','owner','stylist')),
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('booking_created','booking_confirmed','booking_reminder','booking_completed','booking_cancelled')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PLATFORM ADMINS
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'support' CHECK (role IN ('super_admin','support')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns
             WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I', t);
        EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
    END LOOP;
END $$;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Salons (using ST_MakePoint for PostGIS geography)
INSERT INTO salons (name, slug, tagline, description, address, city, state, pincode, location, phone, whatsapp, type, avg_rating, total_ratings) VALUES
('Glamour Cuts', 'glamour-cuts-keshav-nagar', 'Premium Hair Salon', 'Experience the art of grooming at Glamour Cuts. We offer premium haircuts, styling, and grooming services.', 'Shop No. 5, ABC Complex, Keshav Nagar', 'Pune', 'Maharashtra', '411036', ST_MakePoint(73.9272, 18.5362)::geography, '+91 98765 43210', '919876543210', 'men', 4.5, 120),
('Style Studio', 'style-studio-viman-nagar', 'Unisex Salon & Spa', 'Your one-stop destination for all grooming needs.', 'Shop No. 12, XYZ Mall, Viman Nagar', 'Pune', 'Maharashtra', '411014', ST_MakePoint(73.9143, 18.5679)::geography, '+91 98765 43211', '919876543211', 'unisex', 4.2, 85),
('The Beauty Bar', 'beauty-bar-koregaon-park', 'Premium Women Salon', 'Luxury salon experience for women.', 'Lane 7, Koregaon Park', 'Pune', 'Maharashtra', '411001', ST_MakePoint(73.8937, 18.5362)::geography, '+91 98765 43212', '919876543212', 'women', 4.8, 200)
ON CONFLICT (slug) DO NOTHING;

-- Salon owners (password placeholder — setup script hashes them)
INSERT INTO salon_owners (salon_id, name, email, password, phone, role) VALUES
(1, 'Rajesh Owner', 'rajesh@glamourcuts.com', '$placeholder$', '+91 98765 43210', 'owner'),
(2, 'Amit Owner', 'amit@stylestudio.com', '$placeholder$', '+91 98765 43211', 'owner'),
(3, 'Priya Owner', 'priya@beautybar.com', '$placeholder$', '+91 98765 43212', 'owner')
ON CONFLICT (email) DO NOTHING;

-- Categories for salon 1
INSERT INTO service_categories (salon_id, name, slug, icon, display_order) VALUES
(1, 'Haircut', 'haircut', '✂️', 1),
(1, 'Beard', 'beard', '🧔', 2),
(1, 'Hair Color', 'color', '🎨', 3),
(1, 'Treatments', 'treatment', '🧴', 4),
(1, 'Facial', 'facial', '✨', 5)
ON CONFLICT (salon_id, slug) DO NOTHING;

-- Services for salon 1
INSERT INTO services (salon_id, category_id, name, description, price, duration, icon, is_popular) VALUES
(1, 1, 'Classic Haircut', 'Traditional cuts with a modern touch', 150.00, 30, '✂️', FALSE),
(1, 1, 'Premium Haircut', 'Includes consultation, cut, wash, and styling', 300.00, 45, '💇‍♂️', TRUE),
(1, 1, 'Kids Haircut', 'Gentle haircuts for children', 100.00, 25, '👦', FALSE),
(1, 2, 'Beard Styling', 'Perfect shaping and trimming', 100.00, 20, '🧔', FALSE),
(1, 2, 'Royal Shave', 'Hot towel treatment with precision shaving', 200.00, 30, '🪒', FALSE),
(1, 3, 'Hair Color', 'Professional coloring with ammonia-free dyes', 500.00, 60, '🎨', TRUE),
(1, 3, 'Highlights', 'Partial or full head highlights', 800.00, 90, '✨', FALSE),
(1, 4, 'Hair Spa', 'Deep conditioning treatment', 400.00, 45, '🧴', FALSE),
(1, 4, 'Keratin Treatment', 'Smoothing and strengthening treatment', 2000.00, 120, '💆', FALSE),
(1, 5, 'Basic Facial', 'Deep cleansing facial', 350.00, 40, '✨', FALSE),
(1, 5, 'Premium Facial', 'Advanced facial with premium products', 600.00, 60, '🌟', FALSE);

-- Stylists for salon 1
INSERT INTO stylists (salon_id, name, role, experience, speciality, avatar_emoji, display_order) VALUES
(1, 'Rajesh Kumar', 'Master Stylist', '15 years', 'Classic Cuts & Styling', '👨‍🦱', 1),
(1, 'Amit Sharma', 'Senior Barber', '10 years', 'Beard Styling & Shaves', '🧔‍♂️', 2),
(1, 'Priya Deshmukh', 'Color Specialist', '8 years', 'Hair Coloring & Treatments', '👩‍🦰', 3),
(1, 'Vikram Patel', 'Junior Stylist', '3 years', 'Modern & Trendy Cuts', '👨‍🎨', 4);

-- Sample customer (password placeholder)
INSERT INTO customers (name, phone, email, password, city, location) VALUES
('Test Customer', '+919999900001', 'customer@test.com', '$placeholder$', 'Pune', ST_MakePoint(73.9100, 18.5400)::geography)
ON CONFLICT (phone) DO NOTHING;

-- Platform admin (password placeholder)
INSERT INTO platform_admins (name, email, password, role) VALUES
('Platform Admin', 'admin@salonnear.com', '$placeholder$', 'super_admin')
ON CONFLICT (email) DO NOTHING;
