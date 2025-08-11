# Trustfolio Backend

Backend API for the Trustfolio application built with Node.js, Express.js, and MongoDB.

## Features

- RESTful API with Express.js
- MongoDB with Mongoose ODM
- User authentication and authorization
- Security middleware (Helmet, CORS)
- Request logging with Morgan
- Environment-based configuration
- Password hashing with bcrypt
- JWT token authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd trustfolio_backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret for JWT tokens
- `PORT`: Server port (default: 5000)

4. Start the development server
```bash
npm run dev
```

5. Start the production server
```bash
npm start
```

## API Endpoints

### Base URL
```
http://localhost:5000
```

### Health Check
- `GET /` - API status
- `GET /health` - Health check with uptime

### Planned Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/portfolios` - Get portfolios
- `POST /api/portfolios` - Create portfolio

## Project Structure

```
trustfolio_backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── utils/           # Utility functions
├── .env             # Environment variables
├── .gitignore       # Git ignore rules
├── package.json     # Dependencies and scripts
├── README.md        # Project documentation
└── server.js        # Main application file
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=main
DB_NAME=trustfolio
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
