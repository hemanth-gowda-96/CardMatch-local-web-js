// CardMatch Game Constants and Rules
const COLORS = ["red", "blue", "green", "yellow"];
const SPECIAL_CARDS = ["skip", "reverse", "draw2"];
const WILD_CARDS = ["wild", "wild_draw4"];
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const CARD_TYPES = {
  NUMBER: "number",
  SPECIAL: "special",
  WILD: "wild",
};

const GAME_STATES = {
  WAITING: "waiting",
  STARTING: "starting",
  PLAYING: "playing",
  FINISHED: "finished",
};

const DIRECTIONS = {
  CLOCKWISE: 1,
  COUNTERCLOCKWISE: -1,
};

module.exports = {
  COLORS,
  SPECIAL_CARDS,
  WILD_CARDS,
  NUMBERS,
  CARD_TYPES,
  GAME_STATES,
  DIRECTIONS,
};
