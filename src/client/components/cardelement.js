/* Copyright G. Hemingway, @2020 - All rights reserved */
'use strict';

import React, { useState, createRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import _noop from 'lodash/noop';
import _reverse from 'lodash/reverse';
import { CardProps, CardTransferObject, PileName } from './definitions';

const CardElementDiv = styled.div`
  label: Card;
  cursor: ${props=>props.cursorStyle};
  ${props=>props.isHover && props.card.up && `
    transform: scale(1.08);
    top: 0;
    left: 0;
    position: absolute;
    height: 100%;
    width: 100%;
  `}
`;

const CardImg = styled.img`
  position: absolute;
  height: auto;
  width: 100%;
`;

const CardElement = (props) => {

  const {
    card,
    top,
    left,
    childCards = [],
    source,
    isTop = false,
    isBottom = false,
    isStackDown = false,
    children,
    onClick = _noop,
    onDoubleClick = _noop
  } = props;
  
  const imgsource = card.up
    ? `/images/${card.value}_of_${card.suit}.png`
    : '/images/face_down.jpg';
  const style = { left: `${left}%`, top: `${top}%` };
  const id = `${card.suit}:${card.value}`;

  const ref = createRef();

  const [isDragging, setIsDragging] = useState(false);

  const [isHover, setIsHover] = useState(false);

  const [sourceName] = source;

  let cursorStyle = 'pointer';

  if (!card.up && sourceName !== PileName.STOCK) {
    cursorStyle = 'not-allowed';
  } else if (card.up) {
    cursorStyle = 'grab';
  }


  const handleMouseOver = (event) => {
  if (event && event.target === ref.current) {
    setIsHover(true);
  }
  };

  const handleMouseLeave = (event) => {
    if (event && event.target === ref.current) {
      setIsHover(false);
    }
  };

  const handleClick = (event) => {
    if (isTop) {
      onClick(event, card, source);
    }
  };

  const handleDoubleClick = (event) => {
    if (isTop) {
      onDoubleClick(event, card, source);
    }
  };

  const handleDragStart = (event) => {
    if (event && event.target === ref.current && event.dataTransfer) {
      const grabbedCards = _reverse([...childCards, card]);
      const payload = {
        source: source,
        cards: grabbedCards
      };
      event.dataTransfer.setData('text/plain', JSON.stringify(payload));
      event.dataTransfer.effectAllowed = 'move';
      setIsDragging(true);
    }
  };

  const handleDragEnd = (event) => {
    setIsDragging(false);
  };

  return (
    <CardElementDiv
      cursorStyle={cursorStyle}
      isHover={isHover}
      card={card}
    >
      <CardImg 
        id={id} 
        ref={ref}
        style={style} 
        src={imgsource} 

        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseOver={handleMouseOver}
        onFocus={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        onMouseOut={handleMouseLeave}
        onBlur={handleMouseLeave}
      />
      {children}
    </CardElementDiv>
  );
};

export default CardElement;