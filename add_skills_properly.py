#!/usr/bin/env python3

# 这个脚本将正确地在原始 blockrain 代码中添加技能系统
# 避免了所有语法错误和重复闭包问题

import re

# 读取原始文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    original_content = f.read()

# 技能系统代码
skill_system_code = '''
    // 技能系统状态
    _skills: {
      skill1: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },
      skill2: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },
      skill3: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 }
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

    // 设置技能键盘控制
    _setupSkillControls: function() {
      var game = this;
      $(document).on('keydown', function(e) {
        if (e.which >= 49 && e.which <= 51) {
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
      
      this._$skill1Btn.toggleClass('disabled', this._skills.skill1.uses <= 0 || this._skills.skill1.cooldown > 0);
      this._$skill2Btn.toggleClass('disabled', this._skills.skill2.uses <= 0 || this._skills.skill2.cooldown > 0);
      this._$skill3Btn.toggleClass('disabled', this._skills.skill3.uses <= 0 || this._skills.skill3.cooldown > 0);
    },

    // 技能冷却计时器
    _startSkillCooldownTimer: function() {
      var game = this;
      setInterval(function() {
        if (game._skills.skill1.cooldown > 0) game._skills.skill1.cooldown--;
        if (game._skills.skill2.cooldown > 0) game._skills.skill2.cooldown--;
        if (game._skills.skill3.cooldown > 0) game._skills.skill3.cooldown--;
        game._updateSkillButtons();
      }, 1000);
    },

    // 使用技能
    useSkill: function(skillNum) {
      if (skillNum < 1 || skillNum > 3) return;
      
      var skill = this._skills['skill' + skillNum];
      if (skill.uses <= 0 || skill.cooldown > 0) return;
      
      skill.uses--;
      skill.cooldown = skill.maxCooldown;
      
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
      
      this._updateSkillButtons();
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
    },
'''

# 修改 _doStart 方法
old_do_start = '_doStart: function() {'
new_do_start = '''_doStart: function() {
    this._skills.skill1.uses = this._skills.skill1.maxUses;
    this._skills.skill1.cooldown = 0;
    this._skills.skill2.uses = this._skills.skill2.maxUses;
    this._skills.skill2.cooldown = 0;
    this._skills.skill3.uses = this._skills.skill3.maxUses;
    this._skills.skill3.cooldown = 0;
    this._updateSkillButtons();'''

# 修改 _create 方法
old_create = '_create: function() {'
new_create = '''_create: function() {
    this._createSkillButtons();
    this._setupSkillControls();
    this._startSkillCooldownTimer();'''

# 找到插件定义结束的位置
plugin_end_marker = '  });\n\n})(jQuery);'

# 合并代码
if plugin_end_marker in original_content:
    content_before_end, _ = original_content.split(plugin_end_marker, 1)
    final_content = content_before_end.rstrip() + '\n'
    final_content += skill_system_code.rstrip() + '\n'
    final_content += plugin_end_marker
else:
    print('无法找到插件结束标记')
    exit(1)

# 应用 _doStart 和 _create 方法的修改
final_content = final_content.replace(old_do_start, new_do_start)
final_content = final_content.replace(old_create, new_create)

# 写入最终文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w') as f:
    f.write(final_content)

print('技能系统已成功添加到 blockrain.jquery.src.js')
print('请现在测试游戏是否正常运行')
