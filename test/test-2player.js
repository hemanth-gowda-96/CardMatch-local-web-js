// Import shared modules from the parent directory for testing
const { CardMatchGame } = require("../shared/game");
const { Deck, Card } = require("../shared/deck");
const { COLORS, SPECIAL_CARDS, WILD_CARDS } = require("../shared/constants");

// Test the 2-player scenario specifically
function test2PlayerSkipScenario() {
    console.log("🎮 Testing 2-Player Skip Scenario...\n");

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

    // Test 2-player Skip scenario
    test("2-player: Skip should pass +4 and end turn correctly", () => {
        const game = new CardMatchGame("TEST123");
        game.addPlayer("player1", "Alice", "socket1");
        game.addPlayer("player2", "Bob", "socket2");
        game.startGame();

        // Set up players with specific cards
        const player1 = game.players.get("player1");
        const player2 = game.players.get("player2");

        // Give player1 a wild_draw4 card and some other cards
        const { CARD_TYPES } = require("../shared/constants");
        const wildDraw4 = new Card(null, "wild_draw4", CARD_TYPES.WILD);
        const extraCard = new Card("blue", "3", CARD_TYPES.NUMBER);
        player1.hand = [wildDraw4, extraCard];

        // Give player2 a red skip card and some other cards
        const redSkip = new Card("red", "skip", CARD_TYPES.SPECIAL);
        const extraCard2 = new Card("green", "7", CARD_TYPES.NUMBER);
        player2.hand = [redSkip, extraCard2];

        // Set up initial discard pile
        const initialCard = new Card("blue", "5", CARD_TYPES.NUMBER);
        game.deck.discardPile = [initialCard];

        console.log("Initial state:");
        console.log("- Current player index:", game.currentPlayerIndex);
        console.log("- Player order:", game.playerOrder);

        // Player1 plays wild_draw4 and declares red
        game.currentPlayerIndex = 0; // Player1's turn
        console.log("\n1. Player1 plays wild_draw4, declares red");
        console.log("Player1 hand:", player1.hand.map(c => `${c.color}_${c.value}_${c.type}`));
        console.log("Playing card at index 0:", player1.hand[0]);

        // Player1 needs to say CardMatch before playing since they'll go from 2 cards to 1
        game.sayCardMatch("player1");
        console.log("Player1 said CardMatch");

        try {
            const result = game.playCard("player1", 0, "red");
            console.log("playCard result:", result);
        } catch (error) {
            console.log("playCard error:", error.message);
            throw error;
        }

        console.log("After Player1 plays +4:");
        console.log("- Current player index:", game.currentPlayerIndex);
        console.log("- DrawCount:", game.drawCount);
        console.log("- LastPlayedWasDraw4:", game.lastPlayedWasDraw4);
        console.log("- DeclaredColor:", game.declaredColor);

        // Verify +4 is set up
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after wild_draw4");
        }
        if (game.currentPlayerIndex !== 1) {
            throw new Error("Expected current player to be player2 after player1's turn");
        }

        // Player2 plays red skip to pass the +4
        console.log("\n2. Player2 plays red skip");
        console.log("Player2 hand:", player2.hand.map(c => `${c.color}_${c.value}_${c.type}`));
        console.log("Playing card at index 0:", player2.hand[0]);
        console.log("Declared color:", game.declaredColor);

        // Player2 also needs to say CardMatch before playing since they'll go from 2 cards to 1
        game.sayCardMatch("player2");
        console.log("Player2 said CardMatch");

        game.playCard("player2", 0); console.log("After Player2 plays skip:");
        console.log("- Current player index:", game.currentPlayerIndex);
        console.log("- DrawCount:", game.drawCount);
        console.log("- SkipNext:", game.skipNext);
        console.log("- LastPlayedWasDraw4:", game.lastPlayedWasDraw4);

        // After skip, drawCount should remain and be passed back to player1
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after skip");
        }

        // In 2-player game, skip should make it player1's turn again (but they'll be skipped)
        if (game.currentPlayerIndex !== 0) {
            throw new Error("Expected current player to be back to player1 after skip in 2-player game");
        }

        if (!game.skipNext) {
            throw new Error("Expected skipNext to be true");
        }

        if (game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to be false after skip");
        }

        console.log("\n✅ Test passed: Skip correctly passes +4 back to player1 in 2-player game");
    });

    console.log(`\n🎯 2-Player Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log("🎉 2-player scenario test passed!");
    } else {
        console.log("❌ 2-player scenario test failed.");
    }

    return { passed, failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    test2PlayerSkipScenario();
}

module.exports = { test2PlayerSkipScenario };