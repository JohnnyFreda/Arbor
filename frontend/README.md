# Arbor Frontend

React + TypeScript frontend for the Arbor application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

## Features

- User authentication with JWT (access + refresh tokens)
- Entry management (CRUD)
- Project management
- Tag management
- Calendar view
- Dashboard with insights
- Dark mode support
- Mobile responsive design

