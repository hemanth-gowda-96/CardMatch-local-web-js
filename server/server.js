const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { CardMatchGame } = require("../shared/game");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// Store active games
const games = new Map();
const playerSockets = new Map(); // Map socket IDs to player info

// Get local IP address for network access
function getLocalIP() {
  const interfaces = require("os").networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        return interface.address;
      }
    }
  }
  return "localhost";
}

// Generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Validate and sanitize custom room names
function validateRoomName(roomName) {
  if (!roomName || typeof roomName !== 'string') {
    return { valid: false, error: "Room name is required" };
  }

  const trimmed = roomName.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: "Room name cannot be empty" };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "Room name must be 20 characters or less" };
  }

  // Allow letters, numbers, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return { valid: false, error: "Room name can only contain letters, numbers, spaces, hyphens, and underscores" };
  }

  return { valid: true, sanitized: trimmed };
}

// Broadcast game state to all players in a room
function broadcastGameState(roomId, excludeSocket = null) {
  const game = games.get(roomId);
  if (!game) return;

  const gameState = game.getGameState();

  // Send general game state to all players
  const sockets = Array.from(io.sockets.sockets.values()).filter(
    (socket) => socket.roomId === roomId && socket !== excludeSocket
  );

  sockets.forEach((socket) => {
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      // Send personalized state with player's hand
      const personalizedState = {
        ...gameState,
        yourHand: game.getPlayerHand(playerInfo.playerId),
        isYourTurn: gameState.currentPlayer === playerInfo.playerId,
      };
      socket.emit("gameState", personalizedState);
    }
  });
}

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Create a new game room
  socket.on("createRoom", (data) => {
    try {
      // Handle both old format (just playerName) and new format (object with playerName and customRoomName)
      const playerName = typeof data === 'string' ? data : data.playerName;
      const customRoomName = typeof data === 'object' ? data.customRoomName : '';

      let roomId;

      if (customRoomName) {
        // Validate custom room name
        const validation = validateRoomName(customRoomName);
        if (!validation.valid) {
          socket.emit("error", { message: validation.error });
          return;
        }

        roomId = validation.sanitized;

        // Check if custom room name already exists
        if (games.has(roomId)) {
          socket.emit("error", { message: "Room name already exists. Please choose a different name." });
          return;
        }
      } else {
        // Generate random room code
        roomId = generateRoomCode();
      }

      const playerId = uuidv4();
      const game = new CardMatchGame(roomId);

      // Add player to game
      const player = game.addPlayer(playerId, playerName, socket.id);

      // Store game and player info
      games.set(roomId, game);
      playerSockets.set(socket.id, { playerId, roomId, playerName });

      // Join socket room
      socket.join(roomId);
      socket.roomId = roomId;

      socket.emit("roomCreated", {
        roomId,
        playerId,
        playerName,
        isHost: true,
      });

      broadcastGameState(roomId);

      console.log(`Room ${roomId} created by ${playerName}`);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Join an existing room
  socket.on("joinRoom", ({ roomId, playerName }) => {
    try {
      let game = games.get(roomId);

      // If not found and roomId looks like a traditional code, try case-insensitive search
      if (!game && /^[A-Za-z0-9]{1,6}$/.test(roomId)) {
        const upperRoomId = roomId.toUpperCase();
        game = games.get(upperRoomId);
        roomId = upperRoomId; // Use the correct case for subsequent operations
      }

      if (!game) {
        throw new Error("Room not found");
      }

      const playerId = uuidv4();
      const player = game.addPlayer(playerId, playerName, socket.id);

      // Store player info
      playerSockets.set(socket.id, { playerId, roomId, playerName });

      // Join socket room
      socket.join(roomId);
      socket.roomId = roomId;

      socket.emit("roomJoined", {
        roomId,
        playerId,
        playerName,
        isHost: false,
      });

      // Notify all players
      socket.to(roomId).emit("playerJoined", {
        playerId,
        playerName,
      });

      broadcastGameState(roomId);

      console.log(`${playerName} joined room ${roomId}`);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Start the game
  socket.on("startGame", () => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        throw new Error("Player not found");
      }

      const game = games.get(playerInfo.roomId);
      if (!game) {
        throw new Error("Game not found");
      }

      game.startGame();

      // Notify all players
      io.to(playerInfo.roomId).emit("gameStarted");
      broadcastGameState(playerInfo.roomId);

      console.log(`Game started in room ${playerInfo.roomId}`);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Play a card
  socket.on("playCard", ({ cardIndex, declaredColor }) => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        throw new Error("Player not found");
      }

      const game = games.get(playerInfo.roomId);
      if (!game) {
        throw new Error("Game not found");
      }

      const result = game.playCard(
        playerInfo.playerId,
        cardIndex,
        declaredColor
      );

      // Notify all players of the card play
      io.to(playerInfo.roomId).emit("cardPlayed", {
        playerId: playerInfo.playerId,
        playerName: playerInfo.playerName,
        cardIndex,
        declaredColor,
        gameEnded: result.gameEnded,
        winner: result.winner,
        invalidWin: result.invalidWin,
        cardMatchViolation: result.cardMatchViolation,
        message: result.message,
        playerFinished: result.playerFinished,
        finishingOrder: result.finishingOrder,
        remainingPlayers: result.remainingPlayers,
      });

      broadcastGameState(playerInfo.roomId);

      if (result.gameEnded) {
        console.log(
          `Game ended in room ${playerInfo.roomId}. Winner: ${result.winner.name}`
        );
      }
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Draw a card
  socket.on("drawCard", () => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        throw new Error("Player not found");
      }

      const game = games.get(playerInfo.roomId);
      if (!game) {
        throw new Error("Game not found");
      }

      const result = game.drawCard(playerInfo.playerId);

      // Notify all players
      io.to(playerInfo.roomId).emit("cardDrawn", {
        playerId: playerInfo.playerId,
        playerName: playerInfo.playerName,
        forced: result.forced,
        cardCount: result.cards || 1,
        hasPlayableCard: result.hasPlayableCard,
      });

      broadcastGameState(playerInfo.roomId);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Say CardMatch
  socket.on("sayCardMatch", () => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const game = games.get(playerInfo.roomId);
      if (!game) return;

      const success = game.sayCardMatch(playerInfo.playerId);

      if (success) {
        io.to(playerInfo.roomId).emit("cardMatchSaid", {
          playerId: playerInfo.playerId,
          playerName: playerInfo.playerName,
        });
      }
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Challenge CardMatch
  socket.on("challengeCardMatch", (challengedPlayerId) => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const game = games.get(playerInfo.roomId);
      if (!game) return;

      const result = game.challengeCardMatch(playerInfo.playerId, challengedPlayerId);

      io.to(playerInfo.roomId).emit("cardMatchChallenged", {
        challengerId: playerInfo.playerId,
        challengedId: challengedPlayerId,
        valid: result.valid,
        penalty: result.penalty,
      });

      broadcastGameState(playerInfo.roomId);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Pass turn (after drawing)
  socket.on("passTurn", () => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        throw new Error("Player not found");
      }

      const game = games.get(playerInfo.roomId);
      if (!game) {
        throw new Error("Game not found");
      }

      // Use the proper passTurn method
      const result = game.passTurn(playerInfo.playerId);

      // Notify all players
      io.to(playerInfo.roomId).emit("turnPassed", {
        playerId: playerInfo.playerId,
        playerName: playerInfo.playerName,
      });

      broadcastGameState(playerInfo.roomId);
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.roomId);
      if (game) {
        game.removePlayer(playerInfo.playerId);

        // Notify other players
        socket.to(playerInfo.roomId).emit("playerLeft", {
          playerId: playerInfo.playerId,
          playerName: playerInfo.playerName,
        });

        // If game is empty, remove it
        if (game.players.size === 0) {
          games.delete(playerInfo.roomId);
          console.log(`Room ${playerInfo.roomId} deleted - empty`);
        } else {
          broadcastGameState(playerInfo.roomId);
        }
      }

      playerSockets.delete(socket.id);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const localIP = getLocalIP();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🃏 CardMatch Game Server running on:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   WSL: http://${localIP}:${PORT}`);
  console.log(`   Windows Host: Configure port forwarding for network access`);
  console.log(
    `\n📱 For network access, use Windows PowerShell as Administrator:`
  );
  console.log(
    `   netsh interface portproxy add v4tov4 listenport=${PORT} listenaddress=0.0.0.0 connectport=${PORT} connectaddress=${localIP}`
  );
  console.log(
    `\n🔥 Windows Firewall: Allow port ${PORT} in Windows Defender Firewall`
  );
  console.log(
    `\n🌐 Then share this with other players: http://${localIP}:${PORT}`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Server shutting down...");
  server.close(() => {
    console.log("Server closed");
  });
});

process.on("SIGINT", () => {
  console.log("Server shutting down...");
  server.close(() => {
    console.log("Server closed");
  });
});
