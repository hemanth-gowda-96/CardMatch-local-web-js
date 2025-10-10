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
    this.winner = null;
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
      if (!(card.value === "draw2" || card.value === "wild_draw4")) {
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

      this.winner = player;
      this.gameState = GAME_STATES.FINISHED;
      this.calculateScores();
      return { gameEnded: true, winner: player };
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
        this.skipNext = true;
        break;

      case "reverse":
        this.direction *= -1;
        // In 2-player game, reverse acts like skip
        if (this.players.size === 2) {
          this.skipNext = true;
        }
        break;

      case "draw2":
        this.drawCount += 2;
        break;

      case "wild_draw4":
        this.drawCount += 4;
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
      })),
      playerOrder: this.playerOrder,
      currentPlayer: currentPlayer?.id || null,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerHasDrawn: currentPlayer?.hasDrawnCard || false,
      topCard: this.deck.getTopCard(),
      declaredColor: this.declaredColor,
      direction: this.direction,
      drawCount: this.drawCount,
      winner: this.winner?.id || null,
    };
  }

  getPlayerHand(playerId) {
    const player = this.players.get(playerId);
    return player ? player.hand : [];
  }
}

module.exports = { Player, UnoGame };
