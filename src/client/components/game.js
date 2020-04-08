/* Copyright G. Hemingway, @2020 - All rights reserved */
'use strict';

import React, { useReducer, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Pile } from './pile';
import styled from 'styled-components';

import _last from 'lodash/last';
import _reverse from 'lodash/reverse';
import _flattenDeep from 'lodash/flattenDeep';
import _every from 'lodash/every';
import PileGroup from './PileGroup';
import {
  PileName, ActionTypes
} from './definitions';
import { cardCount } from './setup';

import reducer, { getFoundationTargetIndex } from './reducer';

import {
  isLowerRank, isHigherRank, isDifferentColor, isAllRevealed, hasNoStock
} from './rules';

const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

const CardRowGap = styled.div`
  flex-grow: 2;
`;

const GameBase = styled.div`
  grid-row: 2;
  grid-column: sb / main;
`;

const CardPanel = styled.div`
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--grid-gap) var(--grid-gap) 80px;
  display: grid;
  grid-gap: var(--grid-gap);
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "stock waste . foundation foundation foundation foundation"
    "tableau tableau tableau tableau tableau tableau tableau";

  @media (max-width: 768px) {
    grid-template-columns: auto 1fr;
    grid-template-rows: repeat(7, 1fr);
    grid-template-areas:
      "stock tableau"
      "waste tableau"
      ". tableau"
      "foundation tableau"
      "foundation tableau"
      "foundation tableau"
      "foundation tableau";
    padding-bottom: 100px;
  }
`;


export const Game = (props /*{ match }*/) => {
  const {
  initialState,
  match
  } = props;

  let [state, setState] = useState({
    stock: [], 
    waste: [], 
    foundation: [], 
    tableau: [],
    tableau1: [],
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
  });
  let [target, setTarget] = useState(undefined);
  let [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const [{
  stock, waste, foundation, tableau
  }, dispatch] = useReducer(reducer, initialState);
  
  const [message, setMessage] = useState('');

  const isDone = useMemo(() => {

    const allCards = _flattenDeep([...stock, ...waste, ...foundation]);
    const up = _every(allCards, (card) => card.up);
    const isStockAndWasteEmpty = stock[0].length === 0 && waste[0].length === 0;
    return isStockAndWasteEmpty && up;
  }, [foundation, stock, waste]);

  const isFinished = useMemo(() => {
    const allTableauCards = _flattenDeep(foundation);
    return allTableauCards.length === cardCount;
  }, [foundation]);

  useEffect(() => {
    if (message.length > 0) {
      window.setTimeout(() => setMessage(''), 4000);
    }
  }, [message]);

  useEffect(() => {
    if (isFinished) {
      setMessage('Congratulations!');
    }
  }, [isFinished]);

  useEffect(() => {
    tableau.forEach((pile, i) => {
      const topCard = _last(pile);

      if (topCard && !topCard.up) {
        dispatch({
          type: ActionTypes.FLIP_CARD,
          payload: {
            cards: [[topCard, i, i]],
            targetPile: PileName.TABLEAU
          }
        });
      }
    });
  }, [tableau]);

  useEffect(() => {
    const pile = waste[0];
    const topCard = _last(stock[0]);

    if (pile.length === 0 && topCard) {
      dispatch({
        type: ActionTypes.MOVE_CARDS,
        payload: {
          cards: [[topCard, 0, 0]],
          sourcePile: PileName.STOCK,
          targetPile: PileName.WASTE
        }
      });
    } else {
      for (const card of pile) {
        if (!card.up) {
          dispatch({
            type: ActionTypes.FLIP_CARD,
            payload: {
              cards: [[card, 0, 0]],
              targetPile: PileName.WASTE
            }
          });
        }
      }
    }
  }, [stock, waste]);

  useEffect(() => {
    const pile = stock[0];

    for (const card of pile) {
      if (card.up) {
        dispatch({
          type: ActionTypes.FLIP_CARD,
          payload: {
            cards: [[card, 0, 0]],
            targetPile: PileName.STOCK
          }
        });
      }
    }
  }, [stock]);

  const handleStockClick = (event) => {
    const mappedCards = waste[0].map((card) => [card, 0, 0]);
    const reversedWasteCards = _reverse(mappedCards);

    dispatch({
      type: ActionTypes.MOVE_CARDS,
      payload: {
        cards: reversedWasteCards,
        sourcePile: PileName.WASTE,
        targetPile: PileName.STOCK
      }
    });
  };

  const handleStockCardClick = (event, card) => {
    dispatch({
      type: ActionTypes.MOVE_CARDS,
      payload: {
        cards: [[card, 0, 0]],
        sourcePile: PileName.STOCK,
        targetPile: PileName.WASTE
      }
    });
  };

  const handleCardDoubleClick = (event, card, source) => {
    const [sourceName, sourceIndex] = source;
    const targetIndex = getFoundationTargetIndex(card);
    const { status, statusText } = isLowerRank([card], foundation[targetIndex]);

    if (status) {
      dispatch({
        type: ActionTypes.MOVE_CARDS,
        payload: {
          cards: [[card, sourceIndex, targetIndex]],
          sourcePile: sourceName,
          targetPile: PileName.FOUNDATION
        }
      });
    }

    setMessage(statusText);
  };

  const handleDrop = (event, target) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    const [targetName, targetIndex] = target;

    try {
      const json = JSON.parse(data);
      const [sourceName, sourceIndex] = json.source;


      const cards = json.cards;
      const mappedCards = cards.map((card) => [card, sourceIndex, targetIndex]);
      let validationResult = { status: true, statusText: '' };

      if (targetName === PileName.TABLEAU) {
        validationResult = isHigherRank(cards, tableau[targetIndex]);

        if (validationResult.status) {
          validationResult = isDifferentColor(cards, tableau[targetIndex]);
        }
      }

      if (targetName === PileName.FOUNDATION) {
        validationResult = isLowerRank(cards, foundation[targetIndex]);
      }

      const { status, statusText } = validationResult;

      if (status) {
      let moveResult = { 
        cards: mappedCards.map(card => {
        return { suit: card[0].suit, value: card[0].value }
        }), 
        src: sourceName + mappedCards[0][1], 
        dst: targetName + mappedCards[0][2]
      };

      console.log(moveResult);

        dispatch({
          type: ActionTypes.MOVE_CARDS,
          payload: {
            cards: mappedCards,
            sourcePile: sourceName,
            targetPile: targetName
          }
        });
      }

      setMessage(statusText);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
  const getGameState = async () => {
    const response = await fetch(`/v1/game/${match.params.id}`);
    const data = await response.json();
    setState({
      stock: [data.draw],
      waste: [data.discard],
      foundation: [data.stack1, data.stack2, data.stack3, data.stack4],
      tableau: [data.pile1,data.pile2,data.pile3,data.pile4,data.pile5,data.pile6,data.pile7],
      tableau1: [data.pile1,data.pile2,data.pile3,data.pile4,data.pile5,data.pile6,data.pile7],
      pile1: data.pile1,
      pile2: data.pile2,
      pile3: data.pile3,
      pile4: data.pile4,
      pile5: data.pile5,
      pile6: data.pile6,
      pile7: data.pile7,
      stack1: data.stack1,
      stack2: data.stack2,
      stack3: data.stack3,
      stack4: data.stack4,
      draw: data.draw,
      discard: data.discard
    });
    
    /*dispatch({
    type: ActionTypes.SET_INIT_VALUE,
      payload: {
        stock: [data.draw],
        waste: [data.discard],
        foundation: [data.stack1, data.stack2, data.stack3, data.stack4],
        tableau: [data.pile1,data.pile2,data.pile3,data.pile4,data.pile5,data.pile6,data.pile7],
      }
    });*/
  };
  getGameState();
  }, [match.params.id, stock, waste, foundation, tableau]);

  const onClick = ev => {
  let target = ev.target;
  };

  return (
  <GameBase>
    <CardRow>
    <Pile
      cards={foundation[0]}
      spacing={0}
      name={PileName.FOUNDATION}
      onDrop={handleDrop}
      key="foundation1"
    />
    <Pile
      cards={foundation[1]}
      spacing={0}
      name={PileName.FOUNDATION}
      onDrop={handleDrop}
      key="foundation2"
    />
    <Pile
      cards={foundation[2]}
      spacing={0}
      name={PileName.FOUNDATION}
      onDrop={handleDrop}
      key="foundation3"
    />
    <Pile
      cards={foundation[3]}
      spacing={0}
      name={PileName.FOUNDATION}
      onDrop={handleDrop}
      key="foundation4"
    />
    {/* <PileGroup 
      piles={[state.stack1,state.stack2,state.stack3,state.stack4]}
      spacing={0}
      onClick={onClick}
      name={PileName.FOUNDATION}
      onDrop={handleDrop}
    /> */}
    <CardRowGap />
    <Pile
      cards={stock[0]}
      spacing={0}
      name={PileName.STOCK}
      onPileClick={handleStockClick}
      onCardClick={handleStockCardClick}
      key="stock"
    />
    <Pile
      cards={waste[0]}
      spacing={0}
      name={PileName.WASTE}
      onCardDoubleClick={handleCardDoubleClick}
      key="waste"
    />
    {/* <PileGroup 
      piles={[state.draw]}
      spacing={0}
      onClick={onClick}
      name={PileName.STOCK}
      onPileClick={handleStockClick}
      onCardClick={handleStockCardClick}
      />
    <PileGroup 
      piles={[state.discard]}
      spacing={0}
      onClick={onClick}
      name={PileName.WASTE}
      onCardDoubleClick={handleCardDoubleClick}
    /> */}
    </CardRow>
    {/* <CardRow>
    <Pile cards={state.pile1} onClick={onClick} />
    <Pile cards={state.pile2} onClick={onClick} />
    <Pile cards={state.pile3} onClick={onClick} />
    <Pile cards={state.pile4} onClick={onClick} />
    <Pile cards={state.pile5} onClick={onClick} />
    <Pile cards={state.pile6} onClick={onClick} />
    <Pile cards={state.pile7} onClick={onClick} /> */}
    <PileGroup
      piles={tableau}
      name={PileName.TABLEAU}
      stackDown
      onDrop={handleDrop}
      onCardDoubleClick={handleCardDoubleClick}
    />
    {/* </CardRow> */}
{/* 
    <CardRow>
    <PileGroup
      name={PileName.FOUNDATION}
      piles={foundation}
      onDrop={handleDrop}
    />
    <CardRowGap />
    <PileGroup
      name={PileName.STOCK}
      piles={stock}
      onPileClick={handleStockClick}
      onCardClick={handleStockCardClick}
    />
    <PileGroup
      name={PileName.WASTE}
      piles={waste}
      onCardDoubleClick={handleCardDoubleClick}
    />
    </CardRow>
    <CardRow>
    <PileGroup
      name={PileName.TABLEAU}
      piles={tableau}
      stackDown
      onDrop={handleDrop}
      onCardDoubleClick={handleCardDoubleClick}
    />
    </CardRow> */}
  </GameBase>
  );
};

Game.propTypes = {
  match: PropTypes.object.isRequired
};
