# Authentication Microservice

Production-ready authentication service with JWT, OAuth, email verification, password reset, and 2FA support. Built with Node.js, PostgreSQL, Sequelize, and Redis.

## 🔐 Features

- ✅ User registration & login
- ✅ JWT access & refresh tokens
- ✅ OAuth 2.0 (Google, GitHub)
- ✅ Email verification
- ✅ Password reset flow
- ✅ Two-factor authentication (2FA)
- ✅ Session management with Redis
- ✅ Rate limiting
- ✅ Account lockout after failed attempts
- ✅ Password strength validation
- ✅ Audit logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- SendGrid account (for email service)

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository>
cd Authentication\ Microservice

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Create PostgreSQL database
createdb auth_service

# Run migrations (optional - models auto-sync in development)
npm run migrate

# Start the server
npm run dev
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=3500

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_service
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3500/auth/oauth/google/callback

# OAuth (GitHub)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3500/auth/oauth/github/callback

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=1800000
OTP_EXPIRY=600000
```

## 📝 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/verify/:token` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password/:token` - Reset password

### OAuth

- `GET /auth/oauth/google` - Google OAuth login
- `GET /auth/oauth/github` - GitHub OAuth login

### Two-Factor Authentication

- `POST /auth/2fa/enable` - Enable 2FA (requires auth)
- `POST /auth/2fa/verify` - Verify 2FA setup (requires auth)
- `POST /auth/2fa/login` - Login with 2FA code

### User Management

- `GET /auth/me` - Get current user profile (requires auth)
- `PUT /auth/me` - Update user profile (requires auth)
- `POST /auth/2fa/disable` - Disable 2FA (requires auth)
- `GET /auth/sessions` - Get user sessions (requires auth)
- `DELETE /auth/sessions/:sessionId` - Revoke a session (requires auth)
- `DELETE /auth/sessions` - Revoke all sessions (requires auth)
- `GET /auth/audit-logs` - Get audit logs (requires auth)

### Health Check

- `GET /health` - Health check endpoint

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### Example API Calls

#### Register User
```bash
curl -X POST http://localhost:3500/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3500/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### Refresh Token
```bash
curl -X POST http://localhost:3500/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Get Profile (Authenticated)
```bash
curl -X GET http://localhost:3500/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📁 Project Structure

```
auth-microservice/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── passport.js
│   │   └── email.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── RefreshToken.js
│   │   ├── AuditLog.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   └── validator.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── services/
│   │   ├── tokenService.js
│   │   ├── emailService.js
│   │   └── otpService.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── crypto.js
│   └── app.js
├── migrations/
├── config/
│   └── database.json
├── .env.example
├── .sequelizerc
├── package.json
└── README.md
```

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt with configurable rounds
- **JWT Tokens**: Secure access and refresh token implementation
- **Rate Limiting**: Prevents brute force attacks
- **Account Lockout**: Automatic lockout after failed login attempts
- **Password Strength**: Enforces strong password requirements
- **Email Verification**: Requires email verification before login
- **2FA Support**: Two-factor authentication with TOTP
- **Session Management**: Track and revoke user sessions
- **Audit Logging**: Comprehensive audit trail

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT
3. Configure proper CORS origins
4. Set up SSL/TLS
5. Use environment variables for all secrets
6. Enable database migrations
7. Set up proper logging
8. Configure Redis persistence
9. Set up monitoring and alerts

## 📚 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **Redis** - Caching and session storage
- **JWT** - Token-based authentication
- **Passport.js** - OAuth authentication
- **SendGrid** - Email service
- **Speakeasy** - 2FA implementation
- **Winston** - Logging

## 📄 License

ISC

## 👤 Author

Senior Backend Developer

---

**Note**: This is a production-ready authentication microservice. Make sure to configure all environment variables and security settings before deploying to production.

