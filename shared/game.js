const { GAME_STATES, DIRECTIONS } = require("./constants");
const { Deck } = require("./deck");

class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.hand = [];
    this.isReady = false;
    this.hasDrawnCard = false;
    this.saidUno = false;
  }

  addCards(cards) {
    if (Array.isArray(cards)) {
      this.hand.push(...cards);
    } else {
      this.hand.push(cards);
    }
  }

  removeCard(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.hand.length) {
      return this.hand.splice(cardIndex, 1)[0];
    }
    return null;
  }

  hasCard(cardId) {
    return this.hand.some((card) => card.id === cardId);
  }

  getHandSize() {
    return this.hand.length;
  }

  canPlayCard(cardIndex, topCard, declaredColor = null) {
    if (cardIndex < 0 || cardIndex >= this.hand.length) {
      return false;
    }
    return this.hand[cardIndex].canPlayOn(topCard, declaredColor);
  }

  hasPlayableCard(topCard, declaredColor = null) {
    return this.hand.some((card) => card.canPlayOn(topCard, declaredColor));
  }

  getScore() {
    return this.hand.reduce((total, card) => total + card.getPoints(), 0);
  }

  reset() {
    this.hand = [];
    this.isReady = false;
    this.hasDrawnCard = false;
    this.saidUno = false;
  }
}

class UnoGame {
  constructor(roomId, maxPlayers = 10) {
    this.roomId = roomId;
    this.maxPlayers = maxPlayers;
    this.players = new Map();
    this.playerOrder = [];
    this.currentPlayerIndex = 0;
    this.direction = DIRECTIONS.CLOCKWISE;
    this.deck = new Deck();
    this.gameState = GAME_STATES.WAITING;
    this.declaredColor = null;
    this.skipNext = false;
    this.drawCount = 0; // For stacking draw cards
    this.lastPlayedWasDraw4 = false; // Track if last card was wild_draw4
    this.winner = null;
    this.finishingOrder = []; // Track order of players finishing the game
    this.activePlayers = new Set(); // Track players still in the game
    this.scores = new Map(); // Track cumulative scores across rounds
  }

  addPlayer(playerId, playerName, socketId) {
    if (this.players.size >= this.maxPlayers) {
      throw new Error("Game is full");
    }

    if (this.gameState !== GAME_STATES.WAITING) {
      throw new Error("Game already in progress");
    }

    const player = new Player(playerId, playerName, socketId);
    this.players.set(playerId, player);
    this.playerOrder.push(playerId);

    if (!this.scores.has(playerId)) {
      this.scores.set(playerId, 0);
    }

    return player;
  }

  removePlayer(playerId) {
    if (!this.players.has(playerId)) {
      return false;
    }

    this.players.delete(playerId);
    const index = this.playerOrder.indexOf(playerId);
    if (index > -1) {
      this.playerOrder.splice(index, 1);

      // Adjust current player index if needed
      if (this.currentPlayerIndex >= index && this.currentPlayerIndex > 0) {
        this.currentPlayerIndex--;
      }
      if (this.currentPlayerIndex >= this.playerOrder.length) {
        this.currentPlayerIndex = 0;
      }
    }

    // End game if not enough players
    if (this.players.size < 2 && this.gameState === GAME_STATES.PLAYING) {
      this.gameState = GAME_STATES.FINISHED;
    }

    return true;
  }

  startGame() {
    if (this.players.size < 2) {
      throw new Error("Need at least 2 players to start");
    }

    if (this.gameState !== GAME_STATES.WAITING) {
      throw new Error("Game already started");
    }

    this.gameState = GAME_STATES.STARTING;

    // Reset game state
    this.finishingOrder = [];
    this.activePlayers = new Set(this.playerOrder);
    this.lastPlayedWasDraw4 = false;

    // Reset all players
    this.players.forEach((player) => player.reset());

    // Initialize new deck
    this.deck = new Deck();

    // Deal 7 cards to each player
    this.players.forEach((player) => {
      const cards = this.deck.drawCards(7);
      player.addCards(cards);
    });

    // Draw first card for discard pile
    let firstCard;
    do {
      firstCard = this.deck.drawCard();
    } while (firstCard.value === "wild_draw4"); // Can't start with Wild Draw 4

    this.deck.addToDiscard(firstCard);

    // Handle special first card
    if (firstCard.value === "wild") {
      // If wild, randomly choose a color
      const colors = ["red", "blue", "green", "yellow"];
      this.declaredColor = colors[Math.floor(Math.random() * colors.length)];
    }

    // Reset game state
    this.currentPlayerIndex = 0;
    this.direction = DIRECTIONS.CLOCKWISE;
    this.skipNext = false;
    this.drawCount = 0;
    this.lastPlayedWasDraw4 = false;
    this.winner = null;

    this.gameState = GAME_STATES.PLAYING;

    // Handle special first card effects
    this.handleSpecialCard(firstCard, null);
  }

  getCurrentPlayer() {
    if (this.playerOrder.length === 0) return null;
    const playerId = this.playerOrder[this.currentPlayerIndex];
    return this.players.get(playerId);
  }

  getNextPlayerIndex() {
    let nextIndex = this.currentPlayerIndex + this.direction;
    if (nextIndex >= this.playerOrder.length) {
      nextIndex = 0;
    } else if (nextIndex < 0) {
      nextIndex = this.playerOrder.length - 1;
    }
    return nextIndex;
  }

  moveToNextPlayer() {
    this.currentPlayerIndex = this.getNextPlayerIndex();

    // Handle skip
    if (this.skipNext) {
      this.skipNext = false;
      this.currentPlayerIndex = this.getNextPlayerIndex();
    }
  }

  playCard(playerId, cardIndex, declaredColor = null) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (this.gameState !== GAME_STATES.PLAYING) {
      throw new Error("Game not in progress");
    }

    if (this.getCurrentPlayer().id !== playerId) {
      throw new Error("Not your turn");
    }

    if (
      !player.canPlayCard(cardIndex, this.deck.getTopCard(), this.declaredColor)
    ) {
      throw new Error("Invalid card play");
    }

    // Handle draw stacking - if there are pending draws, player must draw or play a draw card
    if (this.drawCount > 0) {
      const card = player.hand[cardIndex];
      let canPlayCard = false;

      // Can play draw cards to stack
      if (card.value === "draw2" || card.value === "wild_draw4") {
        canPlayCard = true;
      }

      // Special rule: If there's a pending +4 and a color was declared,
      // can play Skip or Reverse of that color to counter the +4
      if (
        this.lastPlayedWasDraw4 &&
        this.declaredColor &&
        (card.value === "skip" || card.value === "reverse") &&
        card.color === this.declaredColor
      ) {
        canPlayCard = true;
      }

      if (!canPlayCard) {
        throw new Error("Must draw cards or play a draw card");
      }
    }

    const playedCard = player.removeCard(cardIndex);
    this.deck.addToDiscard(playedCard);

    // Handle wild cards
    if (playedCard.type === "wild") {
      if (
        !declaredColor ||
        !["red", "blue", "green", "yellow"].includes(declaredColor)
      ) {
        throw new Error("Must declare a color for wild card");
      }
      this.declaredColor = declaredColor;
    } else {
      this.declaredColor = null;
    }

    // Reset draw flag
    player.hasDrawnCard = false;

    // Check for UNO (1 card left)
    if (player.getHandSize() === 1) {
      if (!player.saidUno) {
        // Penalty for not saying UNO - draw 2 cards
        const penaltyCards = this.deck.drawCards(2);
        player.addCards(penaltyCards);
      }
    }

    // Check for win - cannot win with action cards
    if (player.getHandSize() === 0) {
      const canWinWithCard = this.canWinWithCard(playedCard);
      if (!canWinWithCard) {
        // Invalid win attempt - draw penalty cards
        const penaltyCards = this.deck.drawCards(2);
        player.addCards(penaltyCards);
        player.hand.push(playedCard); // Put the card back
        this.deck.discardPile.pop(); // Remove from discard pile
        return {
          gameEnded: false,
          invalidWin: true,
          message: "Cannot win with action cards! Draw 2 penalty cards.",
        };
      }

      // Player finished - add to finishing order and remove from active players
      this.finishingOrder.push({
        playerId: player.id,
        playerName: player.name,
        position: this.finishingOrder.length + 1,
      });
      this.activePlayers.delete(player.id);

      // Remove finished player from playerOrder
      const playerIndex = this.playerOrder.indexOf(player.id);
      this.playerOrder.splice(playerIndex, 1);

      // Adjust current player index if needed
      if (
        this.currentPlayerIndex >= playerIndex &&
        this.currentPlayerIndex > 0
      ) {
        this.currentPlayerIndex--;
      }
      if (this.currentPlayerIndex >= this.playerOrder.length) {
        this.currentPlayerIndex = 0;
      }

      // Check if game is over (only one player left)
      if (this.activePlayers.size <= 1) {
        // Add the last player as the loser
        if (this.activePlayers.size === 1) {
          const lastPlayerId = Array.from(this.activePlayers)[0];
          const lastPlayer = this.players.get(lastPlayerId);
          this.finishingOrder.push({
            playerId: lastPlayer.id,
            playerName: lastPlayer.name,
            position: this.finishingOrder.length + 1,
            isLoser: true,
          });
        }

        this.winner = this.players.get(this.finishingOrder[0].playerId);
        this.gameState = GAME_STATES.FINISHED;
        this.calculateScores();
        return {
          gameEnded: true,
          winner: this.winner,
          finishingOrder: this.finishingOrder,
          playerFinished: player,
        };
      }

      return {
        gameEnded: false,
        playerFinished: player,
        finishingOrder: this.finishingOrder,
        remainingPlayers: this.activePlayers.size,
      };
    }

    // Handle special card effects
    const result = this.handleSpecialCard(playedCard, player);

    // Move to next player (unless direction changed or player was skipped)
    if (!result.skipTurn) {
      this.moveToNextPlayer();
    }

    return { gameEnded: false, ...result };
  }

  handleSpecialCard(card, player) {
    let result = { skipTurn: false };

    switch (card.value) {
      case "skip":
        // Special rule: If this skip counters a +4, handle differently
        if (
          this.lastPlayedWasDraw4 &&
          this.drawCount > 0 &&
          card.color === this.declaredColor
        ) {
          // Skip counters the +4 - next player doesn't draw
          this.drawCount = 0;
          this.lastPlayedWasDraw4 = false;
          this.skipNext = true; // Skip the next player
        } else {
          this.skipNext = true;
        }
        break;

      case "reverse":
        // Special rule: If this reverse counters a +4, handle differently
        if (
          this.lastPlayedWasDraw4 &&
          this.drawCount > 0 &&
          card.color === this.declaredColor
        ) {
          // Reverse counters the +4 - direction changes and original player draws
          this.direction *= -1;
          this.lastPlayedWasDraw4 = false;
          // Don't clear drawCount - let the original player draw the cards
        } else {
          this.direction *= -1;
          // In 2-player game, reverse acts like skip
          if (this.players.size === 2) {
            this.skipNext = true;
          }
        }
        break;

      case "draw2":
        this.drawCount += 2;
        break;

      case "wild_draw4":
        this.drawCount += 4;
        this.lastPlayedWasDraw4 = true;
        break;

      default:
        // Reset flag for non-draw4 cards (unless it was handled above)
        if (card.value !== "skip" && card.value !== "reverse") {
          this.lastPlayedWasDraw4 = false;
        }
        break;
    }

    return result;
  }

  drawCard(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (this.gameState !== GAME_STATES.PLAYING) {
      throw new Error("Game not in progress");
    }

    if (this.getCurrentPlayer().id !== playerId) {
      throw new Error("Not your turn");
    }

    if (player.hasDrawnCard && this.drawCount === 0) {
      throw new Error("Already drew a card this turn");
    }

    // Handle forced draws (from draw cards)
    if (this.drawCount > 0) {
      const cards = this.deck.drawCards(this.drawCount);
      player.addCards(cards);
      this.drawCount = 0;
      this.lastPlayedWasDraw4 = false; // Reset flag after drawing

      // Check if any of the drawn cards are playable
      let hasPlayableCard = false;
      for (const card of cards) {
        if (card.canPlayOn(this.deck.getTopCard(), this.declaredColor)) {
          hasPlayableCard = true;
          break;
        }
      }

      // Don't automatically move to next player, let them choose to play or pass
      player.hasDrawnCard = true; // Allow them to pass turn if they want
      return { forced: true, cards: cards.length, hasPlayableCard };
    }

    // Regular draw
    const card = this.deck.drawCard();
    if (card) {
      player.addCards(card);
      player.hasDrawnCard = true;

      // Check if drawn card is playable
      const canPlay = card.canPlayOn(
        this.deck.getTopCard(),
        this.declaredColor
      );
      return { forced: false, canPlay };
    }

    return { forced: false, canPlay: false };
  }

  canWinWithCard(card) {
    // Cannot win with wild cards, +2, +4, skip, or reverse
    const actionCards = ["skip", "reverse", "draw2", "wild", "wild_draw4"];
    return !actionCards.includes(card.value);
  }

  passTurn(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (this.gameState !== GAME_STATES.PLAYING) {
      throw new Error("Game not in progress");
    }

    if (this.getCurrentPlayer().id !== playerId) {
      throw new Error("Not your turn");
    }

    // Player can only pass turn if they have drawn a card (non-forced)
    if (!player.hasDrawnCard) {
      throw new Error("Must draw a card before passing turn");
    }

    // Reset draw flag and move to next player
    player.hasDrawnCard = false;
    this.moveToNextPlayer();

    return { success: true };
  }

  sayUno(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (player.getHandSize() === 2) {
      player.saidUno = true;
      return true;
    }

    return false;
  }

  challengeUno(challengerId, challengedId) {
    const challenger = this.players.get(challengerId);
    const challenged = this.players.get(challengedId);

    if (!challenger || !challenged) {
      throw new Error("Player not found");
    }

    if (challenged.getHandSize() === 1 && !challenged.saidUno) {
      // Valid challenge - challenged player draws 2 cards
      const penaltyCards = this.deck.drawCards(2);
      challenged.addCards(penaltyCards);
      return { valid: true, penalty: 2 };
    }

    return { valid: false, penalty: 0 };
  }

  calculateScores() {
    if (!this.winner) return;

    // Winner gets 0 points, others get points based on their remaining cards
    this.players.forEach((player, playerId) => {
      if (player.id === this.winner.id) {
        // Winner gets points from other players' cards
        let roundScore = 0;
        this.players.forEach((otherPlayer) => {
          if (otherPlayer.id !== player.id) {
            roundScore += otherPlayer.getScore();
          }
        });
        this.scores.set(playerId, this.scores.get(playerId) + roundScore);
      }
    });
  }

  getGameState() {
    const currentPlayer = this.getCurrentPlayer();
    return {
      roomId: this.roomId,
      gameState: this.gameState,
      players: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        handSize: p.getHandSize(),
        isReady: p.isReady,
        score: this.scores.get(p.id) || 0,
        isFinished:
          !this.activePlayers.has(p.id) &&
          this.gameState === GAME_STATES.PLAYING,
      })),
      playerOrder: this.playerOrder,
      currentPlayer: currentPlayer?.id || null,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerHasDrawn: currentPlayer?.hasDrawnCard || false,
      topCard: this.deck.getTopCard(),
      declaredColor: this.declaredColor,
      direction: this.direction,
      drawCount: this.drawCount,
      lastPlayedWasDraw4: this.lastPlayedWasDraw4,
      winner: this.winner?.id || null,
      finishingOrder: this.finishingOrder,
      activePlayers: Array.from(this.activePlayers),
    };
  }

  getPlayerHand(playerId) {
    const player = this.players.get(playerId);
    return player ? player.hand : [];
  }
}

module.exports = { Player, UnoGame };
