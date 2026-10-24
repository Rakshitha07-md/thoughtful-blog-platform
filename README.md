# Blog Platform with Comments

A full-stack blog application built with React, Express, MongoDB, and JWT authentication.

## Features
- Register and log in
- JWT-protected API routes
- Create, edit, and delete your own blog posts
- Read posts from all users
- Add and delete your own comments
- Responsive layout

## Requirements
- Node.js 18+
- MongoDB Atlas account or local MongoDB

## 1. Configure the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and fill in your MongoDB connection string and a long random JWT secret.

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/blog_platform
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Start the API:
```bash
npm run dev
```
API health check: http://localhost:5000/api/health

## 2. Configure the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL Vite prints (normally http://localhost:5173).

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts` (login required)
- `PUT /api/posts/:id` (owner only)
- `DELETE /api/posts/:id` (owner only)
- `POST /api/posts/:id/comments` (login required)
- `DELETE /api/posts/:postId/comments/:commentId` (comment owner only)

## Notes
- Never commit your `.env` file or share your database password.
- This is a learning project. Before production, add rate limiting, email verification, password reset, stronger validation, and security monitoring.
