((function ( $ ) {

  "use strict";

  /**
   * WebGL渲染器类，负责3D场景的初始化和渲染
   */
  function WebGLRenderer(canvas) {
    this.canvas = canvas;
    this.gl = null;
    
    // 着色器程序
    this.program = null;
    
    // 顶点缓冲区
    this.vertexBuffer = null;
    this.indexBuffer = null;
    
    // 矩阵
    this.modelMatrix = new Float32Array(16);
    this.viewMatrix = new Float32Array(16);
    this.projectionMatrix = new Float32Array(16);
    this.normalMatrix = new Float32Array(9);
    
    // 光照参数
    this.lightDirection = new Float32Array([1.0, 1.0, 1.0]);
    this.ambientColor = new Float32Array([0.2, 0.2, 0.2]);
    this.diffuseColor = new Float32Array([0.8, 0.8, 0.8]);
    
    // 立方体顶点数据
    this.cubeVertices = [
      // 前表面
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5,
      // 后表面
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
      -0.5,  0.5, -0.5
    ];
    
    // 立方体法向量数据
    this.cubeNormals = [
      // 前表面法向量
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      // 后表面法向量
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      // 左表面法向量
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      // 右表面法向量
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      // 上表面法向量
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      // 下表面法向量
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0
    ];
    
    // 立方体索引数据
    this.cubeIndices = [
      // 前表面
      0, 1, 2,
      0, 2, 3,
      // 后表面
      4, 6, 5,
      4, 7, 6,
      // 左表面
      4, 5, 1,
      4, 1, 0,
      // 右表面
      5, 6, 2,
      5, 2, 1,
      // 上表面
      6, 7, 3,
      6, 3, 2,
      // 下表面
      7, 4, 0,
      7, 0, 3
    ];
    
    // 颜色数据
    this.cubeColors = [
      // 前表面
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      // 后表面
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0
    ];
    
    // 初始化WebGL
    this.init();
  }
  
  /**
   * 初始化WebGL
   */
  WebGLRenderer.prototype.init = function() {
    // 获取WebGL上下文
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('Failed to get WebGL context!');
      alert('WebGL is not supported by your browser.');
      return;
    } else {
      console.log('Successfully got WebGL context!');
    }
    
    // 设置画布大小
    this.resize();
    
    // 创建着色器程序
    this.createShaderProgram();
    
    // 创建顶点缓冲区
    this.createBuffers();
    
    // 创建背景缓冲区
    this.createBackgroundBuffers();
    
    // 设置矩阵
    this.setMatrices();
    
    // 设置清除颜色
    this.gl.clearColor(0.05, 0.05, 0.05, 1.0);
    
    // 启用深度测试
    this.gl.enable(this.gl.DEPTH_TEST);
    
    // 性能优化：启用顶点缓冲区对象的自动缓存
    this.gl.enable(this.gl.CULL_FACE); // 启用面剔除，只渲染可见面
    this.gl.cullFace(this.gl.BACK); // 剔除背面
    
    // 缓存uniform位置，避免重复查询
    this.cacheUniformLocations();
  };
  
  /**
   * 缓存uniform位置
   */
  WebGLRenderer.prototype.cacheUniformLocations = function() {
    this.uniformLocations = {
      modelMatrix: this.gl.getUniformLocation(this.program, 'uModelMatrix'),
      viewMatrix: this.gl.getUniformLocation(this.program, 'uViewMatrix'),
      projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
      normalMatrix: this.gl.getUniformLocation(this.program, 'uNormalMatrix'),
      lightDirection: this.gl.getUniformLocation(this.program, 'uLightDirection'),
      ambientColor: this.gl.getUniformLocation(this.program, 'uAmbientColor'),
      diffuseColor: this.gl.getUniformLocation(this.program, 'uDiffuseColor')
    };
    
    // 缓存属性位置
    this.attributeLocations = {
      vertexPosition: this.gl.getAttribLocation(this.program, 'aVertexPosition'),
      vertexColor: this.gl.getAttribLocation(this.program, 'aVertexColor'),
      vertexNormal: this.gl.getAttribLocation(this.program, 'aVertexNormal')
    };
  };
  
  /**
   * 创建背景缓冲区
   */
  WebGLRenderer.prototype.createBackgroundBuffers = function() {
    // 创建一个简单的3D背景网格
    // 游戏区域尺寸：默认12列 x 24行
    var gridWidth = 12.0;
    var gridHeight = 24.0;
    
    // 创建网格顶点数据
    var gridVertices = [];
    var gridStep = 1.0; // 网格线间距
    
    // 水平网格线 (X轴方向)
    for (var y = 0; y <= gridHeight; y += gridStep) {
      gridVertices.push(-gridWidth/2, -gridHeight/2 + y, -0.1);
      gridVertices.push(gridWidth/2, -gridHeight/2 + y, -0.1);
    }
    
    // 垂直网格线 (Y轴方向)
    for (var x = 0; x <= gridWidth; x += gridStep) {
      gridVertices.push(-gridWidth/2 + x, -gridHeight/2, -0.1);
      gridVertices.push(-gridWidth/2 + x, gridHeight/2, -0.1);
    }
    
    // 创建背景顶点缓冲区
    this.backgroundVertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.backgroundVertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(gridVertices), this.gl.STATIC_DRAW);
    
    // 背景颜色 (半透明灰色)
    this.backgroundColor = [0.3, 0.3, 0.3, 0.2];
  };
  
  /**
   * 渲染3D背景
   */
  WebGLRenderer.prototype.renderBackground = function() {
    // 绑定背景顶点缓冲区
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.backgroundVertexBuffer);
    
    // 使用缓存的属性位置
    var vertexPositionLocation = this.attributeLocations.vertexPosition;
    this.gl.enableVertexAttribArray(vertexPositionLocation);
    this.gl.vertexAttribPointer(vertexPositionLocation, 3, this.gl.FLOAT, false, 0, 0);
    
    // 设置背景颜色
    var vertexColorLocation = this.attributeLocations.vertexColor;
    this.gl.vertexAttrib4fv(vertexColorLocation, this.backgroundColor);
    
    // 禁用法向量（背景不需要光照）
    var vertexNormalLocation = this.attributeLocations.vertexNormal;
    this.gl.disableVertexAttribArray(vertexNormalLocation);
    
    // 绘制背景网格线
    this.gl.drawArrays(this.gl.LINES, 0, (12+1)*2 + (24+1)*2);
    
    // 重新启用法向量
    this.gl.enableVertexAttribArray(vertexNormalLocation);
  };
  
  /**
   * 调整画布大小
   */
  WebGLRenderer.prototype.resize = function() {
    var width = this.canvas.clientWidth;
    var height = this.canvas.clientHeight;
    
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      
      // 更新视口
      this.gl.viewport(0, 0, width, height);
      
      // 重新设置投影矩阵
      this.setProjectionMatrix();
    }
  };
  
  /**
   * 创建着色器程序
   */
  WebGLRenderer.prototype.createShaderProgram = function() {
    console.log('Creating shader program...');
    
    // 顶点着色器源码 - 包含光照计算
    var vertexShaderSource = `
      attribute vec3 aVertexPosition;
      attribute vec4 aVertexColor;
      attribute vec3 aVertexNormal;
      
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat3 uNormalMatrix;
      
      // 光照参数
      uniform vec3 uLightDirection;
      uniform vec3 uAmbientColor;
      uniform vec3 uDiffuseColor;
      
      varying vec4 vColor;
      
      void main() {
        mat4 mvMatrix = uViewMatrix * uModelMatrix;
        gl_Position = uProjectionMatrix * mvMatrix * vec4(aVertexPosition, 1.0);
        
        // 计算法向量
        vec3 transformedNormal = uNormalMatrix * aVertexNormal;
        
        // 计算光照
        float dotProduct = max(dot(transformedNormal, uLightDirection), 0.0);
        vec3 lightingColor = uAmbientColor + uDiffuseColor * dotProduct;
        
        // 应用光照到顶点颜色
        vColor = vec4(aVertexColor.rgb * lightingColor, aVertexColor.a);
      }
    `;
    
    // 片段着色器源码
    var fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 vColor;
      
      void main() {
        gl_FragColor = vColor;
      }
    `;
    
    // 创建顶点着色器
    var vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    if (!vertexShader) {
      console.error('Failed to create vertex shader!');
      return;
    }
    
    // 创建片段着色器
    var fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!fragmentShader) {
      console.error('Failed to create fragment shader!');
      return;
    }
    
    // 创建着色器程序
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    // 检查程序是否链接成功
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Failed to link WebGL program:', this.gl.getProgramInfoLog(this.program));
      return;
    }
    
    console.log('Shader program created successfully!');
    
    // 使用着色器程序
    this.gl.useProgram(this.program);
  };
  
  /**
   * 创建着色器
   */
  WebGLRenderer.prototype.createShader = function(type, source) {
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    // 检查着色器是否编译成功
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Failed to compile shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };
  
  /**
   * 创建顶点缓冲区
   */
  WebGLRenderer.prototype.createBuffers = function() {
    // 创建顶点缓冲区
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cubeVertices), this.gl.STATIC_DRAW);
    
    // 获取顶点位置属性位置
    var vertexPositionLocation = this.gl.getAttribLocation(this.program, 'aVertexPosition');
    this.gl.enableVertexAttribArray(vertexPositionLocation);
    this.gl.vertexAttribPointer(vertexPositionLocation, 3, this.gl.FLOAT, false, 0, 0);
    
    // 创建法向量缓冲区
    var normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cubeNormals), this.gl.STATIC_DRAW);
    
    // 获取顶点法向量属性位置
    var vertexNormalLocation = this.gl.getAttribLocation(this.program, 'aVertexNormal');
    this.gl.enableVertexAttribArray(vertexNormalLocation);
    this.gl.vertexAttribPointer(vertexNormalLocation, 3, this.gl.FLOAT, false, 0, 0);
    
    // 创建颜色缓冲区
    var colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cubeColors), this.gl.STATIC_DRAW);
    
    // 获取顶点颜色属性位置
    var vertexColorLocation = this.gl.getAttribLocation(this.program, 'aVertexColor');
    this.gl.enableVertexAttribArray(vertexColorLocation);
    this.gl.vertexAttribPointer(vertexColorLocation, 4, this.gl.FLOAT, false, 0, 0);
    
    // 创建索引缓冲区
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cubeIndices), this.gl.STATIC_DRAW);
  };
  
  /**
   * 设置矩阵
   */
  WebGLRenderer.prototype.setMatrices = function() {
    // 设置模型矩阵
    this.setIdentityMatrix(this.modelMatrix);
    
    // 设置视图矩阵 (固定俯视角度)
    this.setIdentityMatrix(this.viewMatrix);
    
    // 应用平移和旋转，实现固定俯视角度
    this.translateMatrix(this.viewMatrix, 0.0, -5.0, -10.0);
    this.rotateMatrix(this.viewMatrix, 45.0 * Math.PI / 180.0, 1.0, 0.0, 0.0);
    this.rotateMatrix(this.viewMatrix, 45.0 * Math.PI / 180.0, 0.0, 1.0, 0.0);
    
    // 设置投影矩阵
    this.setProjectionMatrix();
    
    // 归一化光源方向
    this.normalizeVector(this.lightDirection);
  };
  
  /**
   * 归一化向量
   */
  WebGLRenderer.prototype.normalizeVector = function(vector) {
    var length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
    if (length > 0) {
      vector[0] /= length;
      vector[1] /= length;
      vector[2] /= length;
    }
  };
  
  /**
   * 计算法向量矩阵
   */
  WebGLRenderer.prototype.computeNormalMatrix = function() {
    // 法向量矩阵是模型视图矩阵的逆矩阵的转置矩阵
    // 这里我们使用简化的计算，因为我们没有缩放变换
    
    // 计算模型视图矩阵
    var mvMatrix = new Float32Array(16);
    this.multiplyMatrices(mvMatrix, this.viewMatrix, this.modelMatrix);
    
    // 提取3x3矩阵
    var mat3 = [
      mvMatrix[0], mvMatrix[1], mvMatrix[2],
      mvMatrix[4], mvMatrix[5], mvMatrix[6],
      mvMatrix[8], mvMatrix[9], mvMatrix[10]
    ];
    
    // 计算逆矩阵 (简化版本，因为我们没有缩放)
    var det = mat3[0] * (mat3[4] * mat3[8] - mat3[5] * mat3[7]) - 
              mat3[1] * (mat3[3] * mat3[8] - mat3[5] * mat3[6]) + 
              mat3[2] * (mat3[3] * mat3[7] - mat3[4] * mat3[6]);
    
    if (det === 0) return;
    
    var invDet = 1.0 / det;
    
    var invMat3 = [
      (mat3[4] * mat3[8] - mat3[5] * mat3[7]) * invDet,
      (mat3[2] * mat3[7] - mat3[1] * mat3[8]) * invDet,
      (mat3[1] * mat3[5] - mat3[2] * mat3[4]) * invDet,
      (mat3[5] * mat3[6] - mat3[3] * mat3[8]) * invDet,
      (mat3[0] * mat3[8] - mat3[2] * mat3[6]) * invDet,
      (mat3[2] * mat3[3] - mat3[0] * mat3[5]) * invDet,
      (mat3[3] * mat3[7] - mat3[4] * mat3[6]) * invDet,
      (mat3[1] * mat3[6] - mat3[0] * mat3[7]) * invDet,
      (mat3[0] * mat3[4] - mat3[1] * mat3[3]) * invDet
    ];
    
    // 转置矩阵
    this.normalMatrix[0] = invMat3[0];
    this.normalMatrix[1] = invMat3[3];
    this.normalMatrix[2] = invMat3[6];
    this.normalMatrix[3] = invMat3[1];
    this.normalMatrix[4] = invMat3[4];
    this.normalMatrix[5] = invMat3[7];
    this.normalMatrix[6] = invMat3[2];
    this.normalMatrix[7] = invMat3[5];
    this.normalMatrix[8] = invMat3[8];
  };
  
  /**
   * 矩阵相乘
   */
  WebGLRenderer.prototype.multiplyMatrices = function(result, mat1, mat2) {
    var m11 = mat1[0] * mat2[0] + mat1[1] * mat2[4] + mat1[2] * mat2[8] + mat1[3] * mat2[12];
    var m12 = mat1[0] * mat2[1] + mat1[1] * mat2[5] + mat1[2] * mat2[9] + mat1[3] * mat2[13];
    var m13 = mat1[0] * mat2[2] + mat1[1] * mat2[6] + mat1[2] * mat2[10] + mat1[3] * mat2[14];
    var m14 = mat1[0] * mat2[3] + mat1[1] * mat2[7] + mat1[2] * mat2[11] + mat1[3] * mat2[15];
    
    var m21 = mat1[4] * mat2[0] + mat1[5] * mat2[4] + mat1[6] * mat2[8] + mat1[7] * mat2[12];
    var m22 = mat1[4] * mat2[1] + mat1[5] * mat2[5] + mat1[6] * mat2[9] + mat1[7] * mat2[13];
    var m23 = mat1[4] * mat2[2] + mat1[5] * mat2[6] + mat1[6] * mat2[10] + mat1[7] * mat2[14];
    var m24 = mat1[4] * mat2[3] + mat1[5] * mat2[7] + mat1[6] * mat2[11] + mat1[7] * mat2[15];
    
    var m31 = mat1[8] * mat2[0] + mat1[9] * mat2[4] + mat1[10] * mat2[8] + mat1[11] * mat2[12];
    var m32 = mat1[8] * mat2[1] + mat1[9] * mat2[5] + mat1[10] * mat2[9] + mat1[11] * mat2[13];
    var m33 = mat1[8] * mat2[2] + mat1[9] * mat2[6] + mat1[10] * mat2[10] + mat1[11] * mat2[14];
    var m34 = mat1[8] * mat2[3] + mat1[9] * mat2[7] + mat1[10] * mat2[11] + mat1[11] * mat2[15];
    
    var m41 = mat1[12] * mat2[0] + mat1[13] * mat2[4] + mat1[14] * mat2[8] + mat1[15] * mat2[12];
    var m42 = mat1[12] * mat2[1] + mat1[13] * mat2[5] + mat1[14] * mat2[9] + mat1[15] * mat2[13];
    var m43 = mat1[12] * mat2[2] + mat1[13] * mat2[6] + mat1[14] * mat2[10] + mat1[15] * mat2[14];
    var m44 = mat1[12] * mat2[3] + mat1[13] * mat2[7] + mat1[14] * mat2[11] + mat1[15] * mat2[15];
    
    result[0] = m11;
    result[1] = m12;
    result[2] = m13;
    result[3] = m14;
    
    result[4] = m21;
    result[5] = m22;
    result[6] = m23;
    result[7] = m24;
    
    result[8] = m31;
    result[9] = m32;
    result[10] = m33;
    result[11] = m34;
    
    result[12] = m41;
    result[13] = m42;
    result[14] = m43;
    result[15] = m44;
  };
  
  /**
   * 设置投影矩阵
   */
  WebGLRenderer.prototype.setProjectionMatrix = function() {
    var width = this.canvas.width;
    var height = this.canvas.height;
    var aspectRatio = width / height;
    
    // 设置透视投影矩阵
    this.setPerspectiveMatrix(this.projectionMatrix, 45.0 * Math.PI / 180.0, aspectRatio, 0.1, 100.0);
  };
  
  /**
   * 设置单位矩阵
   */
  WebGLRenderer.prototype.setIdentityMatrix = function(matrix) {
    matrix[0] = 1.0; matrix[1] = 0.0; matrix[2] = 0.0; matrix[3] = 0.0;
    matrix[4] = 0.0; matrix[5] = 1.0; matrix[6] = 0.0; matrix[7] = 0.0;
    matrix[8] = 0.0; matrix[9] = 0.0; matrix[10] = 1.0; matrix[11] = 0.0;
    matrix[12] = 0.0; matrix[13] = 0.0; matrix[14] = 0.0; matrix[15] = 1.0;
  };
  
  /**
   * 设置平移矩阵
   */
  WebGLRenderer.prototype.translateMatrix = function(matrix, x, y, z) {
    matrix[12] += x * matrix[0] + y * matrix[4] + z * matrix[8];
    matrix[13] += x * matrix[1] + y * matrix[5] + z * matrix[9];
    matrix[14] += x * matrix[2] + y * matrix[6] + z * matrix[10];
    matrix[15] += x * matrix[3] + y * matrix[7] + z * matrix[11];
  };
  
  /**
   * 设置旋转矩阵
   */
  WebGLRenderer.prototype.rotateMatrix = function(matrix, angle, x, y, z) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    
    var nx = x / Math.sqrt(x * x + y * y + z * z);
    var ny = y / Math.sqrt(x * x + y * y + z * z);
    var nz = z / Math.sqrt(x * x + y * y + z * z);
    
    var m11 = cos + nx * nx * (1 - cos);
    var m12 = nx * ny * (1 - cos) - nz * sin;
    var m13 = nx * nz * (1 - cos) + ny * sin;
    
    var m21 = ny * nx * (1 - cos) + nz * sin;
    var m22 = cos + ny * ny * (1 - cos);
    var m23 = ny * nz * (1 - cos) - nx * sin;
    
    var m31 = nz * nx * (1 - cos) - ny * sin;
    var m32 = nz * ny * (1 - cos) + nx * sin;
    var m33 = cos + nz * nz * (1 - cos);
    
    var temp1 = m11 * matrix[0] + m12 * matrix[4] + m13 * matrix[8];
    var temp2 = m11 * matrix[1] + m12 * matrix[5] + m13 * matrix[9];
    var temp3 = m11 * matrix[2] + m12 * matrix[6] + m13 * matrix[10];
    var temp4 = m11 * matrix[3] + m12 * matrix[7] + m13 * matrix[11];
    
    matrix[4] = m21 * matrix[0] + m22 * matrix[4] + m23 * matrix[8];
    matrix[5] = m21 * matrix[1] + m22 * matrix[5] + m23 * matrix[9];
    matrix[6] = m21 * matrix[2] + m22 * matrix[6] + m23 * matrix[10];
    matrix[7] = m21 * matrix[3] + m22 * matrix[7] + m23 * matrix[11];
    
    matrix[8] = m31 * matrix[0] + m32 * matrix[4] + m33 * matrix[8];
    matrix[9] = m31 * matrix[1] + m32 * matrix[5] + m33 * matrix[9];
    matrix[10] = m31 * matrix[2] + m32 * matrix[6] + m33 * matrix[10];
    matrix[11] = m31 * matrix[3] + m32 * matrix[7] + m33 * matrix[11];
    
    matrix[0] = temp1;
    matrix[1] = temp2;
    matrix[2] = temp3;
    matrix[3] = temp4;
  };
  
  /**
   * 设置透视投影矩阵
   */
  WebGLRenderer.prototype.setPerspectiveMatrix = function(matrix, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2.0);
    
    matrix[0] = f / aspect;
    matrix[1] = 0.0;
    matrix[2] = 0.0;
    matrix[3] = 0.0;
    
    matrix[4] = 0.0;
    matrix[5] = f;
    matrix[6] = 0.0;
    matrix[7] = 0.0;
    
    matrix[8] = 0.0;
    matrix[9] = 0.0;
    matrix[10] = (far + near) / (near - far);
    matrix[11] = -1.0;
    
    matrix[12] = 0.0;
    matrix[13] = 0.0;
    matrix[14] = (2.0 * far * near) / (near - far);
    matrix[15] = 0.0;
  };
  
  /**
   * 渲染场景
   */
  WebGLRenderer.prototype.render = function(filledBlocks, currentBlock) {
    // 清除颜色和深度缓冲区
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // 渲染3D背景
    this.renderBackground();
    
    // 使用缓存的uniform位置，避免重复查询
    var uniforms = this.uniformLocations;
    
    // 设置光照uniforms
    this.gl.uniform3fv(uniforms.lightDirection, this.lightDirection);
    this.gl.uniform3fv(uniforms.ambientColor, this.ambientColor);
    this.gl.uniform3fv(uniforms.diffuseColor, this.diffuseColor);
    
    // 设置视图和投影矩阵
    this.gl.uniformMatrix4fv(uniforms.viewMatrix, false, this.viewMatrix);
    this.gl.uniformMatrix4fv(uniforms.projectionMatrix, false, this.projectionMatrix);
    
    // 渲染所有已放置的方块
    if (filledBlocks) {
      this.renderBlocks(filledBlocks);
    }
    
    // 渲染当前正在下落的方块
    if (currentBlock) {
      this.renderCurrentBlock(currentBlock);
    }
  };
  
  /**
   * 渲染所有已放置的方块
   */
  WebGLRenderer.prototype.renderBlocks = function(filledBlocks) {
    // 预留批量渲染接口，当前逐个渲染方块
    for (var x = 0; x < 12; x++) {
      for (var y = 0; y < 24; y++) {
        var block = filledBlocks.get(x, y);
        if (block) {
          this.renderSingleBlock(x, y, block.blockType);
        }
      }
    }
  };
  
  /**
   * 渲染当前正在下落的方块
   */
  WebGLRenderer.prototype.renderCurrentBlock = function(currentBlock) {
    var blocks = currentBlock.getBlocks();
    for (var i = 0; i < blocks.length; i += 2) {
      var x = currentBlock.x + blocks[i];
      var y = currentBlock.y + blocks[i + 1];
      this.renderSingleBlock(x, y, currentBlock.blockType);
    }
  };
  
  /**
   * 渲染单个方块
   */
  WebGLRenderer.prototype.renderSingleBlock = function(x, y, blockType) {
    // 将游戏坐标系转换为WebGL坐标系
    var webglX = x - 6.0; // 中心在0,0
    var webglY = y - 12.0;
    
    // 设置模型矩阵
    this.setIdentityMatrix(this.modelMatrix);
    this.translateMatrix(this.modelMatrix, webglX, webglY, 0.0);
    
    // 计算法向量矩阵
    this.computeNormalMatrix();
    
    // 使用缓存的uniform位置，避免重复查询
    var uniforms = this.uniformLocations;
    
    // 设置模型矩阵和法向量矩阵
    this.gl.uniformMatrix4fv(uniforms.modelMatrix, false, this.modelMatrix);
    this.gl.uniformMatrix3fv(uniforms.normalMatrix, false, this.normalMatrix);
    
    // 绘制立方体
    this.gl.drawElements(this.gl.TRIANGLES, this.cubeIndices.length, this.gl.UNSIGNED_SHORT, 0);
  };
  
  /**
   * 性能优化：批处理渲染
   * 目前只渲染单个方块，未来可扩展为批处理多个方块
   */
  WebGLRenderer.prototype.renderBatch = function(blocks) {
    // 预留批处理接口，当前实现与单方块渲染相同
    this.render();
  };
  
  /**
   * 性能优化：检查WebGL扩展支持
   */
  WebGLRenderer.prototype.checkExtensions = function() {
    var extensions = {
      anisotropicFiltering: this.gl.getExtension('EXT_texture_filter_anisotropic') || 
                             this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || 
                             this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
    };
    
    // 可以根据扩展支持情况调整渲染策略
    return extensions;
  };
  
  // 将WebGLRenderer添加到全局命名空间
  window.WebGLRenderer = WebGLRenderer;
  
})( jQuery ));