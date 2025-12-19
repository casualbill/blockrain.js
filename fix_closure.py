# 修复 blockrain.jquery.src.js 文件末尾的重复闭包问题
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'r') as f:
    content = f.read()

# 查找并修复重复的闭包代码
# 原始文件末尾有重复的 })(jQuery); 语句
# 我们需要保留一个正确的闭包结束

# 移除所有重复的闭包语句
fixed_content = content.replace('  });\n\n})(jQuery);\n  });\n\n})(jQuery);', '  });\n\n})(jQuery);')

# 写入修复后的内容
with open('/Users/casmbp21/Documents/ai-app/code/blockrain-ws/blockrain-w11-s2/src/blockrain.jquery.src.js', 'w') as f:
    f.write(fixed_content)

print('闭包问题修复完成！')