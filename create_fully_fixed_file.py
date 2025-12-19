#!/usr/bin/env python3

# 创建一个完全修复的 blockrain 文件

# 读取备份文件内容
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.backup.js', 'r') as f:
    original_content = f.read()

# 技能系统代码
skill_system_code = '''
    // 技能系统状态初始化
    _create: function() {
      this._super();
      this._skills = {
        skill1: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },
        skill2: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },
        skill3: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 }
      };
      this._createSkillButtons();
      this._setupSkillControls();
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

    // 设置技能控制
    _setupSkillControls: function() {
      var game = this;
      $(document).keydown(function(e) {
        if (e.which >= 49 && e.which <= 51) {
          var skillNum = e.which - 48;
          game.useSkill(skillNum);
        }
      });
    },

    // 开始技能冷却计时器
    _startSkillCooldownTimer: function() {
      var game = this;
      setInterval(function() {
        for (var skill in game._skills) {
          if (game._skills[skill].cooldown > 0) {
            game._skills[skill].cooldown--;
          }
        }
        game._updateSkillButtons();
      }, 1000);
    },

    // 更新技能按钮状态
    _updateSkillButtons: function() {
      var updateButton = function(btn, skill) {
        btn.find('.skill-count').text(skill.uses);
        if (skill.uses <= 0 || skill.cooldown > 0) {
          btn.prop('disabled', true);
          btn.addClass('disabled');
        } else {
          btn.prop('disabled', false);
          btn.removeClass('disabled');
        }
      };
      
      updateButton(this._$skill1Btn, this._skills.skill1);
      updateButton(this._$skill2Btn, this._skills.skill2);
      updateButton(this._$skill3Btn, this._skills.skill3);
    },

    // 使用技能
    useSkill: function(skillNum) {
      if (skillNum < 1 || skillNum > 3) return;
      
      var skill = this._skills['skill' + skillNum];
      
      if (skill.uses > 0 && skill.cooldown <= 0) {
        skill.uses--;
        skill.cooldown = skill.maxCooldown;
        
        this['_useSkill' + skillNum]();
        
        this._updateSkillButtons();
      }
    },

    // 技能 1: 精准爆破
    _useSkill1: function() {
      var blocks = [];
      for (var i = 0; i < this._filled.data.length; i++) {
        if (this._filled.data[i]) blocks.push(i);
      }
      
      if (blocks.length > 0) {
        var idx = blocks[Math.floor(Math.random() * blocks.length)];
        this._filled.data[idx] = undefined;
        this._board.render(true);
      }
    },

    // 技能 2: 比例净化
    _useSkill2: function() {
      var blocks = [];
      for (var i = 0; i < this._filled.data.length; i++) {
        if (this._filled.data[i]) blocks.push(i);
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
            if (x < center) leftBlocks.push(block);
            else rightBlocks.push(block);
          }
        }
        
        for (var x = 0; x < this._BLOCK_WIDTH; x++) {
          this._filled.data[this._filled.asIndex(x, y)] = undefined;
        }
        
        for (var l = 0; l < leftBlocks.length; l++) {
          this._filled.data[this._filled.asIndex(l, y)] = leftBlocks[l];
        }
        
        for (var r = 0; r < rightBlocks.length; r++) {
          this._filled.data[this._filled.asIndex(this._BLOCK_WIDTH - 1 - r, y)] = rightBlocks[r];
        }
      }
      
      this._board.render(true);
    },'''

# 查找原始 _create 方法
old_create_pattern = '_create: function() {'

# 找到原始 _create 方法的位置
if old_create_pattern in original_content:
    start_pos = original_content.find(old_create_pattern)
    
    # 找到 _create 方法的结束位置
    temp = original_content[start_pos:]
    brace_count = 0
    end_pos = 0
    
    for i, char in enumerate(temp):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_pos = i + 1
                break
    
    # 提取原始 _create 方法
    old_create = original_content[start_pos:start_pos + end_pos]
    
    # 替换为新的 _create 方法和技能系统
    new_content = original_content.replace(old_create, skill_system_code)
    
    # 写入新文件
    with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w') as f:
        f.write(new_content)
    
    print('修复完成！技能系统已成功集成。')
else:
    print('未找到 _create 方法')
