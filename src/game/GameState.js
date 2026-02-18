export class GameState {
  constructor() {
    this.state = 'PLAYING'; // PLAYING, WIN, LOSE, PAUSED
    this.score = 0;
    this.startTime = Date.now();
  }

  playerDied() {
    this.state = 'LOSE';
  }

  enemyDied() {
    this.state = 'WIN';
    this.score += 1000; // Award points for defeating enemy
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.startTime = Date.now();
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  isPlaying() {
    return this.state === 'PLAYING';
  }

  getElapsedTime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getState() {
    return this.state;
  }
}
