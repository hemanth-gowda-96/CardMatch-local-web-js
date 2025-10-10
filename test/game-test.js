const path = require("path");

// Import shared modules from the parent directory for testing
const { UnoGame } = require("../shared/game");
const { Deck, Card } = require("../shared/deck");
const { COLORS, SPECIAL_CARDS, WILD_CARDS } = require("../shared/constants");

// Simple test runner
function runTests() {
  console.log("🎮 Running UNO Game Tests...\n");

  let passed = 0;
  let failed = 0;

  function test(description, testFn) {
    try {
      testFn();
      console.log(`✅ ${description}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${description}: ${error.message}`);
      failed++;
    }
  }

  // Test Deck creation
  test("Deck should create 108 cards", () => {
    const deck = new Deck();
    if (deck.cards.length !== 108) {
      throw new Error(`Expected 108 cards, got ${deck.cards.length}`);
    }
  });

  // Test Card creation and properties
  test("Red number card should be playable on red card", () => {
    const redCard = new Card("red", 5, "number");
    const topCard = new Card("red", 3, "number");
    if (!redCard.canPlayOn(topCard)) {
      throw new Error("Red card should be playable on red card");
    }
  });

  test("Wild card should be playable on any card", () => {
    const wildCard = new Card(null, "wild", "wild");
    const topCard = new Card("blue", 7, "number");
    if (!wildCard.canPlayOn(topCard)) {
      throw new Error("Wild card should be playable on any card");
    }
  });

  // Test Game creation
  test("Game should be created with correct initial state", () => {
    const game = new UnoGame("TEST123");
    if (game.roomId !== "TEST123") {
      throw new Error("Room ID not set correctly");
    }
    if (game.players.size !== 0) {
      throw new Error("Game should start with no players");
    }
  });

  // Test Player addition
  test("Should be able to add players to game", () => {
    const game = new UnoGame("TEST123");
    game.addPlayer("player1", "Alice", "socket1");
    game.addPlayer("player2", "Bob", "socket2");

    if (game.players.size !== 2) {
      throw new Error("Should have 2 players");
    }
  });

  // Test Game start
  test("Game should start with 2+ players", () => {
    const game = new UnoGame("TEST123");
    game.addPlayer("player1", "Alice", "socket1");
    game.addPlayer("player2", "Bob", "socket2");

    game.startGame();

    if (game.gameState !== "playing") {
      throw new Error("Game state should be playing");
    }

    // Each player should have 7 cards
    const alice = game.players.get("player1");
    const bob = game.players.get("player2");

    if (alice.hand.length !== 7 || bob.hand.length !== 7) {
      throw new Error("Each player should have 7 cards");
    }
  });

  // Test card playing
  test("Should be able to play valid cards", () => {
    const game = new UnoGame("TEST123");
    game.addPlayer("player1", "Alice", "socket1");
    game.addPlayer("player2", "Bob", "socket2");
    game.startGame();

    const currentPlayer = game.getCurrentPlayer();
    const topCard = game.deck.getTopCard();

    // Find a playable card
    let playableCardIndex = -1;
    for (let i = 0; i < currentPlayer.hand.length; i++) {
      if (currentPlayer.canPlayCard(i, topCard, game.declaredColor)) {
        playableCardIndex = i;
        break;
      }
    }

    if (playableCardIndex === -1) {
      // If no playable card, this is still a valid test case
      console.log("  No playable card found (this is normal)");
      return;
    }

    const initialHandSize = currentPlayer.hand.length;
    const cardToPlay = currentPlayer.hand[playableCardIndex];

    // If it's a wild card, we need to declare a color
    if (cardToPlay.type === "wild") {
      game.playCard(currentPlayer.id, playableCardIndex, "red");
    } else {
      game.playCard(currentPlayer.id, playableCardIndex);
    }

    if (currentPlayer.hand.length !== initialHandSize - 1) {
      throw new Error("Hand size should decrease after playing card");
    }
  });

  // Test card drawing
  test("Should be able to draw cards", () => {
    const game = new UnoGame("TEST123");
    game.addPlayer("player1", "Alice", "socket1");
    game.addPlayer("player2", "Bob", "socket2");
    game.startGame();

    const currentPlayer = game.getCurrentPlayer();
    const initialHandSize = currentPlayer.hand.length;

    game.drawCard(currentPlayer.id);

    if (currentPlayer.hand.length <= initialHandSize) {
      throw new Error("Hand size should increase after drawing card");
    }
  });

  console.log(`\n🎯 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("🎉 All tests passed! The UNO game is ready to play!");
  } else {
    console.log("❌ Some tests failed. Please check the implementation.");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
