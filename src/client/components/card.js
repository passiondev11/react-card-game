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
    const names = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

    return `${this.suit}_${names[this.value - 1]}`;
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