# Getting Started

This guide will help you set up the Trustfolio Backend API on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB Atlas account** or local MongoDB installation
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd trustfolio_backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Express.js (Web framework)
- Mongoose (MongoDB ODM)
- JWT (Authentication)
- bcrypt (Password hashing)
- And other security and utility packages

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=main
DB_NAME=trustfolio

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Add your IP address to the whitelist
5. Update the `MONGODB_URI` in your `.env` file

#### Option B: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Update `MONGODB_URI=mongodb://localhost:27017/trustfolio`

### 5. Generate JWT Secret

For production, generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` in the `.env` file.

## Running the Application

### Development Mode

Start the server with hot reloading:

```bash
npm run dev
```

The server will start at `http://localhost:3001` (or your configured PORT).

### Production Mode

```bash
npm start
```

## Verification

### 1. Check Server Status

Open your browser and navigate to:
- `http://localhost:3001/` - Should show API welcome message
- `http://localhost:3001/health` - Should show health status

### 2. Test API Endpoints

You can use tools like:
- **Postman** - GUI-based API testing
- **curl** - Command line tool
- **Thunder Client** (VS Code extension)
- **Insomnia** - API testing tool

Example curl command:
```bash
curl http://localhost:3001/api/categories
```

## Development Tools

### Recommended VS Code Extensions

- REST Client - Test APIs directly in VS Code
- MongoDB for VS Code - Database management
- Thunder Client - API testing
- GitLens - Enhanced Git capabilities
- Prettier - Code formatting
- ESLint - Code linting

### Package Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests (when implemented)
npm test

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Project Structure

```
trustfolio_backend/
├── controllers/         # Route controllers
│   └── categoryController.js
├── middleware/          # Custom middleware
│   └── auth.js
├── models/              # Mongoose models
│   ├── User.js
│   └── Category.js
├── routes/              # API routes
│   ├── auth.js
│   └── categories.js
├── docs/                # Documentation
├── config/              # Configuration files
├── utils/               # Utility functions
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── README.md           # Project overview
└── server.js           # Main application file
```

## Common Issues

### Port Already in Use

If port 3001 is already in use:

```bash
# Kill the process using the port (macOS/Linux)
sudo lsof -ti:3001 | xargs kill -9

# Or change the port in .env file
PORT=3002
```

### MongoDB Connection Issues

1. **Check connection string**: Ensure MongoDB URI is correct
2. **Network access**: Add your IP to MongoDB Atlas whitelist
3. **Authentication**: Verify username/password
4. **Firewall**: Check if port 27017 is blocked

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Read the API Documentation**: Check out [Categories API](./api/categories.md) and [Authentication](./api/authentication.md)
2. **Set up your frontend**: Configure your frontend application to connect to this API
3. **Test the endpoints**: Use Postman or similar tools to test all endpoints
4. **Deploy**: When ready, check the [Deployment Guide](./deployment.md)

## Need Help?

- Check the [Error Handling](./error-handling.md) guide
- Review the [Database Schema](./database-schema.md)
- Create an issue in the repository
- Contact the development team

Happy coding! 🚀
