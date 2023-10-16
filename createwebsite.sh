#!/bin/bash
#
# Nginx - new server block

# Functions
ok() { echo -e '\e[32m'$1'\e[m'; } # Green
die() {
    echo -e '\e[1;31m'$1'\e[m'
    exit 1
}

# Variables
NGINX_AVAILABLE_VHOSTS='/etc/nginx/sites-available'
NGINX_ENABLED_VHOSTS='/etc/nginx/sites-enabled'
WEB_DIR='/var/www'
WEB_USER='www-data'
USER='ali'

# Sanity check
[ $(id -u) != 0 ] && die "Script must be run as root."
[ $# -ne 2 ] && die "Usage: $(basename $0) domainName port"

# Create Nginx config file
cat >"$NGINX_AVAILABLE_VHOSTS/$1" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $1 www.$1;
    root $WEB_DIR/$1;
    index index.php index.html index.htm;

    location / {
        proxy_pass http://localhost:$2;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

echo -e "\n#Added by nginx-server-block-generator.sh\n127.0.0.1 $1" >> /etc/hosts

# Changing permissions
chown -R $USER:$USER "$WEB_DIR/$1"

# Enable site by creating symbolic link
ln -s "$NGINX_AVAILABLE_VHOSTS/$1" "$NGINX_ENABLED_VHOSTS/$1"

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

ok "Site Created for $1"
