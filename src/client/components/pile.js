/* Copyright G. Hemingway, @2020 - All rights reserved */
'use strict';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import _noop from 'lodash/noop';
import _reverse from 'lodash/reverse';
import { PileProps, CardProps } from './definitions';

import CardElement from './cardelement';

const PileBase = styled.div`
  margin: 5px;
  position: relative;
  display: inline-block;
  border: dashed 2px #808080;
  border-radius: 5px;
  width: 12%;
`;

const PileFrame = styled.div`
  margin-top: 140%;
`;

export const Pile = ( props ) => {
  const {
    spacing = 12, 
    horizontal = false, 
    up, 

    name,
    cards = [], 
    index = 0,
    stackDown = false,
    onDrop = _noop,
    onCardClick,
    onCardDoubleClick,
    onClick = _noop
  } = props;

  const [isHover, setIsHover] = useState(false);

  let enterTarget = null;

  const handleDrop = (event) => {
    event.preventDefault();

    onDrop(event, [name, index]);
  };

  const handleDragEnter = (event) => {
    enterTarget = event.target;
    setIsHover(true);
  };

  const handleDragLeave = (event) => {
    if (enterTarget === event.target) {
      event.stopPropagation();
      event.preventDefault();
      setIsHover(false);
    }
  };

  const handleDragOver = (event) => {
    if ([...event.dataTransfer.types].includes('text/plain')) {
      // This is necessary so the element works as a drop target
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleClick = (event) => {
    if (cards.length === 0) {
      onClick(event, name);
    }
  };

  // Put cards into each other
  const renderStackedDownCards = () => {
    const reversedCards = _reverse([...cards]);

    return reversedCards.reduce((lastCard, card, i, cds) => {  
  
      const top = horizontal ? 0 : (reversedCards.length-1-i) * spacing;
      const left = horizontal ? (reversedCards.length-1-i) * spacing : 0;
      
      const cardProps = {   
        key: i, 
        up: up, 
        top: top, 
        left: left, 

        card: card,
        childCards: cds.slice(0, i),
        source: [name, index],
        isBottom: (reversedCards.length - 1) === i,
        isTop: false,
        isStackDown: true,
        // key: card.id,
        onClick: onCardClick,
        onDoubleClick: onCardDoubleClick
      };

      if (lastCard) {
        cardProps.children = lastCard;
      } else {
        cardProps.isTop = true;
      }

      return <CardElement {...cardProps} />;
    }, null);
  };

  const renderStackedUpCards = () => cards.map((card, i) => {
    
    const top = horizontal ? 0 : i * spacing;
    const left = horizontal ? i * spacing : 0;
    
    return (
      <CardElement
        
        key={i}
        card={card}
        up={up}
        top={top}
        left={left}
        source={[name, index]}
        isBottom={i === 0}
        isTop={(cards.length - 1) === i}
        onClick={onCardClick}
        onDoubleClick={onCardDoubleClick}
    />
    )
  });


  const children = cards.map((card, i) => {
    const top = horizontal ? 0 : i * spacing;
    const left = horizontal ? i * spacing : 0;
    return (
      <CardElement
        key={i}
        card={card}
        up={up}
        top={top}
        left={left}
        onClick={onClick}
      />
    );
  });

  return (
    <PileBase
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <PileFrame />
      {/* {children} */}
      {stackDown ? renderStackedDownCards() : renderStackedUpCards()}
    </PileBase>
  );
};

Pile.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClick: PropTypes.func,
  horizontal: PropTypes.bool,
  spacing: PropTypes.number,
  maxCards: PropTypes.number,
  top: PropTypes.number,
  left: PropTypes.number
};
Pile.defaultProps = {
  horizontal: false, // Layout horizontal?
  spacing: 12, // In percent,
  cards: []
};

export default Pile;