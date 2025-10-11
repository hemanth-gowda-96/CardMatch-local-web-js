// Import shared modules from the parent directory for testing
const { CardMatchGame } = require("../shared/game");
const { Deck, Card } = require("../shared/deck");
const { COLORS, SPECIAL_CARDS, WILD_CARDS } = require("../shared/constants");

// Test the enhanced +4 counter rules
function testEnhanced4CounterRules() {
    console.log("🎮 Testing Enhanced +4 Counter Rules...\n");

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

    // Test Skip passes +4 to next player
    test("Skip should pass +4 to next player", () => {
        const game = new CardMatchGame("TEST123");
        game.addPlayer("player1", "Alice", "socket1");
        game.addPlayer("player2", "Bob", "socket2");
        game.addPlayer("player3", "Carol", "socket3");
        game.startGame();

        // Set up players with specific cards
        const player1 = game.players.get("player1");
        const player2 = game.players.get("player2");
        const player3 = game.players.get("player3");

        // Give player1 a wild_draw4 card and extra card for proper CardMatch setup
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        const extraCard1 = new Card("green", "1", "number");
        player1.hand = [wildDraw4, extraCard1];
        game.sayCardMatch("player1"); // This works since player has 2 cards

        // Give player2 a red skip card and extra card for proper CardMatch setup
        const redSkip = new Card("red", "skip", "special");
        const extraCard2 = new Card("yellow", "2", "number");
        player2.hand = [redSkip, extraCard2];
        game.sayCardMatch("player2"); // This works since player has 2 cards

        // Give player3 some cards to draw
        player3.hand = [new Card("blue", "1", "number"), new Card("blue", "3", "number")];
        game.sayCardMatch("player3"); // This works since player has 2 cards

        // Set up initial discard pile
        const initialCard = new Card("blue", "5", "number");
        game.deck.discardPile = [initialCard];

        // Reset game state to ensure clean test
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;

        // Player1 plays wild_draw4 and declares red
        game.currentPlayerIndex = 0;
        game.playCard("player1", 0, "red");

        // Verify +4 is set up
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after wild_draw4");
        }

        // Player2 plays red skip to pass the +4
        game.currentPlayerIndex = 1;
        // Find the red skip card in player2's hand
        const skipCardIndex = player2.hand.findIndex(card => card.value === "skip" && card.color === "red");
        if (skipCardIndex === -1) {
            throw new Error("Red skip card not found in player2's hand");
        }
        game.playCard("player2", skipCardIndex);

        // After skip, drawCount should remain and be passed to next player
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after skip");
        }
        if (game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to be false after skip");
        }
        // Note: skipNext will be false here because it gets consumed by moveToNextPlayer()
        // The important thing is that drawCount remains and the counter worked
    });

    // Test Reverse returns +4 to original player
    test("Reverse should return +4 to original player", () => {
        const game = new CardMatchGame("TEST456"); // Use different room ID
        game.addPlayer("player1", "Alice", "socket1");
        game.addPlayer("player2", "Bob", "socket2");
        game.addPlayer("player3", "Carol", "socket3");
        game.startGame();

        // Set up players with specific cards
        const player1 = game.players.get("player1");
        const player2 = game.players.get("player2");
        const player3 = game.players.get("player3");

        // Give player1 a wild_draw4 card and extra card for proper CardMatch setup
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        const extraCard1 = new Card("green", "1", "number");
        player1.hand = [wildDraw4, extraCard1];
        game.sayCardMatch("player1"); // This works since player has 2 cards

        // Give player2 a red reverse card and extra card for proper CardMatch setup
        const redReverse = new Card("red", "reverse", "special");
        const extraCard2 = new Card("yellow", "2", "number");
        player2.hand = [redReverse, extraCard2];
        game.sayCardMatch("player2"); // This works since player has 2 cards

        // Give player3 some cards
        player3.hand = [new Card("blue", "1", "number"), new Card("blue", "3", "number")];
        game.sayCardMatch("player3"); // This works since player has 2 cards

        // Set up initial discard pile
        const initialCard = new Card("blue", "5", "number");
        game.deck.discardPile = [initialCard];

        // Reset game state to ensure clean test
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;

        // Remember original direction and player order
        const originalDirection = game.direction;
        const originalCurrentPlayer = game.currentPlayerIndex;

        // Player1 plays wild_draw4 and declares red
        game.currentPlayerIndex = 0;
        game.playCard("player1", 0, "red");        // Verify +4 is set up
        if (game.drawCount !== 4) {
            throw new Error(`Expected drawCount to be 4 after wild_draw4, but got ${game.drawCount}. Game state: lastPlayedWasDraw4=${game.lastPlayedWasDraw4}, player1 hand size=${player1.hand.length}`);
        }

        // Player2 plays red reverse to send +4 back
        game.currentPlayerIndex = 1;
        // Find the red reverse card in player2's hand
        const reverseCardIndex = player2.hand.findIndex(card => card.value === "reverse" && card.color === "red");
        if (reverseCardIndex === -1) {
            throw new Error("Red reverse card not found in player2's hand");
        }
        game.playCard("player2", reverseCardIndex);

        // After reverse, drawCount should remain for original player
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after reverse");
        }
        if (game.direction === originalDirection) {
            throw new Error("Expected direction to be reversed");
        }
        if (game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to be false after reverse");
        }
    });

    console.log(`\n🎯 Enhanced Rules Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log("🎉 All enhanced rules tests passed!");
    } else {
        console.log("❌ Some enhanced rules tests failed. Please check the implementation.");
    }

    return { passed, failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    testEnhanced4CounterRules();
}

module.exports = { testEnhanced4CounterRules };