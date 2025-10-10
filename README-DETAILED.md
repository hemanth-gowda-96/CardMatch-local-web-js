# 🃏 UNO Local Network Game

A full-featured multiplayer UNO card game that supports up to 10 players over a local network using WebSockets. Built with Node.js, Socket.IO, and vanilla JavaScript.

## ✨ Features

- 🎮 Real-time multiplayer gameplay for 2-10 players
- 🌐 Local network support - no internet required
- ⚡ WebSocket-based real-time communication
- 🎯 Complete UNO rules implementation
- 📱 Responsive web interface for all devices
- 🎨 Beautiful, intuitive card interface
- 🏆 Score tracking across rounds
- 🔥 UNO challenge system
- ⏭️ Special cards: Skip, Reverse, Draw 2, Wild, Wild Draw 4

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation & Setup

1. **Clone or download this project**

   ```bash
   cd uno-local-js
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the server**

   ```bash
   npm start
   ```

4. **Open the game**

   - On the host computer: Open `http://localhost:3000`
   - On other devices: Open `http://[HOST_IP]:3000`
   - The server will display both addresses when it starts

5. **Share with friends**
   - Share the network IP address with other players
   - All players must be on the same local network (WiFi)

### Example Server Output

```
🃏 UNO Game Server running on:
   Local: http://localhost:3000
   Network: http://192.168.1.100:3000

📱 Share the network address with other players on your local network!
```

## 🎮 How to Play

### Starting a Game

1. **Create Room**: First player enters their name and clicks "Create Room"
2. **Join Room**: Other players enter their name, the room code, and click "Join"
3. **Start Game**: Room host clicks "Start Game" when everyone has joined

### Game Rules

- Each player starts with 7 cards
- Match the top card by color or number
- Special cards have unique effects:
  - **Skip**: Next player loses their turn
  - **Reverse**: Direction of play reverses
  - **Draw 2**: Next player draws 2 cards and loses turn
  - **Wild**: Choose any color
  - **Wild Draw 4**: Choose color, next player draws 4 cards
- Say "UNO" when you have one card left!
- First player to empty their hand wins the round

### Controls

- **Click a card** to play it
- **Click "Draw"** to draw from the deck
- **Click "UNO!"** when you have 2 cards (before playing your second-to-last card)
- **Choose color** when playing Wild cards

## 🛠️ Development

### Run in Development Mode

```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

### Run Tests

```bash
npm test
```

### Project Structure

```
uno-local-js/
├── client/           # Frontend files
│   ├── index.html    # Main HTML interface
│   ├── styles.css    # Game styling
│   └── game-client.js # Client-side game logic
├── server/           # Backend files
│   └── server.js     # Express + Socket.IO server
├── shared/           # Shared game logic
│   ├── constants.js  # Game constants
│   ├── deck.js       # Card and Deck classes
│   └── game.js       # Core game engine
├── test/             # Test files
│   └── game-test.js  # Game logic tests
└── package.json      # Project configuration
```

## 🔧 Technical Details

### Server

- **Express.js** for serving static files
- **Socket.IO** for real-time WebSocket communication
- **UUID** for generating unique player and room IDs
- Automatic local IP detection for network play

### Client

- **Vanilla JavaScript** (no frameworks)
- **CSS Grid & Flexbox** for responsive layout
- **Socket.IO Client** for server communication
- **Responsive design** works on phones, tablets, and desktops

### Game Engine

- **Complete UNO rule implementation**
- **State management** for multiple concurrent games
- **Player hand management** with card validation
- **Turn-based logic** with special card effects
- **Score calculation** and round management

## 🌐 Network Setup Tips

### For WiFi Networks

1. Make sure all devices are connected to the same WiFi network
2. Some corporate/school networks may block the connection
3. Try using a mobile hotspot if needed

### For Wired Networks

1. Ensure all computers are on the same subnet
2. Check firewall settings if connections fail

### Troubleshooting

- **Can't connect?** Try disabling firewall temporarily
- **Game lagging?** Check WiFi signal strength
- **Room not found?** Make sure room code is correct
- **Cards not loading?** Refresh the browser page

## 🎯 Game Features

### Implemented Rules

- ✅ Standard UNO card deck (108 cards)
- ✅ Number cards (0-9 in 4 colors)
- ✅ Skip, Reverse, Draw 2 cards
- ✅ Wild and Wild Draw 4 cards
- ✅ Color declaration for Wild cards
- ✅ UNO declaration system
- ✅ Draw card penalty for not saying UNO
- ✅ Score calculation
- ✅ Multiple rounds

### Special Features

- 🎨 **Visual card representations** with colors and symbols
- 💬 **Real-time notifications** for all game events
- 👥 **Player status tracking** (hand size, current turn)
- 🔄 **Auto-reconnection** handling
- 📊 **Score tracking** across multiple rounds
- 🎯 **Turn indicators** and game state display

## 🤝 Contributing

Feel free to fork this project and add your own features! Some ideas:

- Add sound effects
- Implement tournament mode
- Add different card themes
- Create AI players
- Add chat system

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🎉 Enjoy Playing!

Have fun playing UNO with your friends and family! This game is perfect for:

- Family game nights
- Office parties
- Friend gatherings
- Remote team building
- Classroom activities

---

**Made with ❤️ for local network fun!**
