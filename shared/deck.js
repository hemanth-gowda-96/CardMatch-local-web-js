const {
  COLORS,
  SPECIAL_CARDS,
  WILD_CARDS,
  NUMBERS,
  CARD_TYPES,
} = require("./constants");

class Card {
  constructor(color, value, type) {
    this.color = color;
    this.value = value;
    this.type = type;
    this.id = `${color}_${value}`;
  }

  canPlayOn(topCard, declaredColor = null) {
    // Wild cards can always be played
    if (this.type === CARD_TYPES.WILD) {
      return true;
    }

    // If top card is wild, check against declared color
    if (topCard.type === CARD_TYPES.WILD && declaredColor) {
      return this.color === declaredColor;
    }

    // Same color or same value
    return this.color === topCard.color || this.value === topCard.value;
  }

  getPoints() {
    if (this.type === CARD_TYPES.NUMBER) {
      return this.value;
    }
    if (this.type === CARD_TYPES.SPECIAL) {
      return 20;
    }
    if (this.type === CARD_TYPES.WILD) {
      return 50;
    }
    return 0;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
    this.initializeDeck();
  }

  initializeDeck() {
    this.cards = [];

    // Number cards (0-9 for each color)
    // 0 appears once per color, 1-9 appear twice per color
    COLORS.forEach((color) => {
      // Add one 0 card
      this.cards.push(new Card(color, 0, CARD_TYPES.NUMBER));

      // Add two of each number 1-9
      for (let i = 1; i <= 9; i++) {
        this.cards.push(new Card(color, i, CARD_TYPES.NUMBER));
        this.cards.push(new Card(color, i, CARD_TYPES.NUMBER));
      }

      // Add two of each special card per color
      SPECIAL_CARDS.forEach((special) => {
        this.cards.push(new Card(color, special, CARD_TYPES.SPECIAL));
        this.cards.push(new Card(color, special, CARD_TYPES.SPECIAL));
      });
    });

    // Add 4 wild cards and 4 wild draw 4 cards
    for (let i = 0; i < 4; i++) {
      this.cards.push(new Card(null, "wild", CARD_TYPES.WILD));
      this.cards.push(new Card(null, "wild_draw4", CARD_TYPES.WILD));
    }

    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  drawCard() {
    if (this.cards.length === 0) {
      this.reshuffleFromDiscard();
    }
    return this.cards.pop();
  }

  drawCards(count) {
    const drawnCards = [];
    for (let i = 0; i < count; i++) {
      const card = this.drawCard();
      if (card) {
        drawnCards.push(card);
      }
    }
    return drawnCards;
  }

  reshuffleFromDiscard() {
    if (this.discardPile.length <= 1) {
      // If we can't reshuffle, we have a problem
      console.warn("Cannot reshuffle - not enough cards in discard pile");
      return;
    }

    // Keep the top card, shuffle the rest back into deck
    const topCard = this.discardPile.pop();
    this.cards = [...this.discardPile];
    this.discardPile = [topCard];
    this.shuffle();
  }

  addToDiscard(card) {
    this.discardPile.push(card);
  }

  getTopCard() {
    return this.discardPile[this.discardPile.length - 1];
  }
}

module.exports = { Card, Deck };
