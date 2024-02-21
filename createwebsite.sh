#!/bin/bash

# Check if the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root (sudo)."
  exit 1
fi

# Check for the required command-line arguments
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <domain_name> <port>"
  exit 1
fi

# Define variables
DOMAIN="$1"
PORT="$2"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_SITES_ENABLED_DIR="/etc/nginx/sites-enabled"

# Create a basic Nginx server block configuration
CONFIG_FILE="$NGINX_CONFIG_DIR/$DOMAIN"
cat <<EOF > "$CONFIG_FILE"
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Create a directory for the website
WEB_DIR="/var/www/$DOMAIN"
mkdir -p "$WEB_DIR"
echo "<h1>Welcome to $DOMAIN on port $PORT</h1>" > "$WEB_DIR/index.html"

# Enable the Nginx site
ln -s "$CONFIG_FILE" "$NGINX_SITES_ENABLED_DIR/"

# Test Nginx configuration and reload it
nginx -t
if [ $? -eq 0 ]; then
  systemctl reload nginx
  echo "Website $DOMAIN is now available on port $PORT."
else
  echo "Nginx configuration test failed. Please check your configuration and try again."
fi
