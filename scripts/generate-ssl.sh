#!/bin/bash

# SSL Certificate Generation Script
# This script helps generate self-signed SSL certificates for development/testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}SSL Certificate Generation Script${NC}"
echo "========================================"

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: OpenSSL is not installed. Please install it first.${NC}"
    exit 1
fi

# Create directories
mkdir -p ssl/certs ssl/private ssl/csr ssl/logs

# Generate private key
echo -e "${YELLOW}Generating private key...${NC}"
openssl genrsa -out ssl/private/privkey.pem 4096

# Generate certificate signing request (CSR)
echo -e "${YELLOW}Generating Certificate Signing Request...${NC}"
openssl req -new -key ssl/private/privkey.pem -out ssl/csr/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
echo -e "${YELLOW}Generating self-signed certificate...${NC}"
openssl x509 -req -days 365 -in ssl/csr/cert.csr -signkey ssl/private/privkey.pem -out ssl/certs/cert.pem

# Create fullchain.pem (for nginx)
echo -e "${YELLOW}Creating fullchain.pem...${NC}"
cat ssl/certs/cert.pem > ssl/certs/fullchain.pem

# Generate DH parameters (for perfect forward secrecy)
echo -e "${YELLOW}Generating DH parameters (this may take a while)...${NC}"
openssl dhparam -out ssl/certs/dhparam.pem 2048

# Set proper permissions
echo -e "${YELLOW}Setting file permissions...${NC}"
chmod 600 ssl/private/privkey.pem
chmod 644 ssl/certs/cert.pem
chmod 644 ssl/certs/fullchain.pem
chmod 644 ssl/certs/dhparam.pem

echo -e "${GREEN}SSL certificates generated successfully!${NC}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo "  Private Key:      ssl/private/privkey.pem"
echo "  Certificate:      ssl/certs/cert.pem"
echo "  Full Chain:       ssl/certs/fullchain.pem"
echo "  DH Parameters:    ssl/certs/dhparam.pem"
echo ""
echo -e "${YELLOW}For production use, consider using Let's Encrypt:${NC}"
echo "  docker-compose -f docker-compose.ssl.yml up certbot"
echo ""
echo -e "${YELLOW}To use self-signed certificates:${NC}"
echo "  docker-compose -f docker-compose.ssl.yml up nginx-ssl"
echo ""
echo -e "${RED}Note: Self-signed certificates will show security warnings in browsers.${NC}"
echo -e "${RED}      Use them for development and testing only.${NC}"