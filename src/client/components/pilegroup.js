import React from 'react';
import Pile from './pile';
import styled from 'styled-components';

const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

const PileGroup = (props) => {
    const {
      piles = [],
      name,
      stackDown,
      onDrop,
      onCardClick,
      onCardDoubleClick,
      onPileClick
    } = props;

    return (
      <CardRow>
        {piles.map((pile, i) => (
          <Pile
            name={name}
            cards={pile}
            index={i}
            stackDown={stackDown}
            onClick={onPileClick}
            onDrop={onDrop}
            onCardClick={onCardClick}
            onCardDoubleClick={onCardDoubleClick}
            key={i}
          />
        ))}
      </CardRow>
    );
};

export default PileGroup;
