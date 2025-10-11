// Test runner - runs all tests in the test directory
const fs = require('fs');
const path = require('path');

function runAllTests() {
    console.log("🎮 Running All CardMatch Tests...\n");

    let totalPassed = 0;
    let totalFailed = 0;

    // Import and run the main game tests
    try {
        // Clear require cache to ensure clean test environment
        delete require.cache[require.resolve('./game-test')];
        delete require.cache[require.resolve('../shared/game')];
        delete require.cache[require.resolve('../shared/deck')];

        const gameTest = require('./game-test');
        const result = gameTest.runTests();
        totalPassed += result.passed || 0;
        totalFailed += result.failed || 0;
    } catch (error) {
        console.log("❌ Failed to run game-test.js:", error.message);
        totalFailed++;
    }

    // Import and run the enhanced rules tests
    try {
        // Clear require cache to ensure clean test environment
        delete require.cache[require.resolve('./enhanced-rules-test')];
        delete require.cache[require.resolve('../shared/game')];
        delete require.cache[require.resolve('../shared/deck')];

        const enhancedTest = require('./enhanced-rules-test');
        const result = enhancedTest.testEnhanced4CounterRules();
        totalPassed += result.passed || 0;
        totalFailed += result.failed || 0;
    } catch (error) {
        console.log("❌ Failed to run enhanced-rules-test.js:", error.message);
        totalFailed++;
    }

    console.log(`\n🎯 Overall Test Results: ${totalPassed} passed, ${totalFailed} failed`);

    if (totalFailed === 0) {
        console.log("🎉 All tests passed! CardMatch is ready to play!");
        process.exit(0);
    } else {
        console.log("❌ Some tests failed. Please check the implementation.");
        process.exit(1);
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };