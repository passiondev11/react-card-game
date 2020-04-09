/* Copyright G. Hemingway, 2020 - All rights reserved */
"use strict";

const shuffleCards = (includeJokers = false) => {
  /* Return an array of 52 cards (if jokers is false, 54 otherwise). Carefully follow the instructions in the README */
  let cards = [];
  ["spades", "clubs", "hearts", "diamonds"].forEach(suit => {
    ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"].forEach(
      value => {
        cards.push({ suit: suit, value: value });
      }
    );
  });
  // Add in jokers here
  if (includeJokers) {
    /*...*/
  }
  // Now shuffle
  let deck = [];
  while (cards.length > 0) {
    // Find a random number between 0 and cards.length - 1
    const index = Math.floor(Math.random() * cards.length);
    deck.push(cards[index]);
    cards.splice(index, 1);
  }
  return deck;
};

const initialState = () => {
  /* Use the above function.  Generate and return an initial state for a game */
  let state = {
    pile1: [],
    pile2: [],
    pile3: [],
    pile4: [],
    pile5: [],
    pile6: [],
    pile7: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    draw: [],
    discard: []
  };

  // Get the shuffled deck and distribute it to the players
  const deck = shuffleCards(false);
  // Setup the piles
  for (let i = 1; i <= 7; ++i) {
    let card = deck.splice(0, 1)[0];
    card.up = true;
    state[`pile${i}`].push(card);
    for (let j = i + 1; j <= 7; ++j) {
      card = deck.splice(0, 1)[0];
      card.up = false;
      state[`pile${j}`].push(card);
    }
  }
  // Finally, get the draw right
  state.draw = deck.map(card => {
    card.up = false;
    return card;
  });
  return state;
};

const filterGameForProfile = game => ({
  active: game.active,
  score: game.score,
  won: game.won,
  id: game._id,
  game: "klondyke",
  start: game.start,
  state: game.state,
  moves: game.moves,
  winner: game.winner
});

const filterMoveForResults = move => ({
  ...move
});

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


const suits = [
  Suit.Spade,
  Suit.Heart,
  Suit.Club,
  Suit.Diamond
];
const ranks = [
  Rank.Ace,
  Rank.Two,
  Rank.Three,
  Rank.Four,
  Rank.Five,
  Rank.Six,
  Rank.Seven,
  Rank.Eight,
  Rank.Nine,
  Rank.Ten,
  Rank.Jack,
  Rank.Queen,
  Rank.King
];

const moveCardsAction = (prevState, mappedCards, sourceName, targetName) => {
  const newSource = _cloneDeep(prevState[sourceName]);
  const newTarget = _cloneDeep(prevState[targetName]);

  for (const mappedCard of mappedCards) {
    const [sourceCard, sourceIndex, targetIndex] = mappedCard;

    newSource[sourceIndex] = _filter(newSource[sourceIndex], (card) => card.id !== sourceCard.id);

    newTarget[targetIndex].push(sourceCard);

    if (targetName === sourceName) {
      newTarget[sourceIndex] = newSource[sourceIndex];
    }
  }

  return {
    ...prevState,
    [sourceName]: newSource,
    [targetName]: newTarget
  };
};

let validateMove = (state, requestedMove) => {
  let res = {result: "succes", state: state};
  /* return error or new state */
  
  if(!requestedMove.cards.length) {
    return res;
  }

  let exData = {};

  exData["draw"] = state.draw;
  exData["discard"] = state.discard;
  exData["pile1"] = state.pile1;
  exData["pile2"] = state.pile2;
  exData["pile3"] = state.pile3;
  exData["pile4"] = state.pile4;
  exData["pile5"] = state.pile5;
  exData["pile6"] = state.pile6;
  exData["pile7"] = state.pile7;
  exData["stack1"] = state.stack1;
  exData["stack2"] = state.stack2;
  exData["stack3"] = state.stack3;
  exData["stack4"] = state.stack4;

  let firstCard = requestedMove.cards[0];
  let topCard = exData[requestedMove.dst][exData[requestedMove.dst].length-1];

  let validStatus = false;

  if(requestedMove.dst.indexOf("pile")!=-1) {
    if(validStatus) {
      validStatus &= ranks.indexOf(firstCard.value) == ranks.indexOf(topCard.value) - 1;
    }

    if(validStatus) {
      validStatus &= (suits.indexOf(firstCard.suit)%2) != (suits.indexOf(topCard.suit)%2);
    }
    
    let card;
    while(card = requestedMove.cards.shift()) {
      exData[requestedMove.src].pop();
      exData[requestedMove.dst].push(card);
    }
  }

  if(requestedMove.dst.indexOf("stack")!=-1) {
    if(validStatus) {
      validStatus &= ranks.indexOf(firstCard.value) == ranks.indexOf(topCard.value) + 1;
    }
    
    let card;
    while(card = requestedMove.cards.shift()) {
      exData[requestedMove.src].pop();
      exData[requestedMove.dst].push(card);
    }
  }
  /*
  if(requestedMove.dst.indexOf("draw")!=-1) {
    let card;
    while(card = requestedMove.cards.shift()) {
      exData[requestedMove.src].shift();
      card.up = false;
      exData[requestedMove.dst].push(card);
    }
  }

  if(requestedMove.dst.indexOf("discard")!=-1) {
    let card;
    while(card = requestedMove.cards.shift()) {
      exData[requestedMove.src].shift();
      card.up = true;
      exData[requestedMove.dst].push(card);
    }
  }
  */
  state.draw = exData["draw"];
  state.discard = exData["discard"];
  state.pile1 = exData["pile1"];
  state.pile2 = exData["pile2"];
  state.pile3 = exData["pile3"];
  state.pile4 = exData["pile4"];
  state.pile5 = exData["pile5"];
  state.pile6 = exData["pile6"];
  state.pile7 = exData["pile7"];
  state.stack1= exData["stack1"];
  state.stack2 = exData["stack2"];
  state.stack3 = exData["stack3"];
  state.stack4 = exData["stack4"];

  if(validStatus) {

  }else {
    res.result = "success";
  }
  
  return res;
};

module.exports = {
  shuffleCards: shuffleCards,
  initialState: initialState,
  filterGameForProfile: filterGameForProfile,
  filterMoveForResults: filterMoveForResults,
  validateMove: validateMove
};
