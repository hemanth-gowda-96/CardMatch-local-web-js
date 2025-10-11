// Import shared modules from the parent directory for testing
const { CardMatchGame } = require("../shared/game");
const { Deck, Card } = require("../shared/deck");
const { COLORS, SPECIAL_CARDS, WILD_CARDS, CARD_TYPES, GAME_STATES } = require("../shared/constants");

// Test the 2-player scenario with manual setup
function testClean2PlayerSkip() {
    console.log("🎮 Testing Clean 2-Player Skip Scenario...\n");

    const game = new CardMatchGame("TEST123");
    game.addPlayer("player1", "Alice", "socket1");
    game.addPlayer("player2", "Bob", "socket2");

    // Manually set up game state instead of using startGame()
    game.gameState = GAME_STATES.PLAYING;
    game.currentPlayerIndex = 0;
    game.drawCount = 0;
    game.lastPlayedWasDraw4 = false;
    game.declaredColor = null;

    const player1 = game.players.get("player1");
    const player2 = game.players.get("player2");

    // Give players cards manually
    const wildDraw4 = new Card(null, "wild_draw4", CARD_TYPES.WILD);
    const extraCard1 = new Card("blue", "3", CARD_TYPES.NUMBER);
    player1.hand = [wildDraw4, extraCard1];

    const redSkip = new Card("red", "skip", CARD_TYPES.SPECIAL);
    const extraCard2 = new Card("green", "7", CARD_TYPES.NUMBER);
    player2.hand = [redSkip, extraCard2];

    // Set up a simple discard pile
    const initialCard = new Card("blue", "5", CARD_TYPES.NUMBER);
    game.deck.discardPile = [initialCard];

    console.log("=== Initial State ===");
    console.log("Current player:", game.currentPlayerIndex);
    console.log("DrawCount:", game.drawCount);
    console.log("LastPlayedWasDraw4:", game.lastPlayedWasDraw4);
    console.log("DeclaredColor:", game.declaredColor);

    // Step 1: Player1 plays wild_draw4
    console.log("\n=== Step 1: Player1 plays wild_draw4, declares red ===");
    player1.saidCardMatch = true; // Prevent penalty
    const result1 = game.playCard("player1", 0, "red");

    console.log("After Player1 plays +4:");
    console.log("- Current player:", game.currentPlayerIndex);
    console.log("- DrawCount:", game.drawCount);
    console.log("- LastPlayedWasDraw4:", game.lastPlayedWasDraw4);
    console.log("- DeclaredColor:", game.declaredColor);

    // Validate step 1
    if (game.drawCount !== 4) {
        throw new Error(`Expected drawCount to be 4, got ${game.drawCount}`);
    }
    if (!game.lastPlayedWasDraw4) {
        throw new Error("Expected lastPlayedWasDraw4 to be true");
    }
    if (game.declaredColor !== "red") {
        throw new Error(`Expected declaredColor to be red, got ${game.declaredColor}`);
    }
    if (game.currentPlayerIndex !== 1) {
        throw new Error(`Expected current player to be 1 (Player2), got ${game.currentPlayerIndex}`);
    }

    // Step 2: Player2 plays red skip
    console.log("\n=== Step 2: Player2 plays red skip ===");
    player2.saidCardMatch = true; // Prevent penalty
    const result2 = game.playCard("player2", 0);

    console.log("After Player2 plays skip:");
    console.log("- Current player:", game.currentPlayerIndex);
    console.log("- DrawCount:", game.drawCount);
    console.log("- LastPlayedWasDraw4:", game.lastPlayedWasDraw4);
    console.log("- DeclaredColor:", game.declaredColor);

    // Validate step 2
    if (game.drawCount !== 4) {
        throw new Error(`Expected drawCount to remain 4, got ${game.drawCount}`);
    }
    if (game.lastPlayedWasDraw4) {
        throw new Error("Expected lastPlayedWasDraw4 to be false after skip counter");
    }
    if (game.currentPlayerIndex !== 0) {
        throw new Error(`Expected current player to be 0 (Player1) after skip, got ${game.currentPlayerIndex}`);
    }

    console.log("\n✅ Test passed: Skip correctly passes +4 back to Player1!");
    return true;
}

// Run test
if (require.main === module) {
    try {
        testClean2PlayerSkip();
        console.log("🎉 Clean 2-player test passed!");
    } catch (error) {
        console.log("❌ Clean 2-player test failed:", error.message);
    }
}