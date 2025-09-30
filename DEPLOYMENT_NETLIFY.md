# Netlify Deployment Guide for AgriGrow Admin Dashboard

## Prerequisites
- Netlify account (free tier available)
- GitHub repository with your code
- Node.js 18+ installed locally

## Step 1: Prepare Your Repository

### 1.1 Create Environment Variables
Create a `.env.production` file in the `client` directory:

```bash
# In material-dashboard-shadcn/client/.env.production
VITE_API_BASE_URL=https://serverside3.vercel.app
NODE_ENV=production
```

### 1.2 Update Package.json Scripts
Ensure your `client/package.json` has the correct build script:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "dev": "cross-env NODE_ENV=development vite"
  }
}
```

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to [Netlify](https://netlify.com) and sign in**

2. **Click "New site from Git"**

3. **Connect your GitHub repository:**
   - Choose your repository: `AgriReady3d`
   - Select the branch: `main` or `master`

4. **Configure Build Settings:**
   - **Base directory:** `material-dashboard-shadcn`
   - **Build command:** `cd client && npm install && npm run build`
   - **Publish directory:** `client/dist`

5. **Set Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://serverside3.vercel.app`
   - Add: `NODE_ENV` = `production`

6. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete (usually 2-5 minutes)

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Navigate to your project:**
   ```bash
   cd material-dashboard-shadcn
   ```

4. **Build the project:**
   ```bash
   cd client
   npm install
   npm run build
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

## Step 3: Configure Custom Domain (Optional)

1. **Go to Site settings → Domain management**
2. **Add your custom domain**
3. **Configure DNS settings as instructed by Netlify**

## Step 4: Environment Variables in Netlify

### Required Environment Variables:
- `VITE_API_BASE_URL`: `https://serverside3.vercel.app`
- `NODE_ENV`: `production`

### How to Set:
1. Go to your site dashboard
2. Click "Site settings"
3. Go to "Environment variables"
4. Click "Add variable"
5. Add each variable with its value

## Step 5: Build Configuration

The `netlify.toml` file is already configured with:
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`
- Redirects for SPA routing
- Security headers
- Asset caching

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check Node.js version (should be 18+)
   - Ensure all dependencies are in `package.json`
   - Check environment variables are set

2. **API Calls Fail:**
   - Verify `VITE_API_BASE_URL` is set correctly
   - Check CORS settings on your backend
   - Test API endpoints manually

3. **Routing Issues:**
   - The `netlify.toml` includes SPA redirects
   - All routes should redirect to `index.html`

4. **Environment Variables Not Working:**
   - Ensure variables start with `VITE_`
   - Redeploy after adding variables
   - Check variable names match exactly

## Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] API calls work (check browser console)
- [ ] All pages are accessible
- [ ] Charts and data display correctly
- [ ] Authentication works (if implemented)
- [ ] Mobile responsiveness works

## Monitoring

- Check Netlify dashboard for build logs
- Monitor site performance in Netlify Analytics
- Set up form notifications if needed

## Support

If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test locally with production build
4. Check browser console for errors

Your AgriGrow Admin Dashboard should now be live on Netlify! 🚀
