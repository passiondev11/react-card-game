import _last from 'lodash/last';
import _first from 'lodash/first';
import _every from 'lodash/every';
import _flatten from 'lodash/flatten';
import { ranks } from './setup';

const genericError = {
  status: false,
  statusText: 'Some error occurred'
};

const MOVE_NOT_ALLOWED = 'Move is not allowed';

const isDifferentColor = (cards, pile) => {
  const topCard = _last(pile);
  const firstCard = _first(cards);
  if (!firstCard) {
    return genericError;
  }
  const result = !topCard || topCard.color !== firstCard.color;

  return {
    status: result,
    statusText: result ? '' : MOVE_NOT_ALLOWED
  };
};

const isHigherRank = (cards, pile) => {
  const topCard = _last(pile);
  const firstCard = _first(cards);
  if (!firstCard) {
    return genericError;
  }
  const result = !topCard || ranks.indexOf(firstCard.value) === ranks.indexOf(topCard.value) - 1;
  return {
    status: result,
    statusText: result ? '' : MOVE_NOT_ALLOWED
  };
};

const isLowerRank = (cards, pile) => {
  const firstCard = _first(cards);
  if (!firstCard) {
    return genericError;
  }
  const result = pile.length === ranks.indexOf(firstCard.value);

  return {
    status: result,
    statusText: result ? '' : MOVE_NOT_ALLOWED
  };
};

const hasNoStock = (stock, waste) => ({
  status: stock.length === 0 && waste.length === 0,
  statusText: 'There are still cards in the stock and/or waste piles'
});

const isAllRevealed = (tableau) => {
  const cards = _flatten(tableau);
  const result = _every(cards, (card) => card.up);
  console.info('isAllRevealed', result);

  return {
    status: result,
    statusText: 'You need to reveal all cards on the tableau'
  };
};

export {
  isAllRevealed,
  hasNoStock,
  isDifferentColor,
  isHigherRank,
  isLowerRank
};
