#!/usr/bin/env python3

# 修复对象定义中的逗号缺失错误

with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    content = f.read()

# 修复 _create 方法后的逗号问题
old_code = '''    }


    // 创建技能按钮'''

new_code = '''    },

    // 创建技能按钮'''

content = content.replace(old_code, new_code)

# 写入修复后的文件
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w') as f:
    f.write(content)

print('逗号错误修复完成！')
