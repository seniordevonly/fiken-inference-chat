# Heroku Inference Chat UI

A React-based chat interface for Heroku's Inference and Agents service, inspired by Vercel's AI SDK demo.

## Features

- Modern React 18 application with TypeScript
- Heroku-themed UI with purple accents
- Real-time chat interface
- React Router v7 for navigation
- Fastify server for production deployment

## Project Structure

```
.
├── client/          # React frontend application
└── server/          # Node.js server for serving the React app
```

## Development

1. Install dependencies:
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

2. Start the development server:
   ```bash
   # Start both client and server in development mode
   npm run dev
   ```

## Building for Production

1. Build the client:
   ```bash
   cd client && npm run build
   ```

2. Build the server:
   ```bash
   cd ../server && npm run build
   ```

## Deploying to Heroku

1. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

## Environment Variables

- `PORT`: The port number for the server (default: 3000)

## License

MIT 