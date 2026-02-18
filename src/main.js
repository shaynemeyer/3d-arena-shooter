import { Game } from './game/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Get canvas element
    const canvas = document.getElementById('game-canvas');

    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Create and start game
    console.log('Initializing game...');
    const game = new Game(canvas);

    // Start game loop
    game.start();

    console.log('Game started successfully!');
    console.log('Controls:');
    console.log('  Arrow Up/Down - Move forward/backward');
    console.log('  Arrow Left/Right - Strafe left/right');
    console.log('  Spacebar - Shoot');

    // Handle visibility change (pause when tab not active)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab is hidden
        console.log('Game paused (tab hidden)');
      } else {
        // Tab is visible again
        console.log('Game resumed');
      }
    });

  } catch (error) {
    console.error('Failed to initialize game:', error);
    alert('Failed to start game. Please check the console for details.');
  }
});
