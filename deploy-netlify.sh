#!/bin/bash

# AgriGrow Admin Dashboard - Netlify Deployment Script
echo "🚀 Starting Netlify deployment for AgriGrow Admin Dashboard..."

# Navigate to client directory
cd client

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production environment file
echo "🔧 Setting up environment variables..."
cat > .env.production << EOF
VITE_API_BASE_URL=https://serverside3.vercel.app
NODE_ENV=production
EOF

# Build the project
echo "🏗️ Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output is in: client/dist"
    echo ""
    echo "🌐 To deploy to Netlify:"
    echo "1. Go to https://netlify.com"
    echo "2. Click 'New site from Git'"
    echo "3. Connect your GitHub repository"
    echo "4. Set build command: cd client && npm install && npm run build"
    echo "5. Set publish directory: client/dist"
    echo "6. Add environment variable: VITE_API_BASE_URL = https://serverside3.vercel.app"
    echo "7. Deploy!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
