(function($) {
  "use strict";

  $.widget('aerolab.blockrainVersus', {
    options: {
      player1Theme: 'retro',
      player2Theme: 'modern',
      difficulty: 'normal',
      speed: 20,
      onGameOver: function(winner) {}
    },

    _create: function() {
      this._initGameAreas();
      this._initControls();
      this._initStatus();
    },

    _initGameAreas: function() {
      var container = $('<div class="blockrain-versus-container"></div>');
      
      // Player 1 area
      this.player1Area = $('<div class="blockrain-player-area player1"></div>');
      this.player1Area.append('<h2 class="player-title">玩家 1</h2>');
      this.player1Game = $('<div class="blockrain-game"></div>');
      this.player1Area.append(this.player1Game);
      this.player1Score = $('<div class="player-score">分数: <span>0</span></div>');
      this.player1Area.append(this.player1Score);
      
      // Player 2 area
      this.player2Area = $('<div class="blockrain-player-area player2"></div>');
      this.player2Area.append('<h2 class="player-title">玩家 2</h2>');
      this.player2Game = $('<div class="blockrain-game"></div>');
      this.player2Area.append(this.player2Game);
      this.player2Score = $('<div class="player-score">分数: <span>0</span></div>');
      this.player2Area.append(this.player2Score);
      
      container.append(this.player1Area);
      container.append(this.player2Area);
      
      // Control instructions
      this.instructions = $('<div class="blockrain-instructions"></div>');
      this.instructions.html(`
        <div class="player1-controls">
          <h3>玩家 1 控制</h3>
          <p>← → 移动 | ↑ 旋转 | ↓ 加速</p>
        </div>
        <div class="player2-controls">
          <h3>玩家 2 控制</h3>
          <p>A D 移动 | W 旋转 | S 加速</p>
        </div>
      `);
      
      container.append(this.instructions);
      
      // Game status
      this.status = $('<div class="blockrain-status"></div>');
      container.append(this.status);
      
      // Play button
      this.playButton = $('<button class="blockrain-play-btn">开始游戏</button>');
      container.append(this.playButton);
      
      // Pause button
      this.pauseButton = $('<button class="blockrain-pause-btn" style="display:none;">暂停游戏</button>');
      container.append(this.pauseButton);
      
      // Resume button
      this.resumeButton = $('<button class="blockrain-resume-btn" style="display:none;">继续游戏</button>');
      container.append(this.resumeButton);
      
      // Winner display
      this.winnerDisplay = $('<div class="blockrain-winner" style="display:none;"></div>');
      container.append(this.winnerDisplay);
      
      this.element.append(container);
      
      // Initialize games
      this._initGames();
    },

    _initGames: function() {
      var self = this;
      
      // Initialize both games with speed 0 (we'll control the animation manually)
      this.game1 = this.player1Game.blockrain({
        theme: this.options.player1Theme,
        difficulty: this.options.difficulty,
        speed: 0,
        asdwKeys: false,
        onGameOver: function(score) {
          self._handleGameOver(1, score);
        },
        onLine: function(lines, scoreIncrement, totalScore) {
          self.player1Score.find('span').text(totalScore);
        }
      }).data('blockrain');
      
      this.game2 = this.player2Game.blockrain({
        theme: this.options.player2Theme,
        difficulty: this.options.difficulty,
        speed: 0,
        asdwKeys: false,
        onGameOver: function(score) {
          self._handleGameOver(2, score);
        },
        onLine: function(lines, scoreIncrement, totalScore) {
          self.player2Score.find('span').text(totalScore);
        }
      }).data('blockrain');
      
      // Store speed for manual animation control
      this.animationSpeed = this.options.speed;
      this.animationInterval = null;
    },

    _initControls: function() {
      var self = this;
      
      // Play button
      this.playButton.click(function() {
        self.start();
      });
      
      // Pause button
      this.pauseButton.click(function() {
        self.pause();
      });
      
      // Resume button
      this.resumeButton.click(function() {
        self.resume();
      });
      
      // Keyboard controls
      $(document).off('keydown.blockrain-versus');
      $(document).on('keydown.blockrain-versus', function(e) {
        if (self.gameStarted && !self.gamePaused) {
          switch(e.keyCode) {
            // Player 1 controls
            case 37: // Left arrow
              self.game1._board.cur.moveLeft();
              e.preventDefault();
              break;
            case 39: // Right arrow
              self.game1._board.cur.moveRight();
              e.preventDefault();
              break;
            case 38: // Up arrow
              self.game1._board.cur.rotate('right');
              e.preventDefault();
              break;
            case 40: // Down arrow
              self.game1._board.cur.drop();
              e.preventDefault();
              break;
            
            // Player 2 controls
            case 65: // A
              self.game2._board.cur.moveLeft();
              e.preventDefault();
              break;
            case 68: // D
              self.game2._board.cur.moveRight();
              e.preventDefault();
              break;
            case 87: // W
              self.game2._board.cur.rotate('right');
              e.preventDefault();
              break;
            case 83: // S
              self.game2._board.cur.drop();
              e.preventDefault();
              break;
            
            // Pause (Space)
            case 32:
              if (self.gameStarted) {
                if (self.gamePaused) {
                  self.resume();
                } else {
                  self.pause();
                }
                e.preventDefault();
              }
              break;
          }
        }
      });
    },

    _initStatus: function() {
      this.gameStarted = false;
      this.gamePaused = false;
      this.gameOver = false;
      this.pausedBy = null;
    },

    start: function() {
      this.gameStarted = true;
      this.gamePaused = false;
      this.gameOver = false;
      
      this.playButton.hide();
      this.pauseButton.show();
      this.resumeButton.hide();
      this.winnerDisplay.hide();
      
      // Start both games
      this.game1.start();
      this.game2.start();
      
      // Start manual animation loop
      var self = this;
      this.animationInterval = setInterval(function() {
        if (!self.gamePaused && !self.gameOver) {
          // Update both games simultaneously
          self.game1._board.animate();
          self.game2._board.animate();
        }
      }, this.animationSpeed);
      
      this.status.text('游戏进行中...');
    },

    pause: function() {
      if (this.gameStarted && !this.gameOver && !this.gamePaused) {
        this.gamePaused = true;
        this.pauseButton.hide();
        this.resumeButton.show();
        
        // Clear animation interval
        if (this.animationInterval) {
          clearInterval(this.animationInterval);
          this.animationInterval = null;
        }
        
        this.status.text('游戏已暂停');
      }
    },

    resume: function() {
      if (this.gameStarted && !this.gameOver && this.gamePaused) {
        this.gamePaused = false;
        this.pauseButton.show();
        this.resumeButton.hide();
        
        // Resume animation loop
        var self = this;
        this.animationInterval = setInterval(function() {
          if (!self.gamePaused && !self.gameOver) {
            // Update both games simultaneously
            self.game1._board.animate();
            self.game2._board.animate();
          }
        }, this.animationSpeed);
        
        this.status.text('游戏进行中...');
      }
    },

    _handleGameOver: function(loserPlayer, loserScore) {
      if (!this.gameOver) {
        this.gameOver = true;
        this.gameStarted = false;
        
        var winnerPlayer = loserPlayer === 1 ? 2 : 1;
        var winnerScore = winnerPlayer === 1 ? 
          this.game1._filled.score : this.game2._filled.score;
        
        // Clear animation interval
        if (this.animationInterval) {
          clearInterval(this.animationInterval);
          this.animationInterval = null;
        }
        
        // Show winner
        this.winnerDisplay.html(`
          <h2>游戏结束!</h2>
          <p>玩家 ${winnerPlayer} 获胜!</p>
          <p>玩家 1 分数: ${this.game1._filled.score}</p>
          <p>玩家 2 分数: ${this.game2._filled.score}</p>
          <button class="blockrain-restart-btn">重新开始</button>
        `);
        this.winnerDisplay.show();
        
        this.pauseButton.hide();
        this.resumeButton.hide();
        this.status.text('');
        
        // Restart button
        var self = this;
        this.winnerDisplay.find('.blockrain-restart-btn').click(function() {
          self.restart();
        });
        
        // Trigger callback
        this.options.onGameOver.call(this.element, winnerPlayer);
      }
    },

    restart: function() {
      // Clear any existing animation interval
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
      
      // Restart both games
      this.game1.restart();
      this.game2.restart();
      
      this.player1Score.find('span').text('0');
      this.player2Score.find('span').text('0');
      
      this.winnerDisplay.hide();
      this.playButton.show();
      this.pauseButton.hide();
      this.resumeButton.hide();
      
      this.status.text('');
      
      this._initStatus();
    },

    destroy: function() {
      $(document).off('keydown.blockrain-versus');
      
      // Clear animation interval
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
      
      this.game1.destroy();
      this.game2.destroy();
      this.element.empty();
      this._super();
    }
  });

})(jQuery);