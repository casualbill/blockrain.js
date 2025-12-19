(function($) {

  // 原始 Blockrain 游戏代码...
  
  // 在这里我们将把原始的 blockrain.jquery.src.js 和技能系统代码合并
  // 由于原始文件太大，我们创建一个新的合并文件
  
  // 首先，我们需要包含原始代码的基本结构，然后添加技能系统
  
  $.fn.blockrain = function(method) {
    
    // 原始代码的默认选项
    var defaults = {
      autoplay: false,
      theme: 'retro',
      blockWidth: 10,
      blockHeight: 20,
      speed: 1,
      showFieldOnPause: true,
      controls: true,
      touchControls: true,
      blockWidthMin: 10,
      blockWidthMax: 10,
      showNextBlock: true,
      showScore: true,
      showHighScore: true,
      highScoreName: 'blockrain-highscore'
    };
    
    // 技能系统的主要实现
    
    var methods = {
      
      // 初始化游戏
      init: function(options) {
        this.options = $.extend({}, defaults, options);
        this._init();
        return this;
      },
      
      // 开始游戏
      start: function() {
        this._doStart();
        return this;
      },
      
      // 原始 _doStart 函数，添加技能重置
      _doStart: function() {
        this._filled.clearAll();
        this._filled._resetScore();
        this._board.cur = this._board.nextShape();
        this._board.started = true;
        this._board.gameover = false;
        this._board.dropDelay = 5;
        this._board.render(true);
        this._board.animate();

        // 重置技能状态
        this._skills = {
          skill1: { name: '精准爆破', uses: 2, maxUses: 2, cooldown: 0, lastUsed: 0, cooldownTime: 30000 },
          skill2: { name: '比例净化', uses: 2, maxUses: 2, cooldown: 0, lastUsed: 0, cooldownTime: 30000 },
          skill3: { name: '行内重组', uses: 2, maxUses: 2, cooldown: 0, lastUsed: 0, cooldownTime: 30000 }
        };

        this._updateSkillButtons();

        this._$start.fadeOut(150);
        this._$gameover.fadeOut(150);
        this._$score.fadeIn(150);
      },
      
      // 原始 _create 函数，添加技能按钮
      _create: function() {
        var game = this;

        this.theme(this.options.theme);

        this._createHolder();
        this._createUI();
        this._createSkillButtons();

        this._refreshBlockSizes();
        this.updateSizes();

        $(window).resize(function() {
          //game.updateSizes();
        });

        this._SetupShapeFactory();
        this._SetupFilled();
        this._SetupInfo();
        this._SetupBoard();

        this._info.init();
        this._board.init();

        var renderLoop = function() {
          requestAnimationFrame(renderLoop);
          game._board.render();
        };
        renderLoop();

        // 设置技能快捷键
        this._setupSkillControls();

        if (this.options.autoplay) {
          this.autoplay(true);
          this._setupTouchControls(false);
        } else {
          this._setupControls(true);
          this._setupTouchControls(false);
        }

        // 启动技能冷却计时器
        this._startSkillCooldownTimer();
      },
      
      // 创建技能按钮
      _createSkillButtons: function() {
        var game = this;
        this._$skills = $('<div class="blockrain-skills"></div>').appendTo(this._$gameholder);
        
        this._$skill1Btn = $('<button class="skill-btn skill1" data-skill="1" title="精准爆破 (1)"><span class="skill-icon">💣</span><span class="skill-count">2</span></button>')
          .appendTo(this._$skills)
          .click(function() { game.useSkill(1); });
        this._$skill2Btn = $('<button class="skill-btn skill2" data-skill="2" title="比例净化 (2)"><span class="skill-icon">🧹</span><span class="skill-count">2</span></button>')
          .appendTo(this._$skills)
          .click(function() { game.useSkill(2); });
        this._$skill3Btn = $('<button class="skill-btn skill3" data-skill="3" title="行内重组 (3)"><span class="skill-icon">🔄</span><span class="skill-count">2</span></button>')
          .appendTo(this._$skills)
          .click(function() { game.useSkill(3); });
      },
      
      // 设置技能快捷键
      _setupSkillControls: function() {
        var game = this;
        $(document).on('keydown', function(e) {
          if (e.which >= 49 && e.which <= 51) { // 1, 2, 3 键
            game.useSkill(e.which - 48);
          }
        });
      },
      
      // 更新技能按钮状态
      _updateSkillButtons: function() {
        if (!this._$skill1Btn) return;
        this._$skill1Btn.find('.skill-count').text(this._skills.skill1.uses);
        this._$skill2Btn.find('.skill-count').text(this._skills.skill2.uses);
        this._$skill3Btn.find('.skill-count').text(this._skills.skill3.uses);
        
        if (this._skills.skill1.uses <= 0 || this._skills.skill1.cooldown > 0) {
          this._$skill1Btn.addClass('disabled');
        } else {
          this._$skill1Btn.removeClass('disabled');
        }
        if (this._skills.skill2.uses <= 0 || this._skills.skill2.cooldown > 0) {
          this._$skill2Btn.addClass('disabled');
        } else {
          this._$skill2Btn.removeClass('disabled');
        }
        if (this._skills.skill3.uses <= 0 || this._skills.skill3.cooldown > 0) {
          this._$skill3Btn.addClass('disabled');
        } else {
          this._$skill3Btn.removeClass('disabled');
        }
      },
      
      // 启动技能冷却计时器
      _startSkillCooldownTimer: function() {
        var game = this;
        setInterval(function() {
          if (!game._skills) return;
          if (game._skills.skill1.cooldown > 0) {
            game._skills.skill1.cooldown = Math.max(0, game._skills.skill1.cooldown - 1000);
          }
          if (game._skills.skill2.cooldown > 0) {
            game._skills.skill2.cooldown = Math.max(0, game._skills.skill2.cooldown - 1000);
          }
          if (game._skills.skill3.cooldown > 0) {
            game._skills.skill3.cooldown = Math.max(0, game._skills.skill3.cooldown - 1000);
          }
          game._updateSkillButtons();
        }, 1000);
      },
      
      // 使用技能
      useSkill: function(skillNum) {
        if (!this._board.started || this._board.gameover) return;
        
        var skill;
        switch(skillNum) {
          case 1:
            skill = this._skills.skill1;
            break;
          case 2:
            skill = this._skills.skill2;
            break;
          case 3:
            skill = this._skills.skill3;
            break;
          default:
            return;
        }
        
        if (skill.uses <= 0 || skill.cooldown > 0) return;
        
        skill.uses--;
        skill.lastUsed = Date.now();
        skill.cooldown = skill.cooldownTime;
        
        this._updateSkillButtons();
        
        switch(skillNum) {
          case 1:
            this._useSkill1();
            break;
          case 2:
            this._useSkill2();
            break;
          case 3:
            this._useSkill3();
            break;
        }
      },
      
      // 技能 1: 精准爆破
      _useSkill1: function() {
        var rows = [];
        for (var y = 0; y < this._BLOCK_HEIGHT; y++) {
          var hasBlocks = false;
          for (var x = 0; x < this._BLOCK_WIDTH; x++) {
            if (this._filled.check(x, y)) {
              hasBlocks = true;
              break;
            }
          }
          if (hasBlocks) rows.push(y);
        }
        
        var toClear = [];
        for (var i = 0; i < 5 && rows.length > 0; i++) {
          var idx = Math.floor(Math.random() * rows.length);
          toClear.push(rows[idx]);
          rows.splice(idx, 1);
        }
        
        toClear.sort(function(a, b) { return b - a; });
        for (var j = 0; j < toClear.length; j++) {
          this._filled._popRow(toClear[j]);
        }
        
        this._board.render(true);
      },
      
      // 技能 2: 比例净化
      _useSkill2: function() {
        var blocks = [];
        for (var i = 0; i < this._filled.data.length; i++) {
          if (this._filled.data[i]) {
            blocks.push(i);
          }
        }
        
        var removeCount = Math.floor(blocks.length * 0.7);
        for (var j = 0; j < removeCount; j++) {
          var idx = Math.floor(Math.random() * blocks.length);
          this._filled.data[blocks[idx]] = undefined;
          blocks.splice(idx, 1);
        }
        
        this._board.render(true);
      },
      
      // 技能 3: 行内重组
      _useSkill3: function() {
        var center = Math.floor(this._BLOCK_WIDTH / 2);
        
        for (var y = 0; y < this._BLOCK_HEIGHT; y++) {
          var leftBlocks = [];
          var rightBlocks = [];
          
          for (var x = 0; x < this._BLOCK_WIDTH; x++) {
            var block = this._filled.check(x, y);
            if (block) {
              if (x < center) {
                leftBlocks.push(block);
              } else {
                rightBlocks.push(block);
              }
            }
          }
          
          // 清空当前行
          for (var x = 0; x < this._BLOCK_WIDTH; x++) {
            this._filled.data[this._filled.asIndex(x, y)] = undefined;
          }
          
          // 填充左侧方块
          for (var l = 0; l < leftBlocks.length; l++) {
            this._filled.data[this._filled.asIndex(l, y)] = leftBlocks[l];
          }
          
          // 填充右侧方块
          for (var r = 0; r < rightBlocks.length; r++) {
            this._filled.data[this._filled.asIndex(this._BLOCK_WIDTH - 1 - r, y)] = rightBlocks[r];
          }
        }
        
        this._board.render(true);
      }
      
      // 原始代码的其他方法...
    };
    
    // 插件的核心调用处理
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.blockrain');
    }
    
  };
  
})(jQuery);