/* Shared game constants and simple enums */
'use strict';

const TILE = 40;
const PLAYER_X = 200;
const GRAVITY = 1900;   // px/s²
const JUMP_VEL = -720;  // px/s (cube jump impulse)

const GameState = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  DEAD: 'dead',
  VICTORY: 'victory',
});

