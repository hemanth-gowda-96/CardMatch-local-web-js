# UNO Local Network Game 🃏

A multiplayer UNO card game that supports up to 10 players over a local network using WebSockets.

## 🎯 Why Our Version is Better

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

#### **UNO Penalty System** ⚠️

- Automatic 5-card penalty if you don't call UNO when going to 1 card
- Penalty triggers immediately when playing your second-to-last card without saying UNO
- No need to remember to press a button - the game handles it automatically
- Harsh penalty ensures players take UNO calls seriously!

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
- **Enhanced UNO rules** that actually make sense
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

## Development

Run in development mode with auto-restart:

```bash
npm run dev
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

**Official UNO Problems:**

- Wild Draw 4 is overpowered and undefendable ❌
- Illogical card stacking (mixing +2 and +4) ❌
- Winning with action cards feels cheap ❌
- Limited strategic depth ❌
- Frustrating "gotcha" moments ❌

**Our Solution:**

- Every card has a counter-strategy ✅
- Logical card type interactions ✅
- More skill-based gameplay ✅
- Strategic planning required ✅
- Fair and fun for everyone ✅

The official rules were designed for casual family play, but they create frustrating situations in competitive games. Our custom rules maintain the fun of UNO while adding the strategic depth that makes games truly engaging!

## 🔥 Rule Philosophy: "Better Than Mattel"

We believe games should be **strategic**, **fair**, and **fun**. The official UNO rules have several problems:

### Problem 1: Wild Draw 4 is Broken 💔

- In official rules, it's an "I win" button with no counterplay
- Creates feel-bad moments where skill doesn't matter
- **Our Fix**: Defense cards make it counterable and strategic

### Problem 2: Action Card Wins Feel Cheap 🎭

- Official rules allow winning with any card
- Leads to unsatisfying victories
- **Our Fix**: Must win with number/color cards, requiring planning

### Problem 3: Limited Strategic Depth 🧠

- Official rules are mostly luck-based
- Few meaningful decisions to make
- **Our Fix**: Every card interaction has strategic implications

### 🏆 The Result: A Better UNO Experience

Our version transforms UNO from a simple luck-fest into a **strategy game with heart**. Every card matters, every decision counts, and victory feels earned rather than random.

_"This is how UNO should have been designed from the beginning!"_ - Every player who tries our version
