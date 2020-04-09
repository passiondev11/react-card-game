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
    "draw discard . stack stack stack stack"
    "pile pile pile pile pile pile pile";

  @media (max-width: 768px) {
    grid-template-columns: auto 1fr;
    grid-template-rows: repeat(7, 1fr);
    grid-template-areas:
      "draw pile"
      "discard pile"
      ". pile"
      "stack pile"
      "stack pile"
      "stack pile"
      "stack pile";
    padding-bottom: 100px;
  }
`;


export const Game = (props /*{ match }*/) => {
  const {
    match
  } = props;
  
  const initialState = { draw: [[]], discard: [[]], stack: [[],[],[],[]], pile: [[],[],[],[],[],[],[]]};

  let [state, setState] = useState({
    draw: [], 
    discard: [], 
    stack: [], 
    pile: [],
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
  draw, discard, stack, pile
  }, dispatch] = useReducer(reducer, initialState);
  
  const [message, setMessage] = useState('');

  const isDone = useMemo(() => {

    const allCards = _flattenDeep([...draw, ...discard, ...stack]);
    const up = _every(allCards, (card) => card.up);
    const isStockAndWasteEmpty = draw[0].length === 0 && discard[0].length === 0;
    return isStockAndWasteEmpty && up;
  }, [stack, draw, discard]);

  const isFinished = useMemo(() => {
    const allTableauCards = _flattenDeep(stack);
    return allTableauCards.length === cardCount;
  }, [stack]);

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
    pile.forEach((pile, i) => {
      const topCard = _last(pile);

      if (topCard && !topCard.up) {
        dispatch({
          type: ActionTypes.FLIP_CARD,
          payload: {
            cards: [[topCard, i, i]],
            targetPile: PileName.PILE
          }
        });
      }
    });
  }, [pile]);

  useEffect(() => {
    const pile = discard[0];
    const topCard = _last(draw[0]);
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
  }, [draw, discard]);

  useEffect(() => {
    const pile = draw[0];

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
  }, [draw]);
  const handleStockClick = (event) => {
    const mappedCards = discard[0].map((card) => [card, 0, 0]);
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

  const sendMoveRequest = (mappedCards, sourceName, targetName) => {
    let srcName = (sourceName == "draw" || sourceName == "discard") ? sourceName : sourceName + (mappedCards[0][1]+1);
    let tgtName = (targetName == "draw" || targetName == "discard") ? targetName : targetName + (mappedCards[0][2]+1);
    let moveResult = { 
      cards: mappedCards.map(card => {
        return { suit: card[0].suit, value: card[0].value, up: card[0].up }
      }), 
      src: srcName, 
      dst: tgtName
    };

    console.log(moveResult);
    
    fetch(`/v1/game/${match.params.id}`, {
      method: 'PUT',
      body: JSON.stringify(moveResult),
      headers: {
          'Content-type': 'application/json; charset=UTF-8'
      }
    })
    .then(res => {
      if (res.status == 401) {
        console.log('Unauthorized.');
      } else if (res.status == 404) {
          console.log(`Can't reach to server.`);
      }
      return res.json();
    })
    .then(data => {
      console.log(data);
      console.log("mapdata:"+mappedCards);
      if(data.ok) {
        dispatch({
          type: ActionTypes.MOVE_CARDS,
          payload: {
            cards: mappedCards,
            sourcePile: sourceName,
            targetPile: targetName
          }
        });
      }
    })
    .catch(err => console.log(err));
  }

  const handleStockCardClick = (event, card) => {
    sendMoveRequest([[card, 0, 0]], PileName.STOCK, PileName.WASTE);
  };

  const handleCardDoubleClick = (event, card, source) => {
    const [sourceName, sourceIndex] = source;
    let targetIndex = getFoundationTargetIndex(card);
    const { status, statusText } = isLowerRank([card], stack[targetIndex]);

    if (status) {
      sendMoveRequest([[card, sourceIndex, targetIndex]], sourceName, PileName.STACK);
    } else {
      for (targetIndex = 0; targetIndex < 7; targetIndex++) {
        if (PileName.PILE == sourceName && targetIndex == sourceIndex) continue;
        let valid = (pile[targetIndex].length == 0) || 
                    (isHigherRank([card], pile[targetIndex]).status && 
                    isDifferentColor([card], pile[targetIndex]).status);

        if (valid) {
          sendMoveRequest([[card, sourceIndex, targetIndex]], sourceName, PileName.PILE);
          break;
        }
      }
      setMessage(statusText);
    }
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

      if (targetName === PileName.PILE) {

        validationResult = isHigherRank(cards, pile[targetIndex]);

        if (validationResult.status) {
          validationResult = isDifferentColor(cards, pile[targetIndex]);
        }
      }

      if (targetName === PileName.STACK) {
        validationResult = isLowerRank(cards, stack[targetIndex]);
      }

      const { status, statusText } = validationResult;

      if (status) {
        sendMoveRequest(mappedCards, sourceName, targetName);
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
        draw: [data.draw],
        discard: [data.discard],
        stack: [data.stack1, data.stack2, data.stack3, data.stack4],
        pile: [data.pile1,data.pile2,data.pile3,data.pile4,data.pile5,data.pile6,data.pile7],
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
      
      dispatch({
      type: ActionTypes.SET_INIT_VALUE,
        payload: {
          draw: [data.draw],
          discard: [data.discard],
          stack: [data.stack1, data.stack2, data.stack3, data.stack4],
          pile: [data.pile1,data.pile2,data.pile3,data.pile4,data.pile5,data.pile6,data.pile7],
        }
      });
    };
    getGameState();
  }, [match.params.id]);

  const onClick = ev => {
    let target = ev.target;
  };

  return (
  <GameBase>
    <CardRow>
    <Pile
      cards={stack[0]}
      spacing={0}
      name={PileName.STACK}
      onDrop={handleDrop}
      key="foundation1"
    />
    <Pile
      cards={stack[1]}
      spacing={0}
      name={PileName.STACK}
      onDrop={handleDrop}
      key="foundation2"
    />
    <Pile
      cards={stack[2]}
      spacing={0}
      name={PileName.STACK}
      onDrop={handleDrop}
      key="foundation3"
    />
    <Pile
      cards={stack[3]}
      spacing={0}
      name={PileName.STACK}
      onDrop={handleDrop}
      key="foundation4"
    />
    {/* <PileGroup 
      piles={stack}
      spacing={0}
      onClick={onClick}
      name={PileName.STACK}
      onDrop={handleDrop}
    /> */}
    <CardRowGap />
    <Pile
      cards={draw[0]}
      spacing={0}
      name={PileName.STOCK}
      onClick={handleStockClick}
      onPileClick={handleStockClick}
      onCardClick={handleStockCardClick}
      key="draw"
    />
    <Pile
      cards={discard[0]}
      spacing={0}
      name={PileName.WASTE}
      onCardDoubleClick={handleCardDoubleClick}
      key="discard"
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
      piles={pile}
      name={PileName.PILE}
      stackDown
      onDrop={handleDrop}
      onCardDoubleClick={handleCardDoubleClick}
    />
    {/* </CardRow> */}
{/* 
    <CardRow>
    <PileGroup
      name={PileName.STACK}
      piles={stack}
      onDrop={handleDrop}
    />
    <CardRowGap />
    <PileGroup
      name={PileName.STOCK}
      piles={draw}
      onPileClick={handleStockClick}
      onCardClick={handleStockCardClick}
    />
    <PileGroup
      name={PileName.WASTE}
      piles={discard}
      onCardDoubleClick={handleCardDoubleClick}
    />
    </CardRow>
    <CardRow>
    <PileGroup
      name={PileName.PILE}
      piles={pile}
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
