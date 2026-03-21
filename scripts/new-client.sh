#!/bin/bash

# Script to setup a new salon client
# Usage: ./scripts/new-client.sh

echo "🏪 New Salon Client Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get client details
read -p "Enter salon name (no spaces, lowercase): " SALON_NAME
read -p "Enter owner email: " ADMIN_EMAIL
read -p "Enter owner WhatsApp (with country code, e.g., 919876543210): " WHATSAPP
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

# Generate database name
DB_NAME="${SALON_NAME}_salon"

echo ""
echo "📦 Creating database: $DB_NAME"

# Create database
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME;
GRANT ALL PRIVILEGES ON $DB_NAME.* TO 'salon_user'@'localhost';
FLUSH PRIVILEGES;
"

echo "✅ Database created"

# Create client-specific .env file
CLIENT_ENV="/var/www/clients/${SALON_NAME}/.env"
mkdir -p "/var/www/clients/${SALON_NAME}"

cat > "$CLIENT_ENV" << EOF
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://${SALON_NAME}.yourdomain.com

DB_HOST=localhost
DB_PORT=3306
DB_USER=salon_user
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=$DB_NAME

JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
SALON_WHATSAPP_NUMBER=$WHATSAPP
EOF

echo "✅ Environment file created at $CLIENT_ENV"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the DB_PASSWORD in $CLIENT_ENV"
echo "2. Run: cd /var/www/salon && DB_NAME=$DB_NAME npm run setup"
echo "3. Configure Nginx for the new subdomain"
echo "4. Setup SSL with: certbot --nginx -d ${SALON_NAME}.yourdomain.com"
echo ""


