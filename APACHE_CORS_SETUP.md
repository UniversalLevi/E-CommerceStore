# Apache CORS Configuration Setup

This guide explains how to configure Apache to handle CORS for all subdomains of `eazydropshipping.com`.

## 📋 Prerequisites

- Apache web server with `mod_headers` and `mod_rewrite` enabled
- Access to Apache configuration files or `.htaccess`

## 🔧 Installation Steps

### Option 1: VirtualHost Configuration (Recommended for Production)

1. **Locate your Apache VirtualHost configuration file:**
   ```bash
   # Usually located in one of these:
   /etc/apache2/sites-available/000-default.conf
   /etc/apache2/sites-available/eazydropshipping.com.conf
   /etc/httpd/conf.d/vhost.conf
   ```

2. **Add the CORS configuration inside your `<VirtualHost>` block:**
   ```apache
   <VirtualHost *:443>
       ServerName eazydropshipping.com
       ServerAlias *.eazydropshipping.com
       
       # ... your existing configuration ...
       
       # Add CORS configuration here
       <IfModule mod_headers.c>
           SetEnvIf Origin "^https://([a-zA-Z0-9-]+\.)*eazydropshipping\.com$" ALLOWED_ORIGIN=$0
           Header always set Access-Control-Allow-Origin "%{ALLOWED_ORIGIN}e" env=ALLOWED_ORIGIN
           Header always set Access-Control-Allow-Credentials "true" env=ALLOWED_ORIGIN
           Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" env=ALLOWED_ORIGIN
           Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" env=ALLOWED_ORIGIN
           Header always set Access-Control-Max-Age "3600" env=ALLOWED_ORIGIN
       </IfModule>
       
       <IfModule mod_rewrite.c>
           RewriteEngine On
           RewriteCond %{REQUEST_METHOD} OPTIONS
           RewriteRule ^(.*)$ $1 [R=200,L]
       </IfModule>
   </VirtualHost>
   ```

3. **Enable required Apache modules (if not already enabled):**
   ```bash
   sudo a2enmod headers
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

4. **Test the configuration:**
   ```bash
   sudo apache2ctl configtest
   # or
   sudo httpd -t
   ```

5. **Restart Apache:**
   ```bash
   sudo systemctl restart apache2
   # or
   sudo service apache2 restart
   ```

### Option 2: .htaccess File (For shared hosting or when you can't edit VirtualHost)

1. **Copy the contents of `apache-cors-config.conf` to your `.htaccess` file**
   - Place it in your document root or the directory where your API is served

2. **Ensure `.htaccess` is enabled in Apache:**
   ```apache
   # In your VirtualHost or main config:
   AllowOverride All
   ```

## ✅ What This Configuration Does

### Allows:
- ✅ `https://eazydropshipping.com`
- ✅ `https://www.eazydropshipping.com`
- ✅ `https://shopify.eazydropshipping.com`
- ✅ `https://anything.eazydropshipping.com`
- ✅ Any subdomain matching the pattern

### Rejects:
- ❌ External domains (e.g., `https://evil.com`)
- ❌ HTTP (non-HTTPS) origins (if you want to allow HTTP, modify the regex)

### Preserves:
- ✅ Cookies and authentication
- ✅ Credentials in requests
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)

## 🧪 Testing

After configuration, test with:

```bash
# Test from a subdomain
curl -H "Origin: https://shopify.eazydropshipping.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://eazydropshipping.com/api/health \
     -v
```

You should see:
```
Access-Control-Allow-Origin: https://shopify.eazydropshipping.com
Access-Control-Allow-Credentials: true
```

## 🔍 Troubleshooting

### Headers not appearing?
1. Check if `mod_headers` is enabled: `apache2ctl -M | grep headers`
2. Check Apache error logs: `tail -f /var/log/apache2/error.log`
3. Verify the regex pattern matches your origin

### 403 Forbidden on OPTIONS?
- Ensure `mod_rewrite` is enabled
- Check that the RewriteRule is working

### Still getting CORS errors?
- Clear browser cache
- Check browser console for exact error message
- Verify the Origin header is being sent correctly

## 📝 Notes

- This configuration works **in addition to** Express.js CORS (defense in depth)
- Apache handles CORS at the proxy level before requests reach Node.js
- The Express CORS config remains as a fallback if Apache isn't configured
- Both configurations work together without conflicts

## 🔐 Security

- Only allows subdomains of `eazydropshipping.com`
- Requires HTTPS (modify regex if you need HTTP support)
- Preserves credentials and cookies
- Rejects external domains automatically
