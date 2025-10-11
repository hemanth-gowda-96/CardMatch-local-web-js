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

    // Test Skip passes +4 to next player (simplified and more robust)
    test("Skip should pass +4 to next player", () => {
        const game = new CardMatchGame("SKIP_TEST");
        game.addPlayer("playerA", "Alice", "socketA");
        game.addPlayer("playerB", "Bob", "socketB");
        game.addPlayer("playerC", "Carol", "socketC");
        game.startGame();

        // Set up a controlled scenario: direct state manipulation for reliability
        const playerA = game.players.get("playerA");
        const playerB = game.players.get("playerB");
        const playerC = game.players.get("playerC");

        // Give all players safe hands (3+ cards to avoid CardMatch penalties)
        playerA.hand = [new Card("green", "1", "number"), new Card("blue", "3", "number"), new Card("yellow", "5", "number")];
        playerB.hand = [new Card(null, "wild_draw4", "wild"), new Card("red", "2", "number"), new Card("green", "4", "number")];
        playerC.hand = [new Card("red", "skip", "special"), new Card("blue", "6", "number"), new Card("yellow", "7", "number")];

        // Set up controlled game state
        game.deck.discardPile = [new Card("blue", "8", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;
        game.currentPlayerIndex = 1; // PlayerB's turn

        // PlayerB plays +4, chooses red
        game.playCard("playerB", 0, "red");

        // Verify +4 setup
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to be 4 after +4");
        }
        if (!game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to be true after +4");
        }

        // Should now be PlayerC's turn
        if (game.currentPlayerIndex !== 2) {
            throw new Error(`Expected PlayerC's turn (index 2), got ${game.currentPlayerIndex}`);
        }

        // PlayerC plays red skip to counter
        game.playCard("playerC", 0);

        // Verify the skip counter worked correctly
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after skip counter");
        }
        if (!game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to remain true (bug fix verification)");
        }

        // Should now be PlayerA's turn (skip passed +4 to next player)
        if (game.currentPlayerIndex !== 0) {
            throw new Error(`Expected PlayerA's turn (index 0) after skip, got ${game.currentPlayerIndex}`);
        }
    });

    // Test Reverse returns +4 to original player (simplified and more robust)
    test("Reverse should return +4 to original player", () => {
        const game = new CardMatchGame("REVERSE_TEST");
        game.addPlayer("playerX", "Alice", "socketX");
        game.addPlayer("playerY", "Bob", "socketY");
        game.startGame();

        // Set up a controlled 2-player scenario for simplicity
        const playerX = game.players.get("playerX");
        const playerY = game.players.get("playerY");

        // Give both players safe hands (3+ cards)
        playerX.hand = [new Card(null, "wild_draw4", "wild"), new Card("blue", "1", "number"), new Card("green", "2", "number")];
        playerY.hand = [new Card("red", "reverse", "special"), new Card("yellow", "3", "number"), new Card("blue", "4", "number")];

        // Set up controlled game state
        game.deck.discardPile = [new Card("green", "5", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;
        game.currentPlayerIndex = 0; // PlayerX's turn

        const originalDirection = game.direction;

        // PlayerX plays +4, chooses red
        game.playCard("playerX", 0, "red");

        // Verify +4 setup
        if (game.drawCount !== 4 || !game.lastPlayedWasDraw4) {
            throw new Error("Expected +4 to be set up correctly");
        }

        // Should now be PlayerY's turn
        if (game.currentPlayerIndex !== 1) {
            throw new Error("Expected PlayerY's turn after +4");
        }

        // PlayerY plays red reverse to send +4 back
        game.playCard("playerY", 0);

        // Verify reverse worked correctly
        if (game.drawCount !== 4) {
            throw new Error("Expected drawCount to remain 4 after reverse");
        }
        if (game.direction === originalDirection) {
            throw new Error("Expected direction to be reversed");
        }
        if (!game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to remain true (bug fix verification)");
        }

        // In 2-player game, after reverse the turn should go back to PlayerX
        if (game.currentPlayerIndex !== 0) {
            throw new Error("Expected turn to return to PlayerX after reverse");
        }
    });

    // Test 10-player scenario (simplified and robust)
    test("Skip should pass +4 correctly in 10-player game", () => {
        const game = new CardMatchGame("TEST10P");
        
        // Add 10 players
        for (let i = 0; i < 10; i++) {
            game.addPlayer(`p${i}`, `Player${i}`, `socket${i}`);
        }
        game.startGame();

        // Give all players safe hands (3+ cards)
        for (let i = 0; i < 10; i++) {
            const player = game.players.get(`p${i}`);
            player.hand = [
                new Card("yellow", "1", "number"),
                new Card("blue", "2", "number"),
                new Card("green", "3", "number")
            ];
        }

        // Set up test scenario: p5 has +4, p6 has red skip
        const p5 = game.players.get("p5");
        const p6 = game.players.get("p6");
        p5.hand[0] = new Card(null, "wild_draw4", "wild");
        p6.hand[0] = new Card("red", "skip", "special");

        // Set up controlled game state
        game.deck.discardPile = [new Card("blue", "5", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;
        game.currentPlayerIndex = 5; // p5's turn

        // p5 plays +4, chooses red
        game.playCard("p5", 0, "red");

        // Verify +4 setup
        if (game.drawCount !== 4 || !game.lastPlayedWasDraw4 || game.currentPlayerIndex !== 6) {
            throw new Error("Expected +4 setup with p6's turn");
        }

        // p6 plays red skip to pass +4 to p7
        game.playCard("p6", 0);

        // Verify skip counter worked
        if (game.currentPlayerIndex !== 7) {
            throw new Error(`Expected p7's turn (index 7), but got index ${game.currentPlayerIndex}`);
        }
        if (game.drawCount !== 4) {
            throw new Error("Expected +4 to be passed to p7");
        }
        if (!game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to remain true (bug fix verification)");
        }
    });

    // Test wrap-around scenario (simplified)
    test("Skip should handle turn wrap-around correctly", () => {
        const game = new CardMatchGame("TESTWRAP");
        
        // Add 4 players for simpler wrap-around test
        for (let i = 0; i < 4; i++) {
            game.addPlayer(`px${i}`, `PlayerX${i}`, `socketx${i}`);
        }
        game.startGame();

        // Give all players safe hands (3+ cards)
        for (let i = 0; i < 4; i++) {
            const player = game.players.get(`px${i}`);
            player.hand = [
                new Card("yellow", "1", "number"),
                new Card("blue", "2", "number"),
                new Card("green", "3", "number")
            ];
        }

        // Set up test: px3 (last player) has +4, px0 (first player) has red skip
        const px3 = game.players.get("px3");
        const px0 = game.players.get("px0");
        px3.hand[0] = new Card(null, "wild_draw4", "wild");
        px0.hand[0] = new Card("red", "skip", "special");

        // Set up controlled game state
        game.deck.discardPile = [new Card("blue", "5", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;
        game.currentPlayerIndex = 3; // px3's turn

        // px3 plays +4, chooses red (should wrap to px0)
        game.playCard("px3", 0, "red");

        // Verify wrap to px0
        if (game.currentPlayerIndex !== 0) {
            throw new Error(`Expected px0's turn (index 0), but got index ${game.currentPlayerIndex}`);
        }

        // px0 plays red skip to pass +4 to px1
        game.playCard("px0", 0);

        // Verify wrap-around skip worked
        if (game.currentPlayerIndex !== 1) {
            throw new Error(`Expected px1's turn (index 1), but got index ${game.currentPlayerIndex}`);
        }
        if (game.drawCount !== 4) {
            throw new Error("Expected +4 to be passed to px1");
        }
        if (!game.lastPlayedWasDraw4) {
            throw new Error("Expected lastPlayedWasDraw4 to remain true (bug fix verification)");
        }
    });

    // Test bug fix: +2 restriction after skip counter (simplified)
    test("After skip counters +4, next player cannot play +2 of same color", () => {
        const game = new CardMatchGame("TESTBUG");
        game.addPlayer("pA", "Alice", "socketA");
        game.addPlayer("pB", "Bob", "socketB");
        game.addPlayer("pC", "Carol", "socketC");
        game.startGame();

        // Give all players safe hands (3+ cards)
        const pA = game.players.get("pA");
        const pB = game.players.get("pB");
        const pC = game.players.get("pC");

        pA.hand = [new Card(null, "wild_draw4", "wild"), new Card("green", "1", "number"), new Card("blue", "5", "number")];
        pB.hand = [new Card("red", "skip", "special"), new Card("blue", "2", "number"), new Card("yellow", "6", "number")];
        pC.hand = [new Card("red", "draw2", "special"), new Card("yellow", "3", "number"), new Card("green", "7", "number")];

        // Set up controlled game state
        game.deck.discardPile = [new Card("blue", "4", "number")];
        game.drawCount = 0;
        game.lastPlayedWasDraw4 = false;
        game.skipNext = false;
        game.currentPlayerIndex = 0; // pA's turn

        // pA plays +4, chooses red
        game.playCard("pA", 0, "red");

        // Verify +4 setup and pB's turn
        if (game.drawCount !== 4 || !game.lastPlayedWasDraw4 || game.currentPlayerIndex !== 1) {
            throw new Error("Expected +4 setup with pB's turn");
        }

        // pB plays red skip to pass +4 to pC
        game.playCard("pB", 0);

        // Verify pC's turn and +4 still active
        if (game.currentPlayerIndex !== 2) {
            throw new Error("Expected pC's turn after skip counter");
        }
        if (game.drawCount !== 4 || !game.lastPlayedWasDraw4) {
            throw new Error("Expected +4 to remain active for pC");
        }

        // pC should NOT be able to play red +2 (bug fix verification)
        let canPlayDraw2 = false;
        try {
            game.playCard("pC", 0); // Try to play red +2
            canPlayDraw2 = true;
        } catch (error) {
            // Should throw error - red +2 not allowed after +4 counter
            canPlayDraw2 = false;
        }

        if (canPlayDraw2) {
            throw new Error("BUG: pC should NOT be able to play red +2 after skip counter!");
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