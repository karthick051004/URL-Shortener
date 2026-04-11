# URL Shortener Design Document

## 1. Introduction

The URL Shortener is a web application that allows users to create shortened versions of long URLs for easier sharing and tracking. The system provides user authentication, URL shortening functionality, click tracking, and analytics dashboard. Users can register accounts, shorten URLs, view their shortened links, track click counts, and analyze click history over time.

The application consists of two main components: a backend API server built with Node.js and Express, and a frontend client built with React and Vite. The system uses MySQL as the database to store user information, shortened URLs, and click tracking data.

## 2. Problem Statement

Long URLs can be cumbersome to share, especially on platforms with character limits or when readability is important. Additionally, there's often a need to track how many times shortened links are clicked and when those clicks occur. Current solutions may lack comprehensive analytics, user management, or may not provide detailed click history.

The main challenges addressed by this system include:
- Creating unique, short identifiers for long URLs
- Providing user authentication and personalized URL management
- Tracking and storing click data with timestamps
- Displaying analytics in an intuitive dashboard
- Ensuring high availability and performance for URL redirections

## 3. Objectives

The primary objectives of the URL Shortener project are:

- **URL Shortening**: Generate unique short codes for any valid URL
- **User Management**: Allow users to register and authenticate securely
- **Click Tracking**: Record every click on shortened URLs with timestamps
- **Analytics Dashboard**: Provide users with insights into their URL performance
- **Security**: Implement proper authentication and authorization
- **Scalability**: Design the system to handle increasing loads
- **User Experience**: Create an intuitive interface for URL management

## 4. System Architecture

The application follows a client-server architecture with the following components:

### Backend Architecture
- **Express Server**: Handles HTTP requests and responses
- **Authentication Middleware**: JWT-based authentication for protected routes
- **Route Handlers**: Separate modules for authentication and URL operations
- **Database Layer**: MySQL connection pool for data persistence
- **Transaction Management**: Ensures data consistency for click tracking

### Frontend Architecture
- **React Application**: Single-page application with component-based structure
- **Routing**: React Router for navigation between pages
- **State Management**: React hooks for local state management
- **API Integration**: Fetch API for communicating with backend services
- **Charts**: Recharts library for data visualization

### Data Flow
1. User registers/logs in through frontend
2. JWT token stored in localStorage
3. User submits URL to shorten
4. Backend validates URL and generates unique short code
5. Shortened URL stored in database with user association
6. When short URL is accessed, system redirects and logs click
7. Analytics data displayed in dashboard with charts

## 5. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: MySQL v3.22.0
- **Authentication**: JSON Web Tokens (jsonwebtoken v9.0.2)
- **Password Hashing**: bcryptjs v2.4.3
- **URL Generation**: nanoid v5.1.7
- **CORS**: cors v2.8.6
- **Environment Management**: dotenv v17.4.1
- **Development**: nodemon v3.1.14

### Frontend
- **Framework**: React v19.2.4
- **Build Tool**: Vite v8.0.4
- **Routing**: React Router DOM v6.8.0
- **Charts**: Recharts v2.12.0


### Infrastructure
- **Database**: MySQL Server
- **Deployment**: Node.js runtime environment
- **Version Control**: Git

## 6. URL Shortening Logic

The URL shortening process follows these steps:

1. **Input Validation**: The original URL is validated using JavaScript's URL constructor
2. **Short Code Generation**: Uses nanoid library to generate a 6-character unique identifier
3. **Uniqueness Check**: Queries database to ensure the generated code doesn't exist
4. **Retry Mechanism**: If collision occurs, generates new code (up to 10 attempts)
5. **Database Storage**: Stores original URL, short code, and user ID in database
6. **Response**: Returns the full shortened URL with base domain

### Algorithm Details
- **Library**: nanoid (generates URL-safe, unique strings)
- **Length**: 6 characters (configurable)
- **Character Set**: URL-safe alphanumeric characters
- **Collision Handling**: Database lookup with retry logic
- **Error Handling**: Returns 500 error if unique code cannot be generated

## 7. Redirect Workflow

The redirect process is optimized for performance and reliability:

1. **Route Matching**: Express route `/:code` captures the short code
2. **Database Lookup**: Queries for original URL using short code
3. **Transaction Start**: Begins database transaction for consistency
4. **Click Recording**: Inserts timestamp into click_timestamps table
5. **Counter Update**: Increments click count in urls table
6. **Transaction Commit**: Ensures both operations succeed together
7. **HTTP Redirect**: Sends 302 redirect to original URL
8. **Error Handling**: Rolls back transaction on failures

### Performance Considerations
- **Connection Pooling**: MySQL connection pool prevents resource exhaustion
- **Transaction Isolation**: Ensures click counts remain accurate under concurrent access
- **Error Recovery**: Graceful handling of database errors
- **Connection Release**: Proper cleanup of database connections

## 8. Database Design

The system uses MySQL with three main tables:

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### URLs Table
```sql
CREATE TABLE urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Click Timestamps Table
```sql
CREATE TABLE click_timestamps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_id INT NOT NULL,
    redirected_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);
```

### Design Considerations
- **Normalization**: Separate tables for users, URLs, and click history
- **Indexing**: Primary keys and foreign keys for performance
- **Data Integrity**: Foreign key constraints with cascade delete
- **Scalability**: Separate click tracking table prevents URLs table bloat
- **Analytics Support**: Timestamped click data enables detailed analytics

## 9. Future Enhancements

### Short-term Improvements
- **Custom Short Codes**: Allow users to specify custom short codes
- **URL Expiration**: Add expiration dates for shortened URLs
- **Bulk Operations**: Support shortening multiple URLs at once
- **Export Analytics**: CSV/PDF export of click data
- **API Rate Limiting**: Prevent abuse with request throttling

### Long-term Features
- **Geographic Analytics**: Track click locations using IP geolocation
- **Device Analytics**: Categorize clicks by device type and browser
- **API Access**: RESTful API for third-party integrations


### Technical Improvements
- **Database Sharding**: Horizontal scaling for large datasets
- **Microservices**: Separate services for URL generation and analytics
- **Containerization**: Docker deployment for easier scaling
- **Monitoring**: Application performance monitoring and alerting
- **Testing**: Comprehensive unit and integration test coverage

## 10. Conclusion

The URL Shortener project successfully implements a complete web application for creating and managing shortened URLs with comprehensive analytics. The system provides a secure, user-friendly platform that addresses the core needs of URL shortening while offering valuable insights through click tracking and visualization.

The architecture is designed for scalability and maintainability, using modern web technologies and best practices. The separation of concerns between frontend and backend allows for independent development and deployment of each component.

Future enhancements outlined in this document provide a roadmap for continued improvement and feature expansion. The system is well-positioned to grow with increasing user demands and technological advancements.