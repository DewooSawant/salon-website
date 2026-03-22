-- Migration: Staff Pay & Customer CRM
-- Run this on production (Railway) database

-- Add pay columns to stylists
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS pay_type VARCHAR(20) DEFAULT 'salary';
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(10,2) DEFAULT 0;

-- Staff payments table
CREATE TABLE IF NOT EXISTS staff_payments (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  salon_id INTEGER NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  base_salary NUMERIC(10,2) DEFAULT 0,
  commission_earned NUMERIC(10,2) DEFAULT 0,
  bonus NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  total_payable NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  paid_date DATE,
  payment_method VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stylist_id, month, year)
);
