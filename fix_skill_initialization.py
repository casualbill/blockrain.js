#!/usr/bin/env python3

# 修复技能系统初始化位置错误

with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    content = f.read()

# 移除 _skills 的直接定义
content = content.replace('    // 技能系统状态\n    _skills: {\n      skill1: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },\n      skill2: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },\n      skill3: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 }\n    },\n', '')

# 在 _create 方法中初始化技能系统
old_create_method = '''    _create: function() {
    this._createSkillButtons();
    this._setupSkillControls();
    this._startSkillCooldownTimer();'''

new_create_method = '''    _create: function() {
    this._skills = {
      skill1: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },
      skill2: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 },
      skill3: { uses: 2, maxUses: 2, cooldown: 0, maxCooldown: 30 }
    };
    this._createSkillButtons();
    this._setupSkillControls();
    this._startSkillCooldownTimer();'''

content = content.replace(old_create_method, new_create_method)

# 写入修复后的文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w') as f:
    f.write(content)

print('技能系统初始化修复完成！')
