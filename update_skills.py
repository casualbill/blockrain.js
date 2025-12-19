#!/usr/bin/env python3

# 读取原始文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改 _doStart 函数
old_doStart = '''    _doStart: function() {
      this._filled.clearAll();
      this._filled._resetScore();
      this._board.cur = this._board.nextShape();
      this._board.started = true;
      this._board.gameover = false;
      this._board.dropDelay = 5;
      this._board.render(true);
      this._board.animate();

      this._$start.fadeOut(150);
      this._$gameover.fadeOut(150);
      this._$score.fadeIn(150);
    },'''

new_doStart = '''    _doStart: function() {
      this._filled.clearAll();
      this._filled._resetScore();
      this._board.cur = this._board.nextShape();
      this._board.started = true;
      this._board.gameover = false;
      this._board.dropDelay = 5;
      this._board.render(true);
      this._board.animate();

      // Reset skills on game start/restart
      this._skills = {
        skill1: { name: '精准爆破', uses: 2, maxUses: 2, cooldown: 0, lastUsed: 0, cooldownTime: 30000 },
        skill2: { name: '比例净化', uses: 2, maxUses: 2, cooldown: 0, lastUsed: 0, cooldownTime: 30000 },
        skill3: { name: '行内重组', uses: 2, maxUses: 2, cooldown: 0, lastUsed: 0, cooldownTime: 30000 }
      };

      this._updateSkillButtons();

      this._$start.fadeOut(150);
      this._$gameover.fadeOut(150);
      this._$score.fadeIn(150);
    },'''

content = content.replace(old_doStart, new_doStart)

# 修改 _create 函数
old_create = '''    _create: function() {

      var game = this;

      this.theme(this.options.theme);

      this._createHolder();
      this._createUI();

      this._refreshBlockSizes();

      this.updateSizes();

      $(window).resize(function(){
        //game.updateSizes();
      });

      this._SetupShapeFactory();
      this._SetupFilled();
      this._SetupInfo();
      this._SetupBoard();

      this._info.init();
      this._board.init();

      var renderLoop = function(){
        requestAnimationFrame(renderLoop);
        game._board.render();
      };
      renderLoop();

      if( this.options.autoplay ) {
        this.autoplay(true);
        this._setupTouchControls(false);
      } else {
        this._setupControls(true);
        this._setupTouchControls(false);
      }

    },'''

new_create = '''    _create: function() {

      var game = this;

      this.theme(this.options.theme);

      this._createHolder();
      this._createUI();
      this._createSkillButtons();

      this._refreshBlockSizes();

      this.updateSizes();

      $(window).resize(function(){
        //game.updateSizes();
      });

      this._SetupShapeFactory();
      this._SetupFilled();
      this._SetupInfo();
      this._SetupBoard();

      this._info.init();
      this._board.init();

      var renderLoop = function(){
        requestAnimationFrame(renderLoop);
        game._board.render();
      };
      renderLoop();

      // Setup skill keyboard shortcuts
      this._setupSkillControls();

      if( this.options.autoplay ) {
        this.autoplay(true);
        this._setupTouchControls(false);
      } else {
        this._setupControls(true);
        this._setupTouchControls(false);
      }

      // Start skill cooldown timer
      this._startSkillCooldownTimer();
    },'''

content = content.replace(old_create, new_create)

# 保存修改后的文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('文件更新完成！')
