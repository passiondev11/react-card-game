import { Suit, Color } from './definitions';

class Card {
  constructor(suit, value, up = false) { 
    this.suit = suit;
    this.value = value;
    this.up = up;

    this.color = this.color();
    this.id = this.id();
  }

  color() {
    if (this.suit === Suit.Diamond || this.suit === Suit.Heart) {
      return Color.RED;
    }

    return Color.BLACK;
  }

  id() {
    return `${this.suit}_${this.value}`;
  }

  reveal() {
    this.up = true;
  }

  hide() {
    this.up = false;
  }

  flip() {
    this.up = !this.up;
  }
}

export default Card;