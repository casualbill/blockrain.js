# 合并原始 blockrain 代码与技能系统
# 这个脚本会创建一个干净的、没有语法错误的文件

# 读取原始文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    content = f.read()

# 找到技能系统开始的位置
# 我们需要保留原始代码直到技能系统开始之前
skill_start_marker = '    // 技能按钮创建'

# 分离原始代码和技能代码
if skill_start_marker in content:
    original_code, skill_code = content.split(skill_start_marker, 1)
    # 移除原始代码末尾的多余闭包
    original_code = original_code.rstrip()
    # 找到原始代码的 _doStart 方法
    # 我们需要修改 _doStart 和 _create 方法
    
    print('成功分离原始代码和技能代码')
else:
    print('找不到技能系统开始标记')
    exit()

# 修改 _doStart 方法，添加技能重置
old_do_start = '''    /**
     * Start/Restart Game
     */
    start: function() {
      this._doStart();
      this.options.onStart.call(this.element);
    },

    restart: function() {
      this._doStart();
      this.options.onRestart.call(this.element);
    },'''

new_do_start = '''    /**
     * Start/Restart Game
     */
    start: function() {
      this._doStart();
      this.options.onStart.call(this.element);
    },

    restart: function() {
      this._doStart();
      this.options.onRestart.call(this.element);
    },'''

# 修改 _doStart 私有方法
old_do_start_private = '''  _doStart: function() {
    this._reset();
    this._start();
  },'''

new_do_start_private = '''  _doStart: function() {
    this._reset();
    this._start();
    // 重置技能状态
    this._skills = {
      skill1: { used: 0, max: 2, cooldown: 0, maxCooldown: 30 },
      skill2: { used: 0, max: 2, cooldown: 0, maxCooldown: 30 },
      skill3: { used: 0, max: 2, cooldown: 0, maxCooldown: 30 }
    };
    this._updateSkillButtons();
  },'''

# 修改 _create 方法
old_create = '''  _create: function() {'''

new_create = '''  _create: function() {
    this._createSkillButtons();
    this._setupSkillControls();
    this._startSkillCooldownTimer();'''

# 应用修改
modified_original = original_code.replace(old_do_start_private, new_do_start_private)
modified_original = modified_original.replace(old_create, new_create)

# 构建完整文件
final_content = modified_original.rstrip()
final_content += '\n\n    // 技能按钮创建\n'
final_content += skill_code

# 移除重复的闭包
final_content = final_content.replace('  });\n\n})(jQuery);', '')
final_content += '\n  });\n\n})(jQuery);'

# 写入新文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.fixed.js', 'w') as f:
    f.write(final_content)

print('修复完成！新文件已保存为 src/blockrain.jquery.fixed.js')
