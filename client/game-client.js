// UNO Game Client JavaScript
class UnoClient {
  constructor() {
    this.socket = null;
    this.gameState = null;
    this.playerId = null;
    this.playerName = null;
    this.roomId = null;
    this.isHost = false;
    this.pendingWildCard = null;

    this.initializeUI();
    this.connectToServer();
  }

  connectToServer() {
    this.socket = io();

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.showError("Disconnected from server");
    });

    this.socket.on("error", (data) => {
      this.showError(data.message);
    });

    // Room events
    this.socket.on("roomCreated", (data) => {
      this.handleRoomCreated(data);
    });

    this.socket.on("roomJoined", (data) => {
      this.handleRoomJoined(data);
    });

    this.socket.on("playerJoined", (data) => {
      this.showMessage(`${data.playerName} joined the room`, "info");
    });

    this.socket.on("playerLeft", (data) => {
      this.showMessage(`${data.playerName} left the room`, "warning");
    });

    // Game events
    this.socket.on("gameStarted", () => {
      this.showScreen("game-screen");
      this.showMessage("Game started!", "success");
    });

    this.socket.on("gameState", (state) => {
      this.updateGameState(state);
    });

    this.socket.on("cardPlayed", (data) => {
      let message = `${data.playerName} played a card`;
      if (data.declaredColor) {
        message += ` and declared ${data.declaredColor}`;
      }

      if (data.invalidWin) {
        message = `${data.playerName} tried to win with action card! ${data.message}`;
        this.showNotificationCard(data.message, "error");
      }

      this.showMessage(message, data.invalidWin ? "warning" : "info");

      if (data.gameEnded) {
        this.handleGameEnd(data.winner);
      }
    });

    this.socket.on("cardDrawn", (data) => {
      const cardText =
        data.cardCount > 1 ? `${data.cardCount} cards` : "a card";
      let message = `${data.playerName} drew ${cardText}`;

      if (
        data.forced &&
        data.hasPlayableCard &&
        data.playerId === this.playerId
      ) {
        message += " - You can play one of them!";
        this.showNotificationCard(
          "You drew playable cards! You can play or pass turn.",
          "success"
        );
      }

      this.showMessage(message, "info");
    });

    this.socket.on("turnPassed", (data) => {
      this.showMessage(`${data.playerName} passed their turn`, "info");
    });

    this.socket.on("unoSaid", (data) => {
      this.showMessage(`${data.playerName} said UNO!`, "warning");
    });

    this.socket.on("unoChallenged", (data) => {
      if (data.valid) {
        this.showMessage(
          `UNO challenge successful! Player drew ${data.penalty} cards`,
          "warning"
        );
      } else {
        this.showMessage("Invalid UNO challenge", "info");
      }
    });
  }

  initializeUI() {
    // Welcome screen buttons
    document.getElementById("create-room-btn").addEventListener("click", () => {
      this.createRoom();
    });

    document.getElementById("join-room-btn").addEventListener("click", () => {
      this.toggleJoinForm();
    });

    document
      .getElementById("join-room-submit")
      .addEventListener("click", () => {
        this.joinRoom();
      });

    // Lobby screen buttons
    document.getElementById("start-game-btn").addEventListener("click", () => {
      this.startGame();
    });

    document.getElementById("leave-room-btn").addEventListener("click", () => {
      this.leaveRoom();
    });

    // Game screen buttons
    document.getElementById("draw-card-btn").addEventListener("click", () => {
      this.drawCard();
    });

    document.getElementById("pass-turn-btn").addEventListener("click", () => {
      this.passTurn();
    });

    document.getElementById("uno-btn").addEventListener("click", () => {
      this.sayUno();
    });

    document.getElementById("leave-game-btn").addEventListener("click", () => {
      this.leaveRoom();
    });

    // Color selector
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectColor(e.target.dataset.color);
      });
    });

    // Cancel wild card selection
    document.getElementById("cancel-wild-btn").addEventListener("click", () => {
      this.cancelWildCard();
    });

    // Game over screen buttons
    document.getElementById("play-again-btn").addEventListener("click", () => {
      this.showScreen("lobby-screen");
    });

    document.getElementById("leave-final-btn").addEventListener("click", () => {
      this.leaveRoom();
    });

    // Error toast close
    document.getElementById("close-error").addEventListener("click", () => {
      this.hideError();
    });

    // Enter key handlers
    document.getElementById("player-name").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.createRoom();
      }
    });

    document.getElementById("room-code").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.joinRoom();
      }
    });
  }

  // Screen Management
  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });
    document.getElementById(screenId).classList.add("active");
  }

  // Room Management
  createRoom() {
    const playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
      this.showError("Please enter your name");
      return;
    }

    this.playerName = playerName;
    this.socket.emit("createRoom", playerName);
  }

  toggleJoinForm() {
    const form = document.getElementById("join-room-form");
    form.classList.toggle("hidden");
    if (!form.classList.contains("hidden")) {
      document.getElementById("room-code").focus();
    }
  }

  joinRoom() {
    const playerName = document.getElementById("player-name").value.trim();
    const roomCode = document
      .getElementById("room-code")
      .value.trim()
      .toUpperCase();

    if (!playerName) {
      this.showError("Please enter your name");
      return;
    }

    if (!roomCode) {
      this.showError("Please enter a room code");
      return;
    }

    this.playerName = playerName;
    this.socket.emit("joinRoom", { roomId: roomCode, playerName });
  }

  leaveRoom() {
    location.reload(); // Simple way to reset everything
  }

  handleRoomCreated(data) {
    this.playerId = data.playerId;
    this.roomId = data.roomId;
    this.isHost = data.isHost;

    document.getElementById("room-id").textContent = data.roomId;
    this.showScreen("lobby-screen");

    if (!this.isHost) {
      document.getElementById("start-game-btn").style.display = "none";
      document.getElementById("waiting-message").classList.remove("hidden");
    }
  }

  handleRoomJoined(data) {
    this.playerId = data.playerId;
    this.roomId = data.roomId;
    this.isHost = data.isHost;

    document.getElementById("room-id").textContent = data.roomId;
    this.showScreen("lobby-screen");

    if (!this.isHost) {
      document.getElementById("start-game-btn").style.display = "none";
      document.getElementById("waiting-message").classList.remove("hidden");
    }
  }

  startGame() {
    this.socket.emit("startGame");
  }

  // Game Actions
  drawCard() {
    this.socket.emit("drawCard");
  }

  passTurn() {
    this.socket.emit("passTurn");
    document.getElementById("pass-turn-btn").classList.add("hidden");
  }

  sayUno() {
    this.socket.emit("sayUno");
    document.getElementById("uno-btn").classList.add("hidden");
  }

  playCard(cardIndex) {
    if (!this.gameState || !this.gameState.isYourTurn) {
      this.showError("It's not your turn!");
      return;
    }

    const card = this.gameState.yourHand[cardIndex];

    // Check if it's a wild card
    if (card.type === "wild") {
      this.pendingWildCard = cardIndex;
      this.showColorSelector();
    } else {
      this.socket.emit("playCard", { cardIndex });
    }
  }

  showColorSelector() {
    document.getElementById("color-selector").classList.remove("hidden");
  }

  selectColor(color) {
    document.getElementById("color-selector").classList.add("hidden");

    if (this.pendingWildCard !== null) {
      this.socket.emit("playCard", {
        cardIndex: this.pendingWildCard,
        declaredColor: color,
      });
      this.pendingWildCard = null;
    }
  }

  cancelWildCard() {
    document.getElementById("color-selector").classList.add("hidden");
    this.pendingWildCard = null;
    this.showNotificationCard("Wild card play cancelled", "info");
  }

  // Game State Updates
  updateGameState(state) {
    this.gameState = state;

    // Update player list in lobby
    if (document.getElementById("lobby-screen").classList.contains("active")) {
      this.updatePlayersList(state.players);
    }

    // Update game screen
    if (document.getElementById("game-screen").classList.contains("active")) {
      this.updateGameScreen(state);
    }
  }

  updatePlayersList(players) {
    const playersList = document.getElementById("players-ul");
    const playerCount = document.getElementById("player-count");

    playersList.innerHTML = "";
    playerCount.textContent = players.length;

    players.forEach((player) => {
      const li = document.createElement("li");
      li.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                    ${player.id === this.playerId ? "<small>(You)</small>" : ""}
                </div>
            `;
      playersList.appendChild(li);
    });
  }

  updateGameScreen(state) {
    // Update current player
    const currentPlayerName =
      state.players.find((p) => p.id === state.currentPlayer)?.name ||
      "Unknown";
    document.getElementById("current-player").textContent = currentPlayerName;

    // Update direction indicator (now handled in player circle)
    const directionIndicator = document.getElementById("direction-indicator");
    directionIndicator.textContent = state.direction === 1 ? "↻" : "↺"; // Update top card
    this.updateTopCard(state.topCard, state.declaredColor);

    // Update your hand
    this.updateHand(state.yourHand);

    // Update player circle
    this.updatePlayerCircle(state);

    // Update UNO button visibility
    if (state.yourHand.length === 2) {
      document.getElementById("uno-btn").classList.remove("hidden");
    } else {
      document.getElementById("uno-btn").classList.add("hidden");
    }

    // Update turn-based UI
    if (state.isYourTurn) {
      document.getElementById("draw-card-btn").disabled = false;

      // Show pass turn button if player has drawn a card and it's their turn
      if (state.currentPlayerHasDrawn && state.drawCount === 0) {
        document.getElementById("pass-turn-btn").classList.remove("hidden");
      } else {
        document.getElementById("pass-turn-btn").classList.add("hidden");
      }
    } else {
      document.getElementById("draw-card-btn").disabled = true;
      document.getElementById("pass-turn-btn").classList.add("hidden");
    }
  }

  updateTopCard(card, declaredColor) {
    const topCardElement = document.getElementById("top-card");

    if (card) {
      topCardElement.className = `card ${card.color || ""}`;
      topCardElement.textContent = this.getCardDisplayText(card);

      // Show declared color for wild cards
      const declaredColorElement = document.getElementById("declared-color");
      const declaredColorValue = document.getElementById(
        "declared-color-value"
      );

      if (card.type === "wild" && declaredColor) {
        declaredColorElement.classList.remove("hidden");
        declaredColorValue.textContent = declaredColor;
        declaredColorValue.className = `color-indicator ${declaredColor}`;
      } else {
        declaredColorElement.classList.add("hidden");
      }
    }
  }

  updateHand(hand) {
    const handElement = document.getElementById("hand-cards");
    handElement.innerHTML = "";

    hand.forEach((card, index) => {
      const cardElement = document.createElement("div");
      cardElement.className = `card ${card.color || ""}`;
      cardElement.textContent = this.getCardDisplayText(card);
      cardElement.addEventListener("click", () => this.playCard(index));

      // Highlight playable cards
      if (this.gameState.isYourTurn && this.canPlayCard(card)) {
        cardElement.classList.add("playable");
      }

      handElement.appendChild(cardElement);
    });
  }

  updatePlayerCircle(state) {
    const playersContainer = document.getElementById("players-positions");
    const turnDirection = document.getElementById("turn-direction");

    // Update direction indicator
    turnDirection.textContent = state.direction === 1 ? "↻" : "↺";
    turnDirection.className = state.direction === 1 ? "" : "counterclockwise";

    playersContainer.innerHTML = "";

    if (!state.playerOrder || state.playerOrder.length === 0) return;

    const totalPlayers = state.playerOrder.length;
    const radius = 120; // Distance from center
    const centerX = 150; // Half of container width
    const centerY = 150; // Half of container height

    // Find current player's position in the order
    const myIndex = state.playerOrder.findIndex((id) => id === this.playerId);

    // Arrange players in circle, starting with current player at top
    state.playerOrder.forEach((playerId, orderIndex) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return;

      // Calculate angle for this position (start from top, go clockwise)
      const angle =
        orderIndex * (360 / totalPlayers) * (Math.PI / 180) - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const playerElement = document.createElement("div");
      playerElement.className = "player-position";
      playerElement.style.left = `${x}px`;
      playerElement.style.top = `${y}px`;

      // Add special classes
      if (player.id === this.playerId) {
        playerElement.classList.add("you");
      }

      if (player.id === state.currentPlayer) {
        playerElement.classList.add("current-player");
      }

      // Mark next player
      const nextPlayerIndex =
        state.direction === 1
          ? (state.currentPlayerIndex + 1) % totalPlayers
          : (state.currentPlayerIndex - 1 + totalPlayers) % totalPlayers;

      if (orderIndex === nextPlayerIndex && state.currentPlayer !== player.id) {
        playerElement.classList.add("next-player");
      }

      // Truncate long names
      const displayName =
        player.name.length > 8
          ? player.name.substring(0, 8) + "..."
          : player.name;

      playerElement.innerHTML = `
        <div class="player-name-circle">${displayName}</div>
        <div class="player-cards-circle">${player.handSize} cards</div>
      `;

      playersContainer.appendChild(playerElement);

      // Add turn arrow pointing to current player
      if (player.id === state.currentPlayer) {
        this.addTurnArrow(x, y, centerX, centerY);
      }
    });
  }

  addTurnArrow(playerX, playerY, centerX, centerY) {
    const playersContainer = document.getElementById("players-positions");

    // Calculate position for arrow (closer to center)
    const arrowDistance = 40; // Distance from player toward center
    const angle = Math.atan2(playerY - centerY, playerX - centerX);
    const arrowX = playerX - arrowDistance * Math.cos(angle);
    const arrowY = playerY - arrowDistance * Math.sin(angle);

    const arrow = document.createElement("div");
    arrow.className = "turn-arrow";
    arrow.style.left = `${arrowX}px`;
    arrow.style.top = `${arrowY}px`;
    arrow.style.transform = "translate(-50%, -50%)";
    arrow.textContent = "👈";

    playersContainer.appendChild(arrow);
  }

  canPlayCard(card) {
    if (!this.gameState.topCard) return false;

    const topCard = this.gameState.topCard;
    const declaredColor = this.gameState.declaredColor;

    // Wild cards can always be played
    if (card.type === "wild") {
      return true;
    }

    // If top card is wild, check against declared color
    if (topCard.type === "wild" && declaredColor) {
      return card.color === declaredColor;
    }

    // Same color or same value
    return card.color === topCard.color || card.value === topCard.value;
  }

  getCardDisplayText(card) {
    switch (card.value) {
      case "skip":
        return "Skip";
      case "reverse":
        return "⟲";
      case "draw2":
        return "+2";
      case "wild":
        return "Wild";
      case "wild_draw4":
        return "Wild +4";
      default:
        return card.value.toString();
    }
  }

  handleGameEnd(winner) {
    document.getElementById(
      "winner-announcement"
    ).textContent = `🎉 ${winner.name} wins the game! 🎉`;

    // Show final scores
    const scoresElement = document.getElementById("final-scores");
    scoresElement.innerHTML = "<h4>Final Scores:</h4>";

    this.gameState.players
      .sort((a, b) => b.score - a.score)
      .forEach((player) => {
        const scoreItem = document.createElement("div");
        scoreItem.className = "score-item";
        scoreItem.innerHTML = `
                    <span>${player.name}</span>
                    <span>${player.score} points</span>
                `;
        scoresElement.appendChild(scoreItem);
      });

    setTimeout(() => {
      this.showScreen("game-over-screen");
    }, 3000);
  }

  // Message System
  showMessage(text, type = "info") {
    // Only use notification cards now
    this.showNotificationCard(text, type);
  }

  showNotificationCard(text, type = "info") {
    const notificationCards = document.getElementById("notification-cards");
    const card = document.createElement("div");
    card.className = `notification-card ${type}`;
    card.textContent = text;

    // Add to beginning of notifications
    notificationCards.insertBefore(card, notificationCards.firstChild);

    // Remove old notifications if too many
    while (notificationCards.children.length > 5) {
      notificationCards.removeChild(notificationCards.lastChild);
    }

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
    }, 8000);
  }

  showError(message) {
    const errorToast = document.getElementById("error-toast");
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = message;
    errorToast.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  hideError() {
    document.getElementById("error-toast").classList.add("hidden");
  }

  showSuccess(message) {
    const successToast = document.getElementById("success-toast");
    const successMessage = document.getElementById("success-message");

    successMessage.textContent = message;
    successToast.classList.remove("hidden");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      successToast.classList.add("hidden");
    }, 3000);
  }
}

// Add CSS for playable cards
const style = document.createElement("style");
style.textContent = `
    .card.playable {
        border-color: #28a745;
        box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 10px rgba(40, 167, 69, 0.5); }
        50% { box-shadow: 0 0 20px rgba(40, 167, 69, 0.8); }
        100% { box-shadow: 0 0 10px rgba(40, 167, 69, 0.5); }
    }
    
    .color-indicator {
        padding: 4px 8px;
        border-radius: 4px;
        color: white;
    }
    
    .color-indicator.red { background-color: #dc3545; }
    .color-indicator.blue { background-color: #007bff; }
    .color-indicator.green { background-color: #28a745; }
    .color-indicator.yellow { background-color: #ffc107; color: #333; }
`;
document.head.appendChild(style);

// Initialize the game client when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new UnoClient();
});
