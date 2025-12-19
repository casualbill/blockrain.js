# 这个脚本会创建一个干净的、没有语法错误的 blockrain 源文件
# 包含技能系统的所有功能

import os

# 读取原始文件的前 1800 行（不含技能系统的干净代码）
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    lines = f.readlines()

# 找到 _doStart 方法的位置
# 我们需要找到并修改它
clean_lines = []
found_do_start = False
found_create = False

for line in lines:
    if '_doStart: function() {' in line:
        # 替换 _doStart 方法
        clean_lines.append('  _doStart: function() {\n')
        clean_lines.append('    this._reset();\n')
        clean_lines.append('    this._start();\n')
        clean_lines.append('    // 重置技能状态\n')
        clean_lines.append('    this._skills = {\n')
        clean_lines.append('      skill1: { used: 0, max: 2, cooldown: 0, maxCooldown: 30 },\n')
        clean_lines.append('      skill2: { used: 0, max: 2, cooldown: 0, maxCooldown: 30 },\n')
        clean_lines.append('      skill3: { used: 0, max: 2, cooldown: 0, maxCooldown: 30 }\n')
        clean_lines.append('    };\n')
        clean_lines.append('    this._updateSkillButtons();\n')
        clean_lines.append('  },\n')
        found_do_start = True
    elif '_create: function() {' in line:
        # 替换 _create 方法
        clean_lines.append('  _create: function() {\n')
        clean_lines.append('    this._super();\n')
        clean_lines.append('    this._createSkillButtons();\n')
        clean_lines.append('    this._setupSkillControls();\n')
        clean_lines.append('    this._startSkillCooldownTimer();\n')
        found_create = True
    elif not found_do_start or not found_create or ('// 技能按钮创建' not in line):
        # 保留其他行，直到找到技能系统开始标记
        clean_lines.append(line)

# 现在添加技能系统代码
skill_code = '''
    // 技能按钮创建
    _createSkillButtons: function() {
      this._skillButtons = {};
      var skillContainer = $('<div class="skill-buttons"></div>').appendTo(this._ui);
      
      // 技能 1: 精准爆破
      this._skillButtons.skill1 = $('<button class="skill-btn skill1" data-skill="1">🎯 精准爆破 (剩余: 2)</button>')
        .appendTo(skillContainer)
        .on('click', $.proxy(function() {
          this._useSkill1();
        }, this));
      
      // 技能 2: 比例净化
      this._skillButtons.skill2 = $('<button class="skill-btn skill2" data-skill="2">🧹 比例净化 (剩余: 2)</button>')
        .appendTo(skillContainer)
        .on('click', $.proxy(function() {
          this._useSkill2();
        }, this));
      
      // 技能 3: 行内重组
      this._skillButtons.skill3 = $('<button class="skill-btn skill3" data-skill="3">🔄 行内重组 (剩余: 2)</button>')
        .appendTo(skillContainer)
        .on('click', $.proxy(function() {
          this._useSkill3();
        }, this));
    },

    // 技能控制设置
    _setupSkillControls: function() {
      $(document).on('keydown.blockrain-skills', $.proxy(function(e) {
        switch(e.which) {
          case 49: // 数字键 1
            this._useSkill1();
            break;
          case 50: // 数字键 2
            this._useSkill2();
            break;
          case 51: // 数字键 3
            this._useSkill3();
            break;
        }
      }, this));
    },

    // 更新技能按钮状态
    _updateSkillButtons: function() {
      for (var skill in this._skillButtons) {
        var btn = this._skillButtons[skill];
        var skillData = this._skills[skill];
        
        btn.text(btn.text().replace(/剩余: \d+/, '剩余: ' + (skillData.max - skillData.used)));
        
        if (skillData.used >= skillData.max || skillData.cooldown > 0) {
          btn.prop('disabled', true);
          btn.addClass('disabled');
        } else {
          btn.prop('disabled', false);
          btn.removeClass('disabled');
        }
      }
    },

    // 技能冷却计时器
    _startSkillCooldownTimer: function() {
      setInterval($.proxy(function() {
        for (var skill in this._skills) {
          if (this._skills[skill].cooldown > 0) {
            this._skills[skill].cooldown--;
          }
        }
        this._updateSkillButtons();
      }, this), 1000);
    },

    // 技能 1: 精准爆破
    _useSkill1: function() {
      if (this._skills.skill1.used >= this._skills.skill1.max || this._skills.skill1.cooldown > 0) return;
      
      // 找到随机一个已填充的方块并清除
      var blocks = [];
      for (var i = 0; i < this._filled.data.length; i++) {
        if (this._filled.data[i]) {
          blocks.push(i);
        }
      }
      
      if (blocks.length > 0) {
        var randomIndex = blocks[Math.floor(Math.random() * blocks.length)];
        this._filled.data[randomIndex] = undefined;
        this._board.render(true);
        this._skills.skill1.used++;
        this._skills.skill1.cooldown = this._skills.skill1.maxCooldown;
        this._updateSkillButtons();
      }
    },

    // 技能 2: 比例净化
    _useSkill2: function() {
      if (this._skills.skill2.used >= this._skills.skill2.max || this._skills.skill2.cooldown > 0) return;
      
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
      this._skills.skill2.used++;
      this._skills.skill2.cooldown = this._skills.skill2.maxCooldown;
      this._updateSkillButtons();
    },

    // 技能 3: 行内重组
    _useSkill3: function() {
      if (this._skills.skill3.used >= this._skills.skill3.max || this._skills.skill3.cooldown > 0) return;
      
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
      this._skills.skill3.used++;
      this._skills.skill3.cooldown = this._skills.skill3.maxCooldown;
      this._updateSkillButtons();
    },
'''

# 找到原始文件中最后一个方法的结束位置，在添加技能代码前关闭原始方法
# 我们需要找到正确的位置来插入技能代码
# 首先，找到最后一个方法结束的位置
insert_position = len(clean_lines)
for i in range(len(clean_lines)-1, 0, -1):
    if '  });' in clean_lines[i] or '});' in clean_lines[i]:
        insert_position = i
        break

# 插入技能代码
clean_lines.insert(insert_position, skill_code)

# 确保最后正确关闭闭包
final_content = ''.join(clean_lines)
# 移除所有重复的闭包
final_content = final_content.replace('  });\n\n})(jQuery);', '')
final_content = final_content.rstrip() + '\n  });\n\n})(jQuery);\n'

# 写入新文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.fixed.js', 'w') as f:
    f.write(final_content)

print('干净的文件已创建完成！')
print('请将 src/blockrain.jquery.src.js 替换为 src/blockrain.jquery.fixed.js')
