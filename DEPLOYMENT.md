# GitHub Pages Deployment Guide

This project is configured for deployment to GitHub Pages using the `gh-pages` package with support for client-side routing.

## Current Configuration

✅ **Already Configured:**
- Homepage URL: `https://creativetimofficial.github.io/material-dashboard-shadcn`
- Vite base path: `/material-dashboard-shadcn/` (for production builds)
- SPA routing support for GitHub Pages
- 404.html fallback for client-side routes

## Setup Instructions

1. **GitHub Pages Settings** (if not already done):
   - Go to your GitHub repository
   - Navigate to Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select the `gh-pages` branch (this will be created automatically when you first deploy)
   - Set folder to `/ (root)`

## Deployment Commands

The following scripts are available for deployment:

```bash
# Build the client-side application only
npm run build:client

# Build and deploy to GitHub Pages (runs predeploy automatically)
npm run deploy

# Predeploy script (builds the project before deployment)
npm run predeploy
```

## Deployment Process

1. **Make your changes** and commit them to your main branch
2. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

This will:
- Run the `predeploy` script which builds the client application
- Deploy the `build` directory contents to the `gh-pages` branch
- Your site will be available at the URL specified in the homepage field

## Recent Fixes Applied

✅ **GitHub Pages Routing Issues Fixed:**
- Added proper `base` path configuration in `vite.config.ts` for production builds
- Implemented SPA routing support with 404.html fallback
- Added GitHub Pages routing script to handle client-side navigation
- Configured proper asset path resolution for subdirectory deployment

## Important Notes

- Only the client-side React application is deployed to GitHub Pages
- The server components are not deployed (GitHub Pages only serves static files)
- The `build` directory is excluded from version control via `.gitignore`
- Vite automatically uses `/material-dashboard-shadcn/` as base path for production builds
- Client-side routing (Wouter) is fully supported with 404.html fallback

## Troubleshooting

If the site doesn't load or shows blank page:
1. ✅ **Check asset paths** - Fixed: Vite now uses correct base path `/material-dashboard-shadcn/`
2. ✅ **Check routing** - Fixed: Added SPA routing support with 404.html
3. **Verify deployment** - Run `npm run deploy` to push latest changes
4. **Check GitHub Pages settings** - Ensure `gh-pages` branch is selected as source
5. **Clear browser cache** - Hard refresh (Ctrl+F5) after deployment

If deployment fails:
1. Ensure you have the correct repository permissions
2. Verify the homepage URL matches your repository
3. Check that GitHub Pages is enabled in repository settings
4. Make sure the `gh-pages` branch exists and is set as the Pages source
