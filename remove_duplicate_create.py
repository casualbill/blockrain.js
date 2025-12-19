#!/usr/bin/env python3

# 移除重复的 _create 方法

with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    content = f.read()

# 移除重复的 _create 方法
duplicate_create = '''
    // 重写 _create 方法以添加技能
    _create: function() {
      this._super();
      this._createSkillButtons();
      this._setupSkillControls();
      this._startSkillCooldownTimer();
    }'''

content = content.replace(duplicate_create, '')

# 写入修复后的文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w') as f:
    f.write(content)

print('重复的 _create 方法已移除！')
