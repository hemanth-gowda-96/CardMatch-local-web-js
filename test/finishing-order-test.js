const { CardMatchGame, Player } = require("../shared/game");
const { Card } = require("../shared/deck");

function testFinishingOrder() {
    console.log("🏁 Testing Finishing Order Functionality...");

    let passed = 0;
    let failed = 0;

    function test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }

    // Test 1: Basic finishing order with 3 players
    test("Should track finishing order correctly with 3 players", () => {
        const game = new CardMatchGame("FINISH_TEST");
        game.addPlayer("p1", "Alice", "socket1");
        game.addPlayer("p2", "Bob", "socket2");
        game.addPlayer("p3", "Carol", "socket3");
        game.startGame();

        const p1 = game.players.get("p1");
        const p2 = game.players.get("p2");
        const p3 = game.players.get("p3");

        // Give p1 one card (will finish first)
        p1.hand = [new Card("red", "1", "number")];
        p2.hand = [new Card("blue", "2", "number"), new Card("green", "3", "number")];
        p3.hand = [new Card("yellow", "4", "number"), new Card("red", "5", "number")];

        // Set up game state
        game.deck.discardPile = [new Card("red", "0", "number")];
        game.currentPlayerIndex = 0;

        // p1 plays last card and finishes
        const result1 = game.playCard("p1", 0);

        if (!result1.playerFinished) {
            throw new Error("Expected p1 to finish");
        }
        if (result1.gameEnded) {
            throw new Error("Game should not end with 2 players remaining");
        }
        if (game.finishingOrder.length !== 1) {
            throw new Error("Expected 1 player in finishing order");
        }
        if (game.finishingOrder[0].playerId !== "p1" || game.finishingOrder[0].position !== 1) {
            throw new Error("p1 should be in 1st position");
        }

        // Give p2 one card (will finish second)
        p2.hand = [new Card("red", "2", "number")];
        game.currentPlayerIndex = 0; // Should be p2's turn now (p1 removed from order)

        // p2 plays last card and finishes
        const result2 = game.playCard("p2", 0);

        if (!result2.gameEnded) {
            throw new Error("Game should end when only 1 player remains");
        }
        if (game.finishingOrder.length !== 3) {
            throw new Error("Expected 3 players in finishing order (including last player)");
        }

        // Check final finishing order
        const order = game.finishingOrder;
        if (order[0].playerId !== "p1" || order[0].position !== 1) {
            throw new Error("p1 should be 1st");
        }
        if (order[1].playerId !== "p2" || order[1].position !== 2) {
            throw new Error("p2 should be 2nd");
        }
        if (order[2].playerId !== "p3" || order[2].position !== 3 || !order[2].isLoser) {
            throw new Error("p3 should be 3rd and marked as loser");
        }

        if (game.winner.id !== "p1") {
            throw new Error("p1 should be the winner");
        }
    });

    // Test 2: Game should end when only 1 player remains
    test("Should end game when only 1 player remains", () => {
        const game = new CardMatchGame("LAST_PLAYER_TEST");
        game.addPlayer("p1", "Alice", "socket1");
        game.addPlayer("p2", "Bob", "socket2");
        game.startGame();

        const p1 = game.players.get("p1");
        const p2 = game.players.get("p2");

        // Set up scenario where p1 finishes and only p2 remains
        p1.hand = [new Card("red", "1", "number")];
        p2.hand = [new Card("blue", "2", "number"), new Card("green", "3", "number")];

        game.deck.discardPile = [new Card("red", "0", "number")];
        game.currentPlayerIndex = 0;

        // p1 plays last card
        const result = game.playCard("p1", 0);

        if (!result.gameEnded) {
            throw new Error("Game should end when only 1 player remains");
        }

        if (game.finishingOrder.length !== 2) {
            throw new Error("Should have 2 players in finishing order");
        }

        if (!game.finishingOrder[1].isLoser) {
            throw new Error("Last remaining player should be marked as loser");
        }
    });

    // Test 3: Multiple players finishing in sequence
    test("Should handle multiple players finishing in correct order", () => {
        const game = new CardMatchGame("SEQUENCE_TEST");
        for (let i = 1; i <= 5; i++) {
            game.addPlayer(`p${i}`, `Player${i}`, `socket${i}`);
        }
        game.startGame();

        // Set up game so players can finish in order: p2, p4, p1 (p3, p5 remain)
        const p1 = game.players.get("p1");
        const p2 = game.players.get("p2");
        const p3 = game.players.get("p3");
        const p4 = game.players.get("p4");
        const p5 = game.players.get("p5");

        p1.hand = [new Card("red", "1", "number"), new Card("blue", "2", "number")];
        p2.hand = [new Card("red", "3", "number")]; // Will finish 1st
        p3.hand = [new Card("green", "4", "number"), new Card("yellow", "5", "number"), new Card("red", "6", "number")];
        p4.hand = [new Card("red", "7", "number")]; // Will finish 2nd
        p5.hand = [new Card("blue", "8", "number"), new Card("green", "9", "number")];

        game.deck.discardPile = [new Card("red", "0", "number")];

        // Simulate p2 finishing first
        game.currentPlayerIndex = 1; // p2
        const result1 = game.playCard("p2", 0);
        if (result1.gameEnded || game.finishingOrder[0].playerId !== "p2") {
            throw new Error("p2 should finish first without ending game");
        }

        // Simulate p4 finishing second (index adjusted after p2 removal)
        // After p2 is removed, playerOrder becomes [p1, p3, p4, p5]
        // So p4 is now at index 2
        game.currentPlayerIndex = 2; // p4
        const result2 = game.playCard("p4", 0);
        if (result2.gameEnded || game.finishingOrder[1].playerId !== "p4") {
            throw new Error("p4 should finish second without ending game");
        }

        // Simulate p1 finishing third, leaving only p3 and p5
        // After p2, p4 removed, playerOrder becomes [p1, p3, p5]
        // p1 is at index 0
        game.currentPlayerIndex = 0; // p1
        p1.hand = [new Card("red", "2", "number")]; // Give p1 a playable card
        const result3 = game.playCard("p1", 0);
        if (result3.gameEnded || game.finishingOrder[2].playerId !== "p1") {
            throw new Error("p1 should finish third without ending game");
        }

        // Now only p3 and p5 remain, game should continue
        if (game.activePlayers.size !== 2) {
            throw new Error("Should have 2 active players remaining");
        }

        // Simulate p3 finishing fourth, game should end
        game.currentPlayerIndex = 0; // p3 (first in remaining order)
        p3.hand = [new Card("red", "4", "number")];
        const result4 = game.playCard("p3", 0);

        if (!result4.gameEnded) {
            throw new Error("Game should end when only 1 player remains");
        }

        // Verify final order
        const order = game.finishingOrder;
        if (order.length !== 5) {
            throw new Error("Should have all 5 players in finishing order");
        }

        const expectedOrder = ["p2", "p4", "p1", "p3", "p5"];
        for (let i = 0; i < 5; i++) {
            if (order[i].playerId !== expectedOrder[i]) {
                throw new Error(`Position ${i + 1} should be ${expectedOrder[i]}, got ${order[i].playerId}`);
            }
            if (order[i].position !== i + 1) {
                throw new Error(`Player ${order[i].playerId} should have position ${i + 1}, got ${order[i].position}`);
            }
        }

        // Last player should be marked as loser
        if (!order[4].isLoser) {
            throw new Error("Last player (p5) should be marked as loser");
        }

        // Winner should be first finisher
        if (game.winner.id !== "p2") {
            throw new Error("p2 should be the winner");
        }
    });

    console.log(`\n🏁 Finishing Order Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log("🎉 All finishing order tests passed!");
    } else {
        console.log("❌ Some finishing order tests failed.");
    }

    return { passed, failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    testFinishingOrder();
}

module.exports = { testFinishingOrder };