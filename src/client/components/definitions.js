const Suit  = {
  Spade : 'spades',
  Heart : 'hearts',
  Diamond : 'diamonds',
  Club : 'clubs'
};
Object.freeze(Suit);

const Rank = {
  Ace : 'ace',
  Two : '2',
  Three : '3',
  Four : '4',
  Five : '5',
  Six : '6',
  Seven : '7',
  Eight : '8',
  Nine : '9',
  Ten : '10',
  Jack : 'jack',
  Queen : 'queen',
  King : 'king',
  Joker : 'joker'
};
Object.freeze(Rank);

const PileName = {
  STOCK : 'stock',
  WASTE : 'waste',
  STACK : 'stack',
  PILE : 'pile'
};
Object.freeze(PileName);

const Color = {
  RED : 'red',
  BLACK : 'black'
}
Object.freeze(Color);

const ActionTypes = {
  SET_INIT_VALUE : 'set-init-value',
  MOVE_CARDS : 'move-cards',
  RESET : 'reset',
  FLIP_CARD : 'flip-card',
  FINISH : 'finish'
}
Object.freeze(ActionTypes);

export {
  Suit,
  Rank,
  PileName,
  Color,
  ActionTypes
};
