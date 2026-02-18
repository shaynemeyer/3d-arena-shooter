export class HUD {
  constructor() {
    // Get HUD elements
    this.healthBar = document.getElementById('health-bar');
    this.ammoText = document.getElementById('ammo-text');
    this.enemyHealthBar = document.getElementById('enemy-health-bar');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.gameOverTitle = document.getElementById('game-over-title');
    this.gameOverMessage = document.getElementById('game-over-message');

    console.log('HUD elements:', {
      healthBar: this.healthBar,
      ammoText: this.ammoText,
      enemyHealthBar: this.enemyHealthBar,
      gameOverOverlay: this.gameOverOverlay
    });
  }

  update(player, enemy, gameState) {
    // Update player health bar
    const healthPercent = (player.health / player.maxHealth) * 100;
    this.healthBar.style.width = `${healthPercent}%`;

    // Update ammo counter
    this.ammoText.textContent = `Ammo: ${player.ammo}/${player.maxAmmo}`;

    // Update enemy health bar
    const enemyHealthPercent = (enemy.health / enemy.maxHealth) * 100;
    this.enemyHealthBar.style.width = `${enemyHealthPercent}%`;
  }

  showGameOver(won) {
    this.gameOverOverlay.classList.remove('hidden');

    if (won) {
      this.gameOverTitle.textContent = 'Victory!';
      this.gameOverTitle.className = 'win';
      this.gameOverMessage.textContent = 'You defeated the enemy!';
    } else {
      this.gameOverTitle.textContent = 'Game Over';
      this.gameOverTitle.className = 'lose';
      this.gameOverMessage.textContent = 'You were defeated...';
    }
  }

  hideGameOver() {
    this.gameOverOverlay.classList.add('hidden');
  }
}
