# Blockrain - Color Elimination Mode

## 功能介绍

Blockrain现在支持颜色消除模式，这是一种新的游戏模式，与经典的行消除模式并存。在颜色消除模式下，当某一颜色的方块数量超过10个时，该颜色的所有方块会被自动清除，上方的方块会受重力影响下落补空。

## 主要特性

1. **颜色选择**：游戏开始时从当前主题中随机选择4-8种不同颜色
2. **同色消除**：当某一颜色的已落地方块数量超过10个时，自动清除该颜色所有方块
3. **重力效果**：消除方块后，上方的方块会受重力影响下落并补空
4. **可选开关**：颜色消除模式可以通过选项启用或禁用，不影响原有的行消除逻辑
5. **独立计分**：颜色消除有独立的计分系统，每个消除的方块得100分

## 如何使用

### 启用颜色消除模式

在初始化Blockrain游戏时，设置`colorElimination`选项为`true`：

```javascript
$('#game').blockrain({
    theme: 'modern',
    colorElimination: true, // 启用颜色消除模式
    colorCount: 6, // 选择6种颜色（4-8之间）
    // 其他选项...
});
```

### 动态切换模式

你也可以在游戏运行时动态切换颜色消除模式：

```javascript
// 启用颜色消除模式
$('#game').blockrain('option', 'colorElimination', true);

// 禁用颜色消除模式
$('#game').blockrain('option', 'colorElimination', false);
```

### 调整颜色数量

你可以设置游戏中使用的颜色数量（4-8之间）：

```javascript
$('#game').blockrain('option', 'colorCount', 5); // 使用5种颜色
```

## 回调函数

### onColorElimination

当颜色消除发生时触发的回调函数，返回以下参数：
- `color`：被消除的颜色
- `count`：被消除的方块数量
- `scoreIncrement`：此次消除获得的分数
- `score`：当前总分数

```javascript
$('#game').blockrain({
    onColorElimination: function(color, count, scoreIncrement, score) {
        console.log('消除了', count, '个', color, '颜色的方块，获得', scoreIncrement, '分，总分数：', score);
    }
});
```

## 工作原理

1. **颜色选择**：游戏开始时，从当前主题中提取所有颜色，然后随机选择指定数量（4-8）的颜色
2. **颜色分配**：新生成的方块会随机使用选定的颜色
3. **颜色计数**：系统会跟踪每种颜色的方块数量
4. **消除检测**：每次方块放置后，系统会检查是否有颜色的方块数量超过10个
5. **颜色消除**：当某颜色方块数量超过10个时，该颜色所有方块被清除
6. **重力效果**：消除后，系统会应用重力效果，使上方的方块下落补空
7. **重新计数**：重力效果应用后，系统会重新计算所有颜色的方块数量

## 与经典模式的兼容性

颜色消除模式与经典的行消除模式完全兼容：
- 两种模式可以同时启用
- 行消除和颜色消除可以同时发生
- 计分系统是独立的，两种消除方式都会增加分数
- 原有的游戏逻辑和控制方式保持不变

## 测试页面

我们提供了一个测试页面`color_elimination_test.html`，你可以使用它来测试颜色消除模式的功能。在测试页面中，你可以：
- 启用/禁用颜色消除模式
- 调整颜色数量（4-8）
- 开始和重新开始游戏
- 实时查看分数和游戏状态

## 技术实现

颜色消除模式的实现主要涉及以下几个方面：

1. **数据结构扩展**：在`_filled`对象中添加了`colorCounts`和`colorBlockMap`来跟踪颜色信息
2. **颜色选择算法**：`_selectGameColors`方法负责从主题中选择颜色
3. **颜色分配逻辑**：修改了`getBlockColor`方法，在颜色消除模式下使用选定的颜色
4. **消除检测**：`checkForColorEliminations`方法检查是否需要消除颜色
5. **颜色消除**：`eliminateColor`方法处理颜色消除和计分
6. **重力效果**：`applyGravity`方法实现方块下落补空
7. **数据重建**：`rebuildColorData`方法在重力效果后重新计算颜色信息

## 注意事项

1. 颜色消除模式只在支持颜色的主题中有效（如'modern'主题）
2. 如果主题中的颜色数量少于要求的颜色数量，系统会重复使用一些颜色
3. 颜色消除模式不会影响原有的行消除逻辑
4. 在颜色消除模式下，方块的颜色会随机分配，与方块类型无关

## 示例

以下是一个完整的颜色消除模式示例：

```javascript
$(document).ready(function() {
    $('#game').blockrain({
        theme: 'modern',
        blockWidth: 10,
        speed: 20,
        colorElimination: true,
        colorCount: 6,
        
        onStart: function() {
            console.log('游戏开始');
        },
        
        onGameOver: function(score) {
            console.log('游戏结束，总分数：', score);
        },
        
        onLine: function(lines, scoreIncrement, score) {
            console.log('消除了', lines, '行，获得', scoreIncrement, '分，总分数：', score);
        },
        
        onColorElimination: function(color, count, scoreIncrement, score) {
            console.log('消除了', count, '个', color, '颜色的方块，获得', scoreIncrement, '分，总分数：', score);
        }
    });
});
```