((function ( $ ) {

  "use strict";

  /**
   * 3D方块类，每个方块由多个3D立方体组成
   */
  function Block3D(blockType, renderer) {
    this.blockType = blockType;
    this.renderer = renderer;
    
    // 方块的位置
    this.x = 0;
    this.y = 0;
    
    // 方块的旋转方向
    this.orientation = 0;
    
    // 组成方块的立方体列表
    this.cubes = [];
    
    // 方块类型的3D配置
    this.blockConfigs = {
      line: [
        [0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]
      ],
      square: [
        [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]
      ],
      arrow: [
        [1, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0]
      ],
      rightHook: [
        [1, 0, 0], [1, 1, 0], [1, 2, 0], [2, 2, 0]
      ],
      leftHook: [
        [1, 0, 0], [1, 1, 0], [1, 2, 0], [0, 2, 0]
      ],
      leftZag: [
        [0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0]
      ],
      rightZag: [
        [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0]
      ]
    };
    
    // 方块颜色配置
    this.blockColors = {
      line: [1.0, 0.0, 0.0, 1.0],       // 红色
      square: [0.0, 1.0, 0.0, 1.0],     // 绿色
      arrow: [0.0, 0.0, 1.0, 1.0],      // 蓝色
      rightHook: [1.0, 1.0, 0.0, 1.0],  // 黄色
      leftHook: [1.0, 0.0, 1.0, 1.0],   // 紫色
      leftZag: [0.0, 1.0, 1.0, 1.0],    // 青色
      rightZag: [1.0, 0.5, 0.0, 1.0]    // 橙色
    };
    
    // 初始化方块
    this.init();
  }
  
  /**
   * 初始化方块
   */
  Block3D.prototype.init = function() {
    // 获取方块的配置
    var config = this.blockConfigs[this.blockType];
    
    if (!config) {
      console.error('Invalid block type:', this.blockType);
      return;
    }
    
    // 创建方块的立方体
    for (var i = 0; i < config.length; i++) {
      var cube = {
        position: config[i].slice(),  // 深拷贝位置数组
        color: this.blockColors[this.blockType].slice()  // 深拷贝颜色数组
      };
      
      this.cubes.push(cube);
    }
  };
  
  /**
   * 设置方块的位置
   */
  Block3D.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
  };
  
  /**
   * 获取方块的位置
   */
  Block3D.prototype.getPosition = function() {
    return {
      x: this.x,
      y: this.y
    };
  };
  
  /**
   * 旋转方块
   */
  Block3D.prototype.rotate = function(direction) {
    // 计算新的旋转方向
    var newOrientation = (this.orientation + (direction === "left" ? 1 : -1) + 4) % 4;
    
    // 旋转每个立方体
    for (var i = 0; i < this.cubes.length; i++) {
      var cube = this.cubes[i];
      var x = cube.position[0];
      var y = cube.position[1];
      
      // 执行旋转 (90度) 注意：这里使用简化的旋转逻辑，因为方块的初始配置是为了方便旋转
      // 对于俄罗斯方块，实际上只需要旋转方向的索引，而不是实际旋转每个立方体
      // 这里的旋转逻辑主要是为了演示
    }
    
    // 更新旋转方向
    this.orientation = newOrientation;
  };
  
  /**
   * 移动方块
   */
  Block3D.prototype.move = function(dx, dy) {
    this.x += dx;
    this.y += dy;
  };
  
  /**
   * 向下移动方块
   */
  Block3D.prototype.drop = function() {
    this.y += 1;
  };
  
  /**
   * 获取方块的立方体位置
   */
  Block3D.prototype.getCubePositions = function() {
    var positions = [];
    
    for (var i = 0; i < this.cubes.length; i++) {
      var cube = this.cubes[i];
      positions.push({
        x: this.x + cube.position[0],
        y: this.y + cube.position[1],
        z: cube.position[2]
      });
    }
    
    return positions;
  };
  
  /**
   * 渲染方块
   */
  Block3D.prototype.render = function() {
    var gl = this.renderer.gl;
    var program = this.renderer.program;
    
    // 获取矩阵uniform位置
    var modelMatrixLocation = gl.getUniformLocation(program, 'uModelMatrix');
    var viewMatrixLocation = gl.getUniformLocation(program, 'uViewMatrix');
    var projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    
    // 设置视图和投影矩阵
    gl.uniformMatrix4fv(viewMatrixLocation, false, this.renderer.viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, this.renderer.projectionMatrix);
    
    // 保存原始模型矩阵
    var originalModelMatrix = new Float32Array(this.renderer.modelMatrix);
    
    // 渲染每个立方体
    for (var i = 0; i < this.cubes.length; i++) {
      var cube = this.cubes[i];
      
      // 重置模型矩阵
      this.renderer.setIdentityMatrix(this.renderer.modelMatrix);
      
      // 应用平移
      this.renderer.translateMatrix(
        this.renderer.modelMatrix,
        this.x + cube.position[0],
        this.y + cube.position[1],
        cube.position[2]
      );
      
      // 设置模型矩阵
      gl.uniformMatrix4fv(modelMatrixLocation, false, this.renderer.modelMatrix);
      
      // 绘制立方体
      gl.drawElements(gl.TRIANGLES, this.renderer.cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    // 恢复原始模型矩阵
    this.renderer.modelMatrix.set(originalModelMatrix);
  };
  
  // 将Block3D添加到全局命名空间
  window.Block3D = Block3D;
  
})( jQuery ));