# Resume Automation Platform - Frontend

A modern, AI-powered web application that helps job seekers tailor their resumes for specific job descriptions using advanced AI analysis and ATS optimization.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Overview

This is the frontend application for the Resume Automation Platform. It provides a user-friendly interface for:
- User authentication and account management
- Resume upload and management
- Job description analysis
- AI-powered resume customization
- PDF generation and preview
- Resume optimization tracking

## Features

- **User Authentication**: Secure signup and login with JWT tokens
- **Resume Management**: Upload, edit, and manage multiple resumes
- **Job Analysis**: Paste job descriptions for AI analysis
- **Resume Tailoring**: Generate customized resumes for specific job postings
- **ATS Optimization**: Ensure resumes pass Applicant Tracking Systems
- **PDF Generation**: Download tailored resumes as PDFs
- **Real-time Feedback**: Get instant suggestions for resume improvements
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16.1.6
- **UI Library**: React 19.2.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **PDF Handling**: jsPDF, pdfjs-dist
- **Icons**: Lucide React
- **Notifications**: React Toastify

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **Git**: For version control

Verify installation:
```bash
node --version
npm --version
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Resume-Automation/app
```

### 2. Install Dependencies

```bash
npm install
```

If you encounter peer dependency issues, use:
```bash
npm install --legacy-peer-deps
```

### 3. Verify Installation

```bash
npm list
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory of the app:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:10000/api

# Feature Flags (optional)
NEXT_PUBLIC_ATS_LLM_BETA=false
```

**Important**: 
- `NEXT_PUBLIC_API_URL` must point to your backend server
- The default backend port is `10000`
- Ensure the backend server is running before starting the frontend
- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

### Backend Connection

The frontend communicates with the backend API at the URL specified in `NEXT_PUBLIC_API_URL`. Ensure:
1. The backend server is running on the specified port
2. CORS is properly configured on the backend
3. The API endpoints are accessible

## Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://<your-ip>:3000

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Linting

Check code quality:

```bash
npm run lint
```

## Project Structure

```
app/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Auth/           # Authentication components
│   │   ├── Resume/         # Resume-related components
│   │   ├── Job/            # Job analysis components
│   │   └── Common/         # Shared components
│   ├── pages/              # Next.js pages and routes
│   ├── services/           # API service calls
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static assets
├── .env.local             # Environment variables (local)
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build optimized production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:10000/api` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ATS_LLM_BETA` | Enable ATS LLM beta features | `false` |

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

Or kill the process using the port:
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Backend Connection Issues

**Error**: `Failed to connect to API`

1. Verify backend is running:
   ```bash
   curl http://localhost:10000/api/ping
   ```

2. Check `NEXT_PUBLIC_API_URL` in `.env.local`

3. Ensure backend CORS allows requests from `http://localhost:3000`

4. Check browser console for detailed error messages

### Build Errors

**Error**: `Module not found`

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error**: `TypeScript compilation errors`

```bash
# Check for type errors
npm run lint
```

### Hot-Reload Not Working

1. Ensure you're in development mode (`npm run dev`)
2. Check that file changes are being detected
3. Restart the development server

### API Calls Returning 401 Unauthorized

1. Check if authentication token is stored correctly
2. Verify token hasn't expired
3. Try logging in again
4. Check browser's Application tab for stored tokens

## Development Tips

### Adding New Components

1. Create component in `src/components/`
2. Use TypeScript for type safety
3. Follow existing naming conventions
4. Export from component index file

### API Integration

1. Create service in `src/services/`
2. Use Axios for HTTP requests
3. Handle errors gracefully
4. Use TypeScript interfaces for responses

### State Management

1. Use Zustand stores in `src/store/`
2. Keep stores focused and modular
3. Use TypeScript for type safety

## Performance Optimization

- Next.js automatic code splitting
- Image optimization with next/image
- CSS-in-JS with Tailwind (no runtime overhead)
- Client-side state with Zustand (minimal bundle size)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android latest

## Getting Help

- Check the [troubleshooting section](#troubleshooting)
- Review backend API documentation
- Check browser console for error messages
- Verify all environment variables are set correctly

## License

ISC
