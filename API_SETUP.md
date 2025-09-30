# AgriGrow Admin Dashboard - API Setup

## Backend Connection

The admin dashboard is configured to fetch data from the AgriGrow backend API. Here's how to set it up:

### 1. Environment Configuration

Create a `.env` file in the `client` directory with the following content:

```env
# API Configuration - Use local backend for development
VITE_API_BASE_URL=http://localhost:3000
```

**IMPORTANT**: The default is now set to `http://localhost:3000` for local development. If you want to use the Vercel deployment, change it to:
```env
VITE_API_BASE_URL=https://serverside3.vercel.app
```

### 2. Backend Endpoints

The dashboard expects the following API endpoints to be available:

- `GET /orders?page=1&limit=50` - Fetch orders
- `GET /products?page=1&limit=50` - Fetch products  
- `GET /users?page=1&limit=50` - Fetch users
- `GET /categories` - Fetch categories
- `GET /posts?page=1&limit=50` - Fetch forum posts
- `GET /conversations/{userId}?page=1&limit=50` - Fetch conversations

### 3. Expected Response Format

All endpoints should return data in this format:
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "total": 100
}
```

### 4. Running the Backend

To run the backend locally:

1. Navigate to the backend directory:
   ```bash
   cd serverside3/server_side/online_store_api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create `.env` file with database credentials)

4. Run the server:
   ```bash
   npm start
   ```

The backend should be available at `http://localhost:3000`

### 4.1. Test Backend Connection

Before running the frontend, test if your backend is working:

```bash
# From the material-dashboard-shadcn directory
node test-backend.js
```

This will test all the required endpoints and show you which ones are working.

### 5. Running the Frontend

1. Navigate to the client directory:
   ```bash
   cd material-dashboard-shadcn/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **No .env file needed!** The frontend now uses a proxy to avoid CORS issues.

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### 5.1. Test Proxy Connection

After starting the frontend, test if the proxy is working:

```bash
# From the material-dashboard-shadcn directory
node test-proxy.js
```

This will test the proxy connection to the backend.

### 6. Features

The admin dashboard includes:

- **Dashboard**: Overview with statistics
- **Orders**: View and manage orders
- **Products**: Manage product catalog
- **Users**: User management
- **Categories**: Product categories
- **Payments**: Payment method analytics
- **Messages**: User conversations
- **Forum**: Community posts
- **Reports**: Analytics and insights

### 7. Troubleshooting

If you see "No data found" or loading errors:

1. Check that the backend is running
2. Verify the API URL in `.env` file
3. Check browser console for error messages
4. Ensure the backend endpoints are accessible
5. Check CORS settings if running locally

### 8. Data Seeding

To populate the database with sample data, you can use the backend's seeding endpoints:

- `POST /categories/seed` - Seed categories and subcategories
- Other seeding endpoints as available

This will help you see data in the admin dashboard.
