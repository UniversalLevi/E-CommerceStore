# Subdomain Setup Guide

## Problem
You're getting `DNS_PROBE_FINISHED_NXDOMAIN` when trying to access `teststore.eazydropshipping.com` because DNS records aren't configured yet.

## Quick Solution (Path-Based Access)

For now, you can access your store using path-based routing:
- Instead of: `https://teststore.eazydropshipping.com`
- Use: `https://eazydropshipping.com/storefront/teststore`

This works immediately without DNS configuration.

## Local Development Setup

### Option 1: Use Path-Based Routes (Easiest)
Access stores via: `http://localhost:3000/storefront/teststore`

### Option 2: Configure Hosts File (For Subdomain Testing)
1. Edit your hosts file:
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Mac/Linux: `/etc/hosts`

2. Add this line:
   ```
   127.0.0.1 teststore.localhost
   ```

3. Access: `http://teststore.localhost:3000`

## Production DNS Setup

To enable subdomain access in production, configure DNS:

### Step 1: Add Wildcard DNS Record
In your DNS provider (Cloudflare, AWS Route 53, etc.), add:

**Type:** A Record (or CNAME)
**Name:** `*` (wildcard)
**Value:** Your server IP address (or domain if using CNAME)
**TTL:** 3600 (or default)

This will route all subdomains (`*.eazydropshipping.com`) to your server.

### Step 2: Configure Server/Reverse Proxy
If using Nginx:
```nginx
server {
    listen 80;
    server_name *.eazydropshipping.com eazydropshipping.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 3: SSL Certificate (HTTPS)
Use Let's Encrypt with wildcard certificate:
```bash
certbot certonly --dns-cloudflare -d eazydropshipping.com -d *.eazydropshipping.com
```

## Alternative: Update Middleware for Path-Based Fallback

The middleware can be updated to also support path-based access as a fallback when subdomain isn't available.
