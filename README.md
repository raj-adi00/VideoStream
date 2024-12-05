# **Itube** 🎥  
Welcome to **Itube Backend**, built using **Node.js** and **Express.js** with **JavaScript**. It powers a modern video platform with robust features for authentication, video management, chat, and more.  

---

## **Features** ✨  

- **User Authentication**: Secure login and registration using JSON Web Tokens (JWT).  
- **Video**: Perform CRUD operations for managing videos and track view counts.  
- **Tweet**: Post tweets with full CRUD functionality.  
- **Comment**: Add comments per video with options for CRUD operations.  
- **Chat**: Chat with users after adding them as friends.  
- **Watch History**: Track user watch history seamlessly.  

---

## **Tech Stack** 🛠️  

- **Node.js with Express.js**: Backend server and API development.  
- **MongoDB**: NoSQL database for storing all user and app data.  
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB.  
- **JWT**: Authentication and authorization mechanism.  
- **RESTful API**: Designed to handle CRUD operations efficiently.  
- **Socket.io**: Real-time, bi-directional communication for chatting.  
- **Cloudinary**: For storing videos, user avatars, and cover images.  
- **Multer**: For handling file uploads from users.  

---

## **Deployment** 🚀  
The backend is deployed on **Render**, ensuring scalability and reliability.

---

## **Getting Started** 🌟  

### **Prerequisites**  

1. Ensure **Node.js** is installed on your system.  
   ```bash
   node -v

### **Installation**  

1. **Clone the repository**:  
   ```bash
   git clone https://github.com/raj-adi00/VideoStream.git
   cd VideoStream
2. Install dependencies
   ```bash
   npm install
3. Configure environment variables
   Create .env file for MongoDB connection,JWT secret
   ```bash
   PORT=8000
   MONGODB_URI=<your-mongodb-connection-string>
   CORS_ORIGIN=https://itube-cyan.vercel.app/
   ACCESS_TOKEN_SECRET=<your-access-token-secret>
   ACCESS_TOKEN_EXPIRY=<access-token-expiry-duration>
   REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
   REFRESH_TOKEN_EXPIRY=<refresh-token-expiry-duration>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   GOOGLE_ACCOUNT_PASS=<your-google-account-pass for sending mail on uploading video. You can get it for your individual google account>

5. Start the backend server
   ```bash
   npm run dev
6. Backend is hosted on http://localhost:8000
## **Folder Structure** 📂  

- `VideoStream/`  
  - `Public/`  
    - `temp/` - Stores files from users while uploading to Cloudinary.  
  - `src/`  
    - `SocketWeb/` - Handles WebSocket connections for real-time communication.  
    - `controllers/` - Contains business logic for API endpoints.  
    - `db/` - Database connection and configuration files.  
    - `middleware/` - Middleware functions for authentication, logging, etc.  
    - `models/` - Defines Mongoose schemas for the database.  
    - `routers/` - Route definitions for the application.  
    - `utils/` - Utility functions and helpers.  
    - `app.js` - Main Express application setup.  
    - `constants.js` - Application constants and configurations.  
    - `index.js` - Entry point for starting the server.  
