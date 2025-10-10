# UNO Local Network Game

A multiplayer UNO card game that supports up to 10 players over a local network using WebSockets.

## Features

- Real-time multiplayer gameplay for 2-10 players
- Local network support
- WebSocket-based communication
- Full UNO rules implementation
- Responsive web interface

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

4. Share your local IP address with other players on the same network

## Development

Run in development mode with auto-restart:

```bash
npm run dev
```

## Game Structure

- `server/` - Node.js server with WebSocket handling
- `client/` - Frontend HTML/CSS/JavaScript
- `shared/` - Shared game logic and constants

## How to Play

1. One player creates a game room
2. Other players join using the room code
3. Game starts automatically when 2+ players are ready
4. Follow standard UNO rules to win!
