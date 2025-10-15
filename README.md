# CardMatch Local Network Game 🃏

Inspired by the classic UNO card game.

A multiplayer CardMatch card game that supports up to 10 players over a local network using WebSockets.

## 🎯 Why CardMatch is Better

The official UNO rules can be frustrating and boring. We've implemented **custom rules** that make the game more strategic, fair, and exciting!

### 🚀 Our Custom Rules (Better Than Official!)

#### **Enhanced +4 Defense Rule** ⚡

- **Official Rule**: When someone plays a Wild Draw 4, you're forced to draw 4 cards. Period. Boring!
- **Our Rule**: After a +4 is played, you have limited but powerful options:
  - **Another +4**: Stack it to pass 8 cards to the next player!
  - **Skip** (declared color): Counter the +4 completely - you don't draw any cards!
  - **Reverse** (declared color): Send the +4 back to the original player who played it!
  - **❌ No +2 Cards**: Cannot play Draw 2 cards on top of +4 (different card types don't stack)

_This creates strategic +4 battles while maintaining logical card interaction rules._

#### **Strategic Card Stacking** 📚

- **Draw 2 Stacking**: Draw 2 cards can be stacked with other Draw 2 cards only
- **Wild +4 Stacking**: Wild Draw 4 cards can be stacked with other Wild Draw 4 cards
- **No Cross-Stacking**: +2 and +4 cards cannot be mixed (maintains card type logic)
- Creates exciting same-type chain reactions and strategic depth

#### **Anti-Camping Rule** 🏕️

- Cannot win with action cards (Skip, Reverse, Draw 2, Wild Draw 4)
- Prevents cheap wins and encourages more strategic play
- Forces players to plan their final moves carefully

#### **CardMatch Penalty System** ⚠️

- Automatic 5-card penalty if you don't call CardMatch when going to 1 card
- Penalty triggers immediately when playing your second-to-last card without saying CardMatch
- No need to remember to press a button - the game handles it automatically
- Harsh penalty ensures players take CardMatch calls seriously!

#### **Continuous Play Rule** 🏁

- **Official Rule**: Game ends when first player finishes. Other players' positions are unclear.
- **Our Rule**: Game continues until only one player remains!
  - **1st Place**: First to finish gets the win 🥇
  - **2nd, 3rd, etc.**: Clear finishing order for all players 🥈🥉
  - **Last Place**: Final player becomes the official loser 💀

_This creates more engagement as everyone plays to avoid being last, not just to win first. No more "dead time" after someone wins!_

## Features

- Real-time multiplayer gameplay for 2-10 players
- Local network support (no internet required!)
- WebSocket-based communication for instant updates
- **Enhanced CardMatch rules** that actually make sense
- Responsive web interface that works on phones and computers
- Real-time game activity feed
- Visual player indicators and turn management

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

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Linux/macOS - Start in background
./docker-helper.sh start-bg

# Windows - Start in background
docker-helper.bat start-bg

# Or using docker-compose directly
docker-compose up -d --build

# Access the game at: http://localhost:3000
```

### Docker Benefits

- ✅ **Consistent Environment**: Same runtime across all machines
- ✅ **Easy Deployment**: One command setup
- ✅ **Isolated Dependencies**: No conflicts with system packages
- ✅ **Production Ready**: Includes health checks and security
- ✅ **Network Optimized**: Proper port configuration

See [DOCKER.md](DOCKER.md) for detailed Docker documentation and troubleshooting.

## Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Run in development mode with auto-restart
npm run dev

# Run tests
npm test
```

### Docker Commands

```bash
# Build Docker image
./docker-helper.sh build

# Start CardMatch (background)
./docker-helper.sh start-bg

# View logs
./docker-helper.sh logs

# Stop CardMatch
./docker-helper.sh stop

# Show container status
./docker-helper.sh status
```

## 🏗️ Technical Features

### Game Architecture

- `server/` - Node.js server with WebSocket handling
- `client/` - Frontend HTML/CSS/JavaScript
- `shared/` - Shared game logic and constants
- Real-time synchronization across all devices
- Optimized for local network performance

### 🌐 Network Setup

- Works on any local WiFi network
- No external internet required
- Supports up to 10 simultaneous players
- Automatic game state synchronization
- Mobile-friendly responsive design

### 🎨 User Experience

- Clean, modern interface
- Real-time visual feedback
- Interactive card animations
- Live game activity notifications
- Intuitive touch/click controls

## How to Play

1. **Create or Join**: One player creates a game room, others join using the room code
2. **Start Playing**: Game starts automatically when 2+ players are ready
3. **Strategic Gameplay**: Use our enhanced rules to outplay your opponents!
4. **Win Condition**: Be the first to play all your cards (but remember - no winning with action cards!)

### 🎮 Key Gameplay Tips

- **Defend Against +4**: Save Skip/Reverse cards in the declared color to counter Wild Draw 4 attacks
- **Plan Your Finish**: Make sure your last card isn't an action card
- **Stack Draws**: Use Draw 2 and Wild Draw 4 strategically to create devastating combos
- **Watch the Activity**: Keep an eye on the game activity feed to track what's happening

## 🎲 Why These Rules Matter

The official rules were designed for casual family play, but they create frustrating situations in competitive games. Our custom rules maintain the fun of CardMatch while adding the strategic depth that makes games truly engaging!

## 🔥 Rule Philosophy: "Better Than Mattel"

We believe games should be **strategic**, **fair**, and **fun**. The official CardMatch rules have several problems:

### Problem : Limited Strategic Depth 🧠

- Official rules are mostly luck-based
- Few meaningful decisions to make
- **Our Fix**: Every card interaction has strategic implications - Not in near future 

### 🏆 The Result: A Better CardMatch Experience

Our version transforms CardMatch from a simple luck-fest into a **strategy game with heart**. Every card matters, every decision counts, and victory feels earned rather than random.

## 📋 Development Status & TODO

### Current Status: ✅ **Production Ready**
- ✅ Core game mechanics working
- ✅ Enhanced +4 rules implemented  
- ✅ Multi-player support (up to 10 players)
- ✅ Docker containerization
- ✅ Network setup guides

### Known Issues & Improvements Needed:
- 📱 **Responsive Design**: Mobile and small laptop screen optimization needed
- 🎨 **UI Polish**: Interface improvements for better user experience
- 🔧 **Performance**: WebSocket and animation optimizations

See [TODO.md](TODO.md) for detailed improvement plans and implementation roadmap.

### Contributing:
This is an hobby project! Check the TODO document for areas where help is needed, especially:
- Mobile-first responsive design
- Touch interface improvements
- Cross-browser testing
