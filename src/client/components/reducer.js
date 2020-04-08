import _filter from 'lodash/filter';
import _find from 'lodash/find';
import _cloneDeep from 'lodash/cloneDeep';
import _flatten from 'lodash/flatten';
import _sortBy from 'lodash/sortBy';
import {
  Suit, GameState, PileName, ActionTypes, Action, ActionPayloadSourceName, ActionPayloadTargetName, MappedCard
} from './definitions';
import { createInitialState } from './setup';
import Card from './card';

const getFoundationTargetIndex = (card) => {
  let targetIndex = 0;

  if (card.suit === Suit.Heart) {
    targetIndex = 1;
  }

  if (card.suit === Suit.Diamond) {
    targetIndex = 2;
  }

  if (card.suit === Suit.Club) {
    targetIndex = 3;
  }

  return targetIndex;
};

const setInitState = (prevState, payload) => {

  const stock = payload.stock.map(stock => stock.map(stock => {
      return new Card(stock.suit, stock.value, stock.up);
  }));
  
  const waste = payload.waste.map(waste => waste.map(waste => {
    return new Card(waste.suit, waste.value, waste.up);
  }));
  
  const stack = payload.stack.map(stack => stack.map(stack => {
    return new Card(stack.suit, stack.value, stack.up);
  }));
  
  const pile = payload.pile.map(pile => pile.map(pile => {
    return new Card(pile.suit, pile.value, pile.up);
  }));

  return {
    ...prevState,
    stock: stock,
    waste: waste,
    stack: stack,
    pile: pile,
  };
};

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

const finishAction = (prevState) => {
  const piles = _flatten(prevState.pile.map((pile, pileIndex) => pile.map((card) => {
    const targetIndex = getFoundationTargetIndex(card);
    return [card, pileIndex, targetIndex];
  })));
  const sortedCards = _sortBy(piles, (mappedCard) => {
    const [card] = mappedCard;

    return card.value;
  });

  return moveCardsAction(prevState, sortedCards, PileName.PILE, PileName.STACK);
};

const flipCardAction = (prevState, mappedCards, targetName) => {
  const newTarget = _cloneDeep(prevState[targetName]);

  for (const mappedCard of mappedCards) {
    const [targetCard, sourceIndex, targetIndex] = mappedCard;
    const cardToBeFlipped = _find(newTarget[targetIndex], (card) => card.id === targetCard.id);

    if (cardToBeFlipped) {
      cardToBeFlipped.flip();
    }
  }

  return {
    ...prevState,
    [targetName]: newTarget
  };
};

const resetAction = () => createInitialState();

const reducer = (prevState, action) => {
  const { type, payload } = action;

  if (type === ActionTypes.SET_INIT_VALUE && payload) {
    return setInitState(prevState, payload);
  }

  if (type === ActionTypes.MOVE_CARDS && payload && payload.cards && payload.sourcePile && payload.targetPile) {
    return moveCardsAction(prevState, payload.cards, payload.sourcePile, payload.targetPile);
  }

  if (type === ActionTypes.FINISH) {
    return finishAction(prevState);
  }

  if (type === ActionTypes.FLIP_CARD && payload && payload.cards && payload.targetPile) {
    return flipCardAction(prevState, payload.cards, payload.targetPile);
  }

  if (type === ActionTypes.RESET) {
    return resetAction();
  }

  return prevState;
};

export default reducer;
export {
  getFoundationTargetIndex
};
