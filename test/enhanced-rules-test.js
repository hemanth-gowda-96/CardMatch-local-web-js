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

        // Give player1 a wild_draw4 card
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        player1.hand = [wildDraw4];

        // Give player2 a red skip card
        const redSkip = new Card("red", "skip", "special");
        player2.hand = [redSkip];

        // Give player3 some cards to draw
        player3.hand = [new Card("blue", "1", "number")];

        // Set up initial discard pile
        const initialCard = new Card("blue", "5", "number");
        game.deck.discardPile = [initialCard];

        // Player1 plays wild_draw4 and declares red
        game.currentPlayerIndex = 0;
        game.playCard("player1", 0, "red");

        // Verify +4 is set up
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after wild_draw4");
        }

        // Player2 plays red skip to pass the +4
        game.currentPlayerIndex = 1;
        game.playCard("player2", 0);

        // After skip, drawCount should remain and be passed to next player
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after skip");
        }
        if (!game.skipNext) {
            throw new Error("Expected skipNext to be true");
        }
        if (game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to be false after skip");
        }
    });

    // Test Reverse returns +4 to original player
    test("Reverse should return +4 to original player", () => {
        const game = new CardMatchGame("TEST123");
        game.addPlayer("player1", "Alice", "socket1");
        game.addPlayer("player2", "Bob", "socket2");
        game.addPlayer("player3", "Carol", "socket3");
        game.startGame();

        // Set up players with specific cards
        const player1 = game.players.get("player1");
        const player2 = game.players.get("player2");
        const player3 = game.players.get("player3");

        // Give player1 a wild_draw4 card
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        player1.hand = [wildDraw4];

        // Give player2 a red reverse card
        const redReverse = new Card("red", "reverse", "special");
        player2.hand = [redReverse];

        // Set up initial discard pile
        const initialCard = new Card("blue", "5", "number");
        game.deck.discardPile = [initialCard];

        // Remember original direction and player order
        const originalDirection = game.direction;
        const originalCurrentPlayer = game.currentPlayerIndex;

        // Player1 plays wild_draw4 and declares red
        game.currentPlayerIndex = 0;
        game.playCard("player1", 0, "red");

        // Verify +4 is set up
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after wild_draw4");
        }

        // Player2 plays red reverse to send +4 back
        game.currentPlayerIndex = 1;
        game.playCard("player2", 0);

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