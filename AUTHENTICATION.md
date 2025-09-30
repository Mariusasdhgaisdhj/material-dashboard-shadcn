# Authentication Setup

This document describes the authentication system implemented in the AgriReady3d dashboard.

## Features Implemented

### 1. Authentication Context
- Created `AuthContext` to manage user state globally
- Provides login, logout, and user profile fetching functionality
- Handles authentication state across the application

### 2. Login Integration
- Updated sign-in page to use authentication context
- Integrated with backend API for user authentication
- Added loading states and error handling
- Toast notifications for user feedback

### 3. Logout Functionality
- Added logout button to profile page
- Proper session cleanup and redirect to sign-in page
- User feedback with toast notifications

### 4. Admin Data Fetching
- Admin users see additional dashboard section
- Fetches admin statistics (total users, active sessions, system status)
- Conditional rendering based on user admin status

### 5. Route Protection
- All main routes are now protected and require authentication
- Unauthenticated users are redirected to sign-in page
- Loading states during authentication checks

## Backend API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user profile

### Admin
- `GET /api/admin/stats` - Get admin statistics

## Test Credentials

For testing purposes, use these credentials:
- **Email**: admin@example.com
- **Password**: admin123

## Usage

1. **Login**: Navigate to `/auth/sign-in` and enter credentials
2. **Profile**: Access user profile at `/profile` with logout functionality
3. **Admin Features**: Admin users see additional statistics in profile
4. **Protected Routes**: All main application routes require authentication

## File Structure

```
client/src/
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── components/
│   └── ProtectedRoute.tsx        # Route protection component
├── pages/
│   ├── auth/
│   │   └── sign-in.tsx          # Updated login page
│   └── profile.tsx              # Updated profile with logout
└── App.tsx                      # Updated with auth provider

server/
└── routes.ts                    # Backend authentication routes
```

## Security Notes

- Current implementation uses simple credential checking
- In production, implement proper password hashing
- Add session management and JWT tokens
- Implement proper CORS configuration
- Add input validation and sanitization
