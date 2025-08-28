# GitHub Pages Deployment Guide

This project is configured for deployment to GitHub Pages using the `gh-pages` package.

## Setup Instructions

1. **Update the homepage URL**: 
   - Open `package.json`
   - Replace `your-username` and `your-repo-name` in the homepage field with your actual GitHub username and repository name:
   ```json
   "homepage": "https://your-username.github.io/your-repo-name"
   ```

2. **Enable GitHub Pages** (if not already done):
   - Go to your GitHub repository
   - Navigate to Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select the `gh-pages` branch (this will be created automatically when you first deploy)

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

## Important Notes

- Only the client-side React application is deployed to GitHub Pages
- The server components are not deployed (GitHub Pages only serves static files)
- The `build` directory is excluded from version control via `.gitignore`
- Make sure to update the homepage URL in `package.json` before deploying

## Troubleshooting

If deployment fails:
1. Ensure you have the correct repository permissions
2. Verify the homepage URL is correct
3. Check that GitHub Pages is enabled in repository settings
4. Make sure the `gh-pages` branch exists and is set as the Pages source
