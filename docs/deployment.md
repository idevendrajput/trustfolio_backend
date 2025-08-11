# Deployment Guide

This guide covers deploying the Trustfolio Backend API to various production environments including cloud platforms, VPS servers, and containerized deployments.

## Pre-Deployment Checklist

### ✅ Code Preparation

- [ ] All features tested and working
- [ ] Environment variables properly configured
- [ ] Dependencies updated and security audited
- [ ] Database connections tested
- [ ] API endpoints documented and tested
- [ ] Error handling implemented
- [ ] Logging configured for production

### ✅ Security Checklist

- [ ] Strong JWT secret generated
- [ ] Database credentials secured
- [ ] CORS origins properly configured
- [ ] Rate limiting implemented (if applicable)
- [ ] Helmet security headers enabled
- [ ] Input validation and sanitization in place
- [ ] No sensitive data in logs

### ✅ Performance Checklist

- [ ] Database indexes optimized
- [ ] Pagination implemented for large datasets
- [ ] Compression middleware enabled
- [ ] Static files served efficiently
- [ ] Connection pooling configured

---

## Environment Variables

Create a production `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=trustfolio
DB_NAME=trustfolio

# JWT Configuration (Use a strong, randomly generated secret)
JWT_SECRET=your_super_secure_256_bit_secret_key_here

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Optional: API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generate Secure JWT Secret

```bash
# Generate a secure 256-bit secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Cloud Platform Deployments

### 1. Heroku Deployment

#### Prerequisites
- Heroku CLI installed
- Git repository initialized

#### Steps

1. **Create Heroku App**
```bash
heroku create trustfolio-backend
```

2. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set CORS_ORIGIN="https://your-frontend.com"
```

3. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

4. **Verify Deployment**
```bash
heroku open
heroku logs --tail
```

#### Heroku-Specific Files

**Procfile**
```
web: npm start
```

**package.json engines**
```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### 2. Railway Deployment

#### Steps

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the repository

2. **Configure Environment Variables**
   - Add all production environment variables
   - Set `PORT` to Railway's dynamic port

3. **Deploy**
   - Railway automatically deploys on push to main branch

### 3. Render Deployment

#### Steps

1. **Create Web Service**
   - Go to [Render.com](https://render.com)
   - Connect GitHub repository
   - Choose "Web Service"

2. **Configuration**
```yaml
# Build Command
npm install

# Start Command
npm start

# Environment
NODE_ENV: production
```

3. **Set Environment Variables**
   - Add all production variables in Render dashboard

### 4. DigitalOcean App Platform

#### app.yaml
```yaml
name: trustfolio-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/trustfolio-backend
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: your-mongodb-uri
  - key: JWT_SECRET
    value: your-jwt-secret
  - key: CORS_ORIGIN
    value: https://your-frontend.com
```

---

## VPS/Server Deployment

### Using PM2 (Process Manager)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-username/trustfolio-backend.git
cd trustfolio-backend

# Install dependencies
npm install --production

# Create production .env file
nano .env

# Start with PM2
pm2 start server.js --name "trustfolio-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. PM2 Configuration File

**ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'trustfolio-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with config:
```bash
pm2 start ecosystem.config.js --env production
```

### Nginx Reverse Proxy

#### Configuration

**/etc/nginx/sites-available/trustfolio-backend**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable and Test

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/trustfolio-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable auto-start
sudo systemctl enable nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Docker Deployment

### Dockerfile

```dockerfile
# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

### Health Check Script

**healthcheck.js**
```javascript
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('ERROR', err);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('TIMEOUT');
  request.destroy();
  process.exit(1);
});

request.end();
```

### Docker Compose

**docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t trustfolio-backend .

# Run container
docker run -d \
  --name trustfolio-api \
  -p 3001:3001 \
  --env-file .env \
  trustfolio-backend

# Using Docker Compose
docker-compose up -d
```

---

## Database Setup (MongoDB Atlas)

### Production Database Configuration

1. **Create MongoDB Atlas Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster
   - Choose appropriate tier (M10+ for production)

2. **Security Configuration**
   - Create database user with strong password
   - Configure IP whitelist (0.0.0.0/0 for cloud deployments)
   - Enable connection security

3. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=trustfolio
   ```

### Database Backups

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/backup_$DATE"
# Upload to cloud storage or S3
```

---

## Monitoring and Logging

### Application Monitoring

#### PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

#### Health Checks
```javascript
// Add to server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});
```

### Log Management

#### Winston Logger Setup
```bash
npm install winston winston-mongodb
```

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'trustfolio-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

## Performance Optimization

### Production Optimizations

1. **Enable Compression**
   ```javascript
   // Already included in server.js
   app.use(compression());
   ```

2. **Connection Pooling**
   ```javascript
   // MongoDB connection options
   mongoose.connect(process.env.MONGODB_URI, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```
   
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

4. **Caching Headers**
   ```javascript
   app.get('/api/categories', (req, res) => {
     res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
     // ... route logic
   });
   ```

---

## Security Best Practices

### Production Security

1. **Environment Variables**
   - Never commit `.env` files
   - Use platform-specific secret management
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Enable authentication
   - Restrict IP access
   - Regular backups

3. **Application Security**
   - Keep dependencies updated
   - Use security linting
   - Implement rate limiting
   - Validate all inputs

4. **Server Security**
   - Regular system updates
   - Firewall configuration
   - Disable root login
   - Use SSH keys

### Security Scanning

```bash
# Audit npm packages
npm audit

# Fix vulnerabilities
npm audit fix

# Use security linting
npx eslint-config-security
```

---

## Troubleshooting

### Common Deployment Issues

#### Port Conflicts
```bash
# Check port usage
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

#### Memory Issues
```bash
# Check memory usage
free -h

# PM2 memory monitoring
pm2 show trustfolio-backend
```

#### Database Connection
```bash
# Test connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('$MONGODB_URI')
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"
```

### Rollback Strategy

```bash
# Git-based rollback
git log --oneline
git checkout <previous-commit-hash>
pm2 restart trustfolio-backend

# Docker rollback
docker run -d --name trustfolio-api-v2 previous-image-tag
# Update load balancer to point to new container
```

---

## Maintenance

### Regular Maintenance Tasks

1. **Security Updates**
   ```bash
   # Update dependencies monthly
   npm update
   npm audit
   ```

2. **Database Maintenance**
   ```bash
   # Regular backups
   mongodump --uri="$MONGODB_URI"
   
   # Index optimization
   db.categories.getIndexes()
   ```

3. **Log Rotation**
   ```bash
   # PM2 log rotation (automatically configured)
   pm2 install pm2-logrotate
   ```

4. **Performance Monitoring**
   - Monitor response times
   - Check memory usage
   - Database query performance
   - Error rates

This comprehensive deployment guide ensures your Trustfolio Backend API runs reliably in production with proper security, monitoring, and maintenance procedures.
