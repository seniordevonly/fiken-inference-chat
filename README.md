# MIA Inference Chat UI

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy)

A React-based chat interface for Heroku's Managed Inference and Agents service.

## Features

- Modern React 18 application with TypeScript
- Heroku-themed UI with purple accents
- Real-time chat interface
- React Router v7 for navigation
- Fastify server for production deployment
- Fully configured for Heroku deployment

## Project Structure

```
.
├── app.json         # Heroku application configuration
├── client/          # React frontend application
│   ├── src/         # Source code
│   └── dist/        # Build output
└── server/          # Fastify server for serving the React app
    ├── src/         # Server source code
    └── dist/        # Server build output
```

## Prerequisites

- Node.js 22 or later
- pnpm 10 or later
- Heroku CLI (for deployment)

## Development

1. Install dependencies:

   ```bash
   # Install all dependencies using pnpm workspaces
   pnpm install
   ```

1. Set up environment variables:

   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env with your configuration
   ```

1. Start the development server:

   ```bash
   # Start both client and server in development mode
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Building for Production

1. Build all packages:

   ```bash
   pnpm build
   ```

1. Start the production server:
   ```bash
   pnpm start
   ```

## Deploying to Heroku

### Option 1: Deploy via Heroku CLI

1. Install the Heroku CLI AI plugin

   ```bash
   heroku plugins:install @heroku/plugin-ai
   ```

1. Create a new Heroku app:

   ```bash
   heroku create your-app-name
   ```

1. Provision the Heroku Managed Inference and Agents models

   ```bash
   heroku addons:create heroku-inference:claude-3-7-sonnet --as inference_3_7
   heroku addons:create heroku-inference:claude-3-5-sonnet-latest --as inference_3_5
   heroku addons:create heroku-inference:stable-image-ultra --as diffusion
   ```

1. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

### Option 2: Deploy via Heroku Dashboard

1. Fork or clone this repository
1. Connect your GitHub repository to Heroku
1. Enable automatic deploys or deploy manually from the Heroku Dashboard

## Scripts

- `pnpm dev`: Start development servers for both client and server
- `pnpm build`: Build both client and server for production
- `pnpm start`: Start the production server
- `pnpm test`: Run tests
- `pnpm lint`: Run linting
- `pnpm format`: Format code using Prettier

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache 2.0
