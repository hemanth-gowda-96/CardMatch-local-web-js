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

        // Set up for user's scenario: Player2 has wild_draw4, Player3 has red skip
        // Give player1 some normal cards
        player1.hand = [new Card("green", "1", "number"), new Card("blue", "3", "number")];
        game.sayCardMatch("player1"); // This works since player has 2 cards

        // Give player2 a wild_draw4 card and extra card for proper CardMatch setup
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        const extraCard2 = new Card("yellow", "2", "number");
        player2.hand = [wildDraw4, extraCard2];
        game.sayCardMatch("player2"); // This works since player has 2 cards

        // Give player3 a red skip card and extra card for proper CardMatch setup
        const redSkip = new Card("red", "skip", "special");
        const extraCard3 = new Card("green", "5", "number");
        player3.hand = [redSkip, extraCard3];
        game.sayCardMatch("player3"); // This works since player has 2 cards

        // Set up initial discard pile
        const initialCard = new Card("blue", "5", "number");
        game.deck.discardPile = [initialCard];

        // Reset game state to ensure clean test
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;

        // Simulate the user's scenario: Player2 plays wild_draw4, then Player3 counters with skip
        // Set currentPlayerIndex to Player2 (index 1)
        game.currentPlayerIndex = 1;
        game.playCard("player2", 0, "red"); // Player2 plays wild_draw4

        // Verify +4 is set up
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after wild_draw4");
        }

        // Now it should be Player3's turn (index 2)
        if (game.currentPlayerIndex !== 2) {
            throw new Error(`Expected turn to be player3's (index 2) after player2's +4, but it's index ${game.currentPlayerIndex}`);
        }

        // Player3 plays red skip to counter the +4
        // Find the red skip card in player3's hand  
        const skipCardIndex = player3.hand.findIndex(card => card.value === "skip" && card.color === "red");
        if (skipCardIndex === -1) {
            throw new Error("Red skip card not found in player3's hand");
        }
        game.playCard("player3", skipCardIndex); // Player3 plays skip to counter

        // After skip, drawCount should remain and be passed to next player
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after skip");
        }
        if (game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to be false after skip");
        }

        // Verify turn flow: Player2 played +4 (index 1), Player3 played skip (index 2), 
        // now it should be Player1's turn (index 0) to handle the +4, NOT back to Player2
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.id !== "player1") {
            throw new Error(`Expected turn to be player1's after skip counter, but it's ${currentPlayer.id}'s turn (index: ${game.currentPlayerIndex})`);
        }

        // Note: skipNext will be false here because countering +4 doesn't skip anyone
        // The important thing is that drawCount remains and goes to the correct next player
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

    // Test with 10 players to ensure turn flow works with maximum players
    test("Skip should pass +4 correctly in 10-player game", () => {
        const game = new CardMatchGame("TEST10P");
        // Add 10 players
        for (let i = 1; i <= 10; i++) {
            game.addPlayer(`player${i}`, `Player${i}`, `socket${i}`);
        }
        game.startGame();

        // Set up scenario: Player 5 plays +4, Player 6 counters with skip, should go to Player 7
        const player5 = game.players.get("player5");
        const player6 = game.players.get("player6");
        const player7 = game.players.get("player7");

        // Give player5 wild_draw4
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        player5.hand = [wildDraw4, new Card("green", "1", "number")];
        game.sayCardMatch("player5");

        // Give player6 red skip  
        const redSkip = new Card("red", "skip", "special");
        player6.hand = [redSkip, new Card("blue", "2", "number")];
        game.sayCardMatch("player6");

        // Give player7 some cards
        player7.hand = [new Card("yellow", "3", "number"), new Card("red", "4", "number")];
        game.sayCardMatch("player7");

        // Set up discard pile
        game.deck.discardPile = [new Card("blue", "5", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;

        // Player5 plays +4 (turn should go to Player6)
        game.currentPlayerIndex = 4; // Player5 is at index 4
        game.playCard("player5", 0, "red");

        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after +4");
        }

        // Verify it's Player6's turn
        if (game.currentPlayerIndex !== 5) {
            throw new Error(`Expected Player6's turn (index 5), but got index ${game.currentPlayerIndex}`);
        }

        // Player6 plays skip to counter
        game.playCard("player6", 0);

        // Verify turn goes to Player7 (index 6), NOT back to any previous player
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.id !== "player7") {
            throw new Error(`Expected turn to be Player7's after skip counter, but it's ${currentPlayer.id}'s turn (index: ${game.currentPlayerIndex})`);
        }

        // Verify +4 is still active for Player7
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 for Player7");
        }
    });

    // Test edge case: turn wrap-around in 10-player game
    test("Skip should handle turn wrap-around correctly in 10-player game", () => {
        const game = new CardMatchGame("TESTWRAP");
        // Add 10 players
        for (let i = 1; i <= 10; i++) {
            game.addPlayer(`player${i}`, `Player${i}`, `socket${i}`);
        }
        game.startGame();

        // Set up scenario: Player 10 plays +4, Player 1 counters with skip, should go to Player 2
        const player10 = game.players.get("player10");
        const player1 = game.players.get("player1");
        const player2 = game.players.get("player2");

        // Give player10 wild_draw4
        const wildDraw4 = new Card(null, "wild_draw4", "wild");
        player10.hand = [wildDraw4, new Card("green", "1", "number")];
        game.sayCardMatch("player10");

        // Give player1 red skip  
        const redSkip = new Card("red", "skip", "special");
        player1.hand = [redSkip, new Card("blue", "2", "number")];
        game.sayCardMatch("player1");

        // Give player2 some cards
        player2.hand = [new Card("yellow", "3", "number"), new Card("red", "4", "number")];
        game.sayCardMatch("player2");

        // Set up discard pile
        game.deck.discardPile = [new Card("blue", "5", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;

        // Player10 plays +4 (turn should wrap to Player1)
        game.currentPlayerIndex = 9; // Player10 is at index 9
        game.playCard("player10", 0, "red");

        // Verify it's Player1's turn (index 0)
        if (game.currentPlayerIndex !== 0) {
            throw new Error(`Expected Player1's turn (index 0), but got index ${game.currentPlayerIndex}`);
        }

        // Player1 plays skip to counter
        game.playCard("player1", 0);

        // Verify turn goes to Player2 (index 1), demonstrating proper wrap-around
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.id !== "player2") {
            throw new Error(`Expected turn to be Player2's after wrap-around skip counter, but it's ${currentPlayer.id}'s turn (index: ${game.currentPlayerIndex})`);
        }

        // Verify +4 is still active for Player2
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 for Player2");
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