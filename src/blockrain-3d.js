((function ( $ ) {

  "use strict";

  $.widget('aerolab.blockrain3d', {

    options: {
      autoplay: false,
      autoplayRestart: true,
      showFieldOnStart: true,
      theme: null,
      blockWidth: 10,
      autoBlockWidth: false,
      autoBlockSize: 24,
      difficulty: 'normal',
      speed: 20,
      asdwKeys: true,
      
      // 3D specific options
      cameraAngle: 45, // 俯视角
      cameraDistance: 20, // 相机距离
      cubeSize: 1.0, // 立方体大小
      lightDirection: [0.5, 0.5, -1.0], // 光源方向
      ambientLight: 0.3, // 环境光强度
      diffuseLight: 0.7, // 漫反射光强度
      
      // Copy
      playText: 'Let\'s play some 3D Tetris',
      playButtonText: 'Play',
      gameOverText: 'Game Over',
      restartButtonText: 'Play Again',
      scoreText: 'Score',

      // Basic Callbacks
      onStart: function(){},
      onRestart: function(){},
      onGameOver: function(score){},

      // When a block is placed
      onPlaced: function(){},
      // When a line is made. Returns the number of lines, score assigned and total score
      onLine: function(lines, scoreIncrement, score){}
    },

    // WebGL相关变量
    gl: null,
    program: null,
    
    // 着色器源代码
    vertexShaderSource: `
      attribute vec3 a_position;
      attribute vec3 a_normal;
      
      uniform mat4 u_modelMatrix;
      uniform mat4 u_viewMatrix;
      uniform mat4 u_projectionMatrix;
      uniform vec3 u_lightDirection;
      uniform float u_ambientLight;
      uniform float u_diffuseLight;
      
      varying float v_lightIntensity;
      
      void main() {
        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
        
        // 计算法向量
        mat3 normalMatrix = mat3(transpose(inverse(u_modelMatrix)));
        vec3 normal = normalize(normalMatrix * a_normal);
        
        // 计算光照
        float diffuse = max(dot(normal, normalize(u_lightDirection)), 0.0);
        v_lightIntensity = u_ambientLight + u_diffuseLight * diffuse;
      }
    `,
    
    fragmentShaderSource: `
      precision mediump float;
      
      varying float v_lightIntensity;
      uniform vec4 u_color;
      
      void main() {
        gl_FragColor = vec4(u_color.rgb * v_lightIntensity, u_color.a);
      }
    `,
    
    // 立方体顶点数据
    cubeVertices: new Float32Array([
      // 前面
      -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
       0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
       0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
      -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
      // 后面
      -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
       0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
       0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
      -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
      // 上面
      -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
       0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
       0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
      -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
      // 下面
      -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
       0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
       0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
      -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
      // 右面
       0.5, -0.5, -0.5,  1.0,  0.0,  0.0,
       0.5,  0.5, -0.5,  1.0,  0.0,  0.0,
       0.5,  0.5,  0.5,  1.0,  0.0,  0.0,
       0.5, -0.5,  0.5,  1.0,  0.0,  0.0,
      // 左面
      -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,
      -0.5,  0.5, -0.5, -1.0,  0.0,  0.0,
      -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,
      -0.5, -0.5,  0.5, -1.0,  0.0,  0.0
    ]),
    
    cubeIndices: new Uint16Array([
      0, 1, 2,   0, 2, 3,    // 前面
      4, 5, 6,   4, 6, 7,    // 后面
      8, 9, 10,  8, 10, 11,  // 上面
      12, 13, 14, 12, 14, 15, // 下面
      16, 17, 18, 16, 18, 19, // 右面
      20, 21, 22, 20, 22, 23  // 左面
    ]),
    
    // 方块颜色
    blockColors: {
      line: [1.0, 0.0, 0.0, 1.0],    // 红色
      square: [0.0, 1.0, 0.0, 1.0],  // 绿色
      arrow: [0.0, 0.0, 1.0, 1.0],   // 蓝色
      rightHook: [1.0, 1.0, 0.0, 1.0], // 黄色
      leftHook: [1.0, 0.0, 1.0, 1.0],  // 紫色
      leftZag: [0.0, 1.0, 1.0, 1.0],   // 青色
      rightZag: [0.5, 0.5, 0.5, 1.0]   // 灰色
    },

    /**
     * Start/Restart Game
     */
    start: function() {
      this._doStart();
      this.options.onStart.call(this.element);
    },

    restart: function() {
      this._doStart();
      this.options.onRestart.call(this.element);
    },

    gameover: function() {
      this.showGameOverMessage();
      this._board.gameover = true;
      this.options.onGameOver.call(this.element, this._filled.score);
    },

    _doStart: function() {
      this._filled.clearAll();
      this._filled._resetScore();
      this._board.cur = this._board.nextShape();
      this._board.started = true;
      this._board.gameover = false;
      this._board.dropDelay = 5;
      this._board.render(true);
      this._board.animate();

      this._$start.fadeOut(150);
      this._$gameover.fadeOut(150);
      this._$score.fadeIn(150);
    },

    pause: function() {
      this._board.paused = true;
    },

    resume: function() {
      this._board.paused = false;
    },

    autoplay: function(enable) {
      if( typeof enable !== 'boolean' ){ enable = true; }

      // On autoplay, start the game right away
      this.options.autoplay = enable;
      if( enable && ! this._board.started ) {
        this._doStart();
      }
      this._setupControls( ! enable );
      this._setupTouchControls( ! enable );
    },

    controls: function(enable) {
      if( typeof enable !== 'boolean' ){ enable = true; }
      this._setupControls(enable);
    },

    touchControls: function(enable) {
      if( typeof enable !== 'boolean' ){ enable = true; }
      this._setupTouchControls(enable);
    },

    score: function(newScore) {
      if( typeof newScore !== 'undefined' && parseInt(newScore) >= 0 ) {
        this._filled.score = parseInt(newScore);
        this._$scoreText.text(this._filled_score);
      }
      return this._filled.score;
    },

    freesquares: function() {
      return this._filled.getFreeSpaces();
    },

    showStartMessage: function() {
      this._$start.show();
    },

    showGameOverMessage: function() {
      this._$gameover.show();
    },

    /**
     * Update the sizes of the renderer (this makes the game responsive)
     */
    updateSizes: function() {
      
      this._PIXEL_WIDTH = this.element.innerWidth();
      this._PIXEL_HEIGHT = this.element.innerHeight();

      this._BLOCK_WIDTH = this.options.blockWidth;
      this._BLOCK_HEIGHT = Math.floor(this.element.innerHeight() / this.element.innerWidth() * this._BLOCK_WIDTH);

      this._block_size = Math.floor(this._PIXEL_WIDTH / this._BLOCK_WIDTH);
      this._border_width = 2;

      // Recalculate the pixel width and height so the canvas always has the best possible size
      this._PIXEL_WIDTH = this._block_size * this._BLOCK_WIDTH;
      this._PIXEL_HEIGHT = this._block_size * this._BLOCK_HEIGHT;

      this._$canvas .attr('width', this._PIXEL_WIDTH)
                    .attr('height', this._PIXEL_HEIGHT);
      
      // 更新WebGL视口
      if (this.gl) {
        this.gl.viewport(0, 0, this._PIXEL_WIDTH, this._PIXEL_HEIGHT);
      }
    },

    // Theme
    _theme: {},

    // UI Elements
    _$game: null,
    _$canvas: null,
    _$gameholder: null,
    _$start: null,
    _$gameover: null,
    _$score: null,
    _$scoreText: null,

    // Canvas
    _canvas: null,

    // Initialization
    _create: function() {
      
      var game = this;

      this.theme(this.options.theme);

      this._createHolder();
      this._createUI();

      this._refreshBlockSizes();

      this.updateSizes();

      $(window).resize(function(){
        game.updateSizes();
      });

      this._SetupShapeFactory();
      this._SetupFilled();
      this._SetupInfo();
      this._SetupBoard();
      
      // 初始化WebGL
      this._initWebGL();

      this._info.init();
      this._board.init();

      var renderLoop = function(){
        requestAnimationFrame(renderLoop);
        game._board.render();
      };
      renderLoop();

      if( this.options.autoplay ) {
        this.autoplay(true);
        this._setupTouchControls(false);
      } else {
        this._setupControls(true);
        this._setupTouchControls(false);
      }

    },
    
    /**
     * 初始化WebGL
     */
    _initWebGL: function() {
      this._canvas = this._$canvas.get(0);
      this.gl = this._canvas.getContext('webgl') || this._canvas.getContext('experimental-webgl');
      
      if (!this.gl) {
        console.error('WebGL is not supported');
        return;
      }
      
      // 创建着色器程序
      this.program = this._createShaderProgram(this.vertexShaderSource, this.fragmentShaderSource);
      
      // 创建顶点缓冲区
      this._createBuffers();
      
      // 设置清除颜色
      this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
      
      // 启用深度测试
      this.gl.enable(this.gl.DEPTH_TEST);
    },
    
    /**
     * 创建着色器程序
     */
    _createShaderProgram: function(vertexSource, fragmentSource) {
      var gl = this.gl;
      
      // 创建顶点着色器
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);
      
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader compile error: ' + gl.getShaderInfoLog(vertexShader));
        return null;
      }
      
      // 创建片段着色器
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);
      
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader compile error: ' + gl.getShaderInfoLog(fragmentShader));
        return null;
      }
      
      // 创建程序
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader program link error: ' + gl.getProgramInfoLog(program));
        return null;
      }
      
      return program;
    },
    
    /**
     * 创建顶点缓冲区
     */
    _createBuffers: function() {
      var gl = this.gl;
      
      // 顶点缓冲区
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.cubeVertices, gl.STATIC_DRAW);
      
      // 索引缓冲区
      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.cubeIndices, gl.STATIC_DRAW);
    },

    _checkCollisions: function(x, y, blocks, checkDownOnly) {
      // x & y should be aspirational values
      var i = 0, len = blocks.length, a, b;
      for (; i<len; i += 2) {
        a = x + blocks[i];
        b = y + blocks[i+1];

        if (b >= this._BLOCK_HEIGHT || this._filled.check(a, b)) {
          return true;
        } else if (!checkDownOnly && a < 0 || a >= this._BLOCK_WIDTH) {
          return true;
        }
      }
      return false;
    },

    _board: null,
    _info: null,
    _filled: null,

    /**
     * Shapes
     */
    _shapeFactory: null,

    _shapes: {
      line: [
          [ 0, -1,   0, -2,   0, -3,   0, -4],
          [ 2, -2,   1, -2,   0, -2,  -1, -2],
          [ 0, -4,   0, -3,   0, -2,   0, -1],
          [-1, -2,   0, -2,   1, -2,   2, -2]
      ],
      square: [
        [0,  0,   1,  0,   0, -1,   1, -1],
        [1,  0,   1, -1,   0,  0,   0, -1],
        [1, -1,   0, -1,   1,  0,   0,  0],
        [0, -1,   0,  0,   1, -1,   1,  0]
      ],
      arrow: [
        [0, -1,   1, -1,   2, -1,   1, -2],
        [1,  0,   1, -1,   1, -2,   0, -1],
        [2, -1,   1, -1,   0, -1,   1,  0],
        [1, -2,   1, -1,   1,  0,   2, -1]
      ],
      rightHook: [
        [2,  0,   1,  0,   1, -1,   1, -2],
        [2, -2,   2, -1,   1, -1,   0, -1],
        [0, -2,   1, -2,   1, -1,   1,  0],
        [0,  0,   0, -1,   1, -1,   2, -1]
      ],
      leftHook: [
        [0,  0,   1,  0,   1, -1,   1, -2],
        [2,  0,   2, -1,   1, -1,   0, -1],
        [2, -2,   1, -2,   1, -1,   1,  0],
        [0, -2,   0, -1,   1, -1,   2, -1]
      ],
      leftZag: [
        [0,  0,   0, -1,   1, -1,   1, -2],
        [2, -1,   1, -1,   1, -2,   0, -2],
        [1, -2,   1, -1,   0, -1,   0,  0],
        [0, -2,   1, -2,   1, -1,   2, -1]
      ],
      rightZag: [
        [1,  0,   1, -1,   0, -1,   0, -2],
        [2, -1,   1, -1,   1,  0,   0,  0],
        [0, -2,   0, -1,   1, -1,   1,  0],
        [0,  0,   1,  0,   1, -1,   2, -1]
      ]
    },

    _SetupShapeFactory: function(){
      var game = this;
      if( this._shapeFactory !== null ){ return; }

      function Shape(game, orientations, symmetrical, blockType) {

        $.extend(this, {
          x: 0,
          y: 0,
          symmetrical: symmetrical,
          init: function() {
            $.extend(this, {
              orientation: 0,
              x: Math.floor(game._BLOCK_WIDTH / 2) - 1,
              y: -1,
              rotation: 0 // 3D旋转角度
            });
            return this;
          },

          blockType: blockType,
          blockVariation: null,
          blocksLen: orientations[0].length,
          orientations: orientations,
          orientation: 0, // 4 possible
          rotation: 0, // 3D旋转角度

          rotate: function(direction) {
            var orientation = (this.orientation + (direction === "left" ? 1 : -1) + 4) % 4;
            
            // 3D旋转效果
            this.rotation += direction === "left" ? Math.PI / 2 : -Math.PI / 2;

            if (!game._checkCollisions(
                this.x,
                this.y,
                this.getBlocks(orientation)
              )) {
              this.orientation = orientation;
              game._board.renderChanged = true;
            } else {
              var ogOrientation = this.orientation;
              var ogX = this.x;
              var ogY = this.y;

              this.orientation = orientation;

              while (this.x >= game._BLOCK_WIDTH - 2) {
                this.x--;
              }
              while (this.x < 0) {
                this.x++;
              }

              if (this.blockType === "line" && this.x === 0) this.x++;

              if ( game._checkCollisions(
                  this.x,
                  this.y,
                  this.getBlocks(orientation)
                )
              ) {
                  this.y--;
                  if (
                      game._checkCollisions(
                        this.x,
                        this.y,
                        this.getBlocks(orientation)
                      )
                  ) {
                      this.x = ogX;
                      this.y = ogY;
                      this.orientation = ogOrientation;
                  }
              }
              game._board.renderChanged = true;
            }
          },

          moveRight: function() {
            if (!game._checkCollisions(this.x + 1, this.y, this.getBlocks())) {
              this.x++;
              game._board.renderChanged = true;
            }
          },
          moveLeft: function() {
            if (!game._checkCollisions(this.x - 1, this.y, this.getBlocks())) {
              this.x--;
              game._board.renderChanged = true;
            }
          },
          drop: function() {
            if (!game._checkCollisions(this.x, this.y + 1, this.getBlocks())) {
              this.y++;
              // Reset the drop count, as we dropped the block sooner
              game._board.dropCount = -1;
              game._board.animate();
              game._board.renderChanged = true;
            }
          },

          getBlocks: function(orientation) { // optional param
            return this.orientations[orientation !== undefined ? orientation : this.orientation];
          },
          draw: function(_x, _y, _orientation) {
            var blocks = this.getBlocks(_orientation),
                x = _x === undefined ? this.x : _x,
                y = _y === undefined ? this.y : _y,
                i = 0,
                index = 0;

            for (; i<this.blocksLen; i += 2) {
              game._board.drawBlock(x + blocks[i], y + blocks[i+1], this.blockType, this.blockVariation, index, this.orientation, this.rotation, true);
              index++;
            }
          },
          getBounds: function(_blocks) { // _blocks can be an array of blocks, an orientation index, or undefined
            var blocks = $.isArray(_blocks) ? _blocks : this.getBlocks(_blocks),
                i=0, len=blocks.length, minx=999, maxx=-999, miny=999, maxy=-999;
            for (; i<len; i+=2) {
              if (blocks[i] < minx) { minx = blocks[i]; }
              if (blocks[i] > maxx) { maxx = blocks[i]; }
              if (blocks[i+1] < miny) { miny = blocks[i+1]; }
              if (blocks[i+1] > maxy) { maxy = blocks[i+1]; }
            }
            return {
              left: minx,
              right: maxx,
              top: miny,
              bottom: maxy,
              width: maxx - minx,
              height: maxy - miny
            };
          }
        });

        return this.init();
      };

      this._shapeFactory = {
        line: function() {
          return new Shape(game, game._shapes.line, false, 'line');
        },
        square: function() {
          return new Shape(game, game._shapes.square, false, 'square');
        },
        arrow: function() {
          return new Shape(game, game._shapes.arrow, false, 'arrow');
        },
        leftHook: function() {
          return new Shape(game, game._shapes.leftHook, false, 'leftHook');
        },
        rightHook: function() {
          return new Shape(game, game._shapes.rightHook, false, 'rightHook');
        },
        leftZag: function() {
          return new Shape(game, game._shapes.leftZag, false, 'leftZag');
        },
        rightZag: function() {
          return new Shape(game, game._shapes.rightZag, false, 'rightZag');
        }
      };
    },

    _SetupFilled: function() {
      var game = this;
      if( this._filled !== null ){ return; }

      this._filled = {
        data: new Array(game._BLOCK_WIDTH * game._BLOCK_HEIGHT),
        score: 0,
        toClear: {},
        check: function(x, y) {
          return this.data[this.asIndex(x, y)];
        },
        add: function(x, y, blockType, blockVariation, blockIndex, blockOrientation) {
          if (x >= 0 && x < game._BLOCK_WIDTH && y >= 0 && y < game._BLOCK_HEIGHT) {
            this.data[this.asIndex(x, y)] = {
              blockType: blockType, 
              blockVariation: blockVariation, 
              blockIndex: blockIndex, 
              blockOrientation: blockOrientation
            };
          }
        },
        getFreeSpaces: function() {
          var count = 0;
          for( var i=0; i<this.data.length; i++ ) {
            count += (this.data[i] ? 1 : 0);
          }
        },
        asIndex: function(x, y) {
          return x + y*game._BLOCK_WIDTH;
        },
        asX: function(index) {
          return index % game._BLOCK_WIDTH;
        },
        asY: function(index) {
          return Math.floor(index / game._BLOCK_WIDTH);
        },
        clearAll: function() {
          delete this.data;
          this.data = new Array(game._BLOCK_WIDTH * game._BLOCK_HEIGHT);
        },
        _popRow: function(row_to_pop) {
          for (var i=game._BLOCK_WIDTH*(row_to_pop+1) - 1; i>=0; i--) {
            this.data[i] = (i >= game._BLOCK_WIDTH ? this.data[i-game._BLOCK_WIDTH] : undefined);
          }
        },
        checkForClears: function() {
          var startLines = game._board.lines;
          var rows = [], i, len, count, mod;

          for (i=0, len=this.data.length; i<len; i++) {
            mod = this.asX(i);
            if (mod == 0) count = 0;
            if (this.data[i] && typeof this.data[i] !== 'undefined' && typeof this.data[i].blockType === 'string') {
              count += 1;
            }
            if (mod == game._BLOCK_WIDTH - 1 && count == game._BLOCK_WIDTH) {
              rows.push(this.asY(i));
            }
          }

          for (i=0, len=rows.length; i<len; i++) {
            this._popRow(rows[i]);
            game._board.lines++;
            if( game._board.lines % 10 == 0 && game._board.dropDelay > 1 ) {
              game._board.dropDelay *= 0.9;
            }
          }

          var clearedLines = game._board.lines - startLines;
          this._updateScore(clearedLines);
        },
        _updateScore: function(numLines) {
          if( numLines <= 0 ) { return; }
          var scores = [0,400,1000,3000,12000];
          if( numLines >= scores.length ){ numLines = scores.length-1 }

          this.score += scores[numLines];
          game._$scoreText.text(this.score);

          game.options.onLine.call(game.element, numLines, scores[numLines], this.score);
        },
        _resetScore: function() {
          this.score = 0;
          game._$scoreText.text(this.score);
        },
        draw: function() {
          for (var i=0, len=this.data.length, row, color; i<len; i++) {
            if (this.data[i] !== undefined) {
              row = this.asY(i);
              var block = this.data[i];
              game._board.drawBlock(this.asX(i), row, block.blockType, block.blockVariation, block.blockIndex, block.blockOrientation, 0, false);
            }
          }
        }
      };
    },

    _SetupInfo: function() {

      var game = this;

      this._info = {
        mode: game.options.difficulty,
        modes: [
          'normal',
          'nice',
          'evil'
        ],
        modesY: 170,
        autopilotY: null,

        init: function() {
        this.mode = game.options.difficulty;
      },
        setMode: function(mode) {
          this.mode = mode;
          game._board.nextShape(true);
        }
      };

    },

    _SetupBoard: function() {

      var game = this;
      var info = this._info;

      this._board = {
        // This sets the tick rate for the game
        animateDelay: 1000 / game.options.speed,

        animateTimeoutId: null,
        cur: null,

        lines: 0,

        // DropCount increments on each animation frame. After n frames, the piece drops 1 square
        // By making dropdelay lower (down to 0), the pieces move faster, up to once per tick (animateDelay).
        dropCount: 0,
        dropDelay: 5, //5,

        holding: {left: null, right: null, drop: null},
        holdingThreshold: 200, // How long do you have to hold a key to make commands repeat (in ms)

        started: false,
        gameover: false,

        renderChanged: true,

        init: function() {
          this.cur = this.nextShape();

          if( game.options.showFieldOnStart ) {
            game._board.createRandomBoard();
            game._board.render();
          }

          this.showStartMessage();
        },

        showStartMessage: function() {
          game._$start.show();
        },

        showGameOverMessage: function() {
          game._$gameover.show();
        },

        nextShape: function(_set_next_only) {
          var next = this.next,
            func, shape, result;

          if (info.mode == 'nice' || info.mode == 'evil') {
            func = game._niceShapes;
          }
          else {
            func = game._randomShapes();
          }

          if( game.options.no_preview ) {
            this.next = null;
            if (_set_next_only) return null;
            shape = func(game._filled, game._checkCollisions, game._BLOCK_WIDTH, game._BLOCK_HEIGHT, info.mode);
            if (!shape) throw new Error('No shape returned from shape function!', func);
            shape.init();
            result = shape;
          }
          else {
            shape = func(game._filled, game._checkCollisions, game._BLOCK_WIDTH, game._BLOCK_HEIGHT, info.mode);
            if (!shape) throw new Error('No shape returned from shape function!', func);
            shape.init();
            this.next = shape;
            if (_set_next_only) return null;
            result = next || this.nextShape();
          }

          if( game.options.autoplay ) { //fun little hack...
            game._niceShapes(game._filled, game._checkCollisions, game._BLOCK_WIDTH, game._BLOCK_HEIGHT, 'normal', result);
            result.orientation = result.best_orientation;
            result.x = result.best_x;
          }

          return result;
        },

        animate: function() {
          var drop = false,
              moved = false,
              gameOver = false,
              now = Date.now();

          if( this.animateTimeoutId ){ clearTimeout(this.animateTimeoutId); }

          if( !this.paused && !this.gameover ) {

            this.dropCount++;
            
            // Drop by delay or holding
            if( (this.dropCount >= this.dropDelay) || 
                (game.options.autoplay) || 
                (this.holding.drop && (now - this.holding.drop) >= this.holdingThreshold) ) {
              drop = true;
            moved = true;
              this.dropCount = 0;
            }

            // Move Left by holding
            if( this.holding.left && (now - this.holding.left) >= this.holdingThreshold ) {
              moved = true;
              this.cur.moveLeft();
            }

            // Move Right by holding
            if( this.holding.right && (now - this.holding.right) >= this.holdingThreshold ) {
              moved = true;
              this.cur.moveRight();
            }

            // Test for a collision, add the piece to the filled blocks and fetch the next one
            if (drop) {
              var cur = this.cur, x = cur.x, y = cur.y, blocks = cur.getBlocks();
              if (game._checkCollisions(x, y+1, blocks, true)) {
                drop = false;
                var blockIndex = 0;
                for (var i=0; i<cur.blocksLen; i+=2) {
                  game._filled.add(x + blocks[i], y + blocks[i+1], cur.blockType, cur.blockVariation, blockIndex, cur.orientation);
                  if (y + blocks[i] < 0) {
                    gameOver = true;
                  }
                  blockIndex++;
                }
                game._filled.checkForClears();
                this.cur = this.nextShape();
                this.renderChanged = true;

                // Stop holding drop (and any other buttons). Just in case the controls get sticky.
                this.holding.left = null;
                this.holding.right = null;
                this.holding.drop = null;

                game.options.onPlaced.call(game.element);
              }
            }
          }

          // Drop
          if (drop) {
            moved = true;
            this.cur.y++;
          }

          if( drop || moved ) {
            this.renderChanged = true;
          }

          if( gameOver ) {

            this.gameover = true;

            game.gameover();

            if( game.options.autoplay && game.options.autoplayRestart ) {
              // On autoplay, restart the game automatically
              game.restart();
            }
            this.renderChanged = true;

          } else {

            // Update the speed
            this.animateDelay = 1000 / game.options.speed;

            this.animateTimeoutId = window.setTimeout(function() {
              game._board.animate();
            }, this.animateDelay);

          }

        },

        createRandomBoard: function() {

          var start = [], blockTypes = [], i, ilen, j, jlen, blockType;

          // Draw a random blockrain screen
          blockTypes = Object.keys(game._shapeFactory);

          for (i=0, ilen=game._BLOCK_WIDTH; i<ilen; i++) {
            for (j=0, jlen=game._randChoice([game._randInt(0, 8), game._randInt(5, 9)]); j<jlen; j++) {
              if (!blockType || !game._randInt(0, 3)) blockType = game._randChoice(blockTypes);

              // Use a random piece and orientation
              // Todo: Use an actual random variation
              game._filled.add(i, game._BLOCK_HEIGHT - j, blockType, game._randInt(0,3), null, game._randInt(0,3));
            }
          }

          game._board.render(true);

        },

        render: function(forceRender) {
          if( this.renderChanged || forceRender ) {
            this.renderChanged = false;
            
            var gl = game.gl;
            if (!gl) return;
            
            // 清除颜色和深度缓冲区
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // 使用着色器程序
            gl.useProgram(game.program);
            
            // 设置光照 uniforms
            var lightDirectionLoc = gl.getUniformLocation(game.program, 'u_lightDirection');
            gl.uniform3fv(lightDirectionLoc, game.options.lightDirection);
            
            var ambientLightLoc = gl.getUniformLocation(game.program, 'u_ambientLight');
            gl.uniform1f(ambientLightLoc, game.options.ambientLight);
            
            var diffuseLightLoc = gl.getUniformLocation(game.program, 'u_diffuseLight');
            gl.uniform1f(diffuseLightLoc, game.options.diffuseLight);
            
            // 设置投影矩阵
            var projectionMatrix = game._createPerspectiveMatrix(
              game.options.cameraAngle * Math.PI / 180,
              game._PIXEL_WIDTH / game._PIXEL_HEIGHT,
              0.1,
              100.0
            );
            var projectionLoc = gl.getUniformLocation(game.program, 'u_projectionMatrix');
            gl.uniformMatrix4fv(projectionLoc, false, projectionMatrix);
            
            // 设置视图矩阵
            var viewMatrix = game._createViewMatrix();
            var viewLoc = gl.getUniformLocation(game.program, 'u_viewMatrix');
            gl.uniformMatrix4fv(viewLoc, false, viewMatrix);
            
            // 绑定顶点缓冲区
            gl.bindBuffer(gl.ARRAY_BUFFER, game.vertexBuffer);
            
            // 设置顶点属性
            var positionLoc = gl.getAttribLocation(game.program, 'a_position');
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 6 * 4, 0);
            
            var normalLoc = gl.getAttribLocation(game.program, 'a_normal');
            gl.enableVertexAttribArray(normalLoc);
            gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
            
            // 绑定索引缓冲区
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, game.indexBuffer);
            
            // 绘制已放置的方块
            game._filled.draw();
            
            // 绘制当前方块
            this.cur.draw();
          }
        },

        /**
         * Draws one block (Each piece is made of 4 blocks)
         * The blockType is used to draw any block. 
         * The falling attribute is needed to apply different styles for falling and placed blocks.
         */
        drawBlock: function(x, y, blockType, blockVariation, blockIndex, blockRotation, shapeRotation, falling) {
          
          var gl = game.gl;
          if (!gl) return;
          
          // 计算3D位置
          var size = game.options.cubeSize;
          var posX = (x - game._BLOCK_WIDTH / 2) * size;
          var posY = (y - game._BLOCK_HEIGHT / 2) * size;
          var posZ = 0;
          
          // 创建模型矩阵
          var modelMatrix = game._createModelMatrix(posX, posY, posZ, shapeRotation);
          var modelLoc = gl.getUniformLocation(game.program, 'u_modelMatrix');
          gl.uniformMatrix4fv(modelLoc, false, modelMatrix);
          
          // 设置颜色
          var color = game.blockColors[blockType] || [1.0, 1.0, 1.0, 1.0];
          
          // 如果是下落中的方块，稍微改变颜色以区分
          if (falling) {
            color[0] = Math.min(color[0] + 0.2, 1.0);
            color[1] = Math.min(color[1] + 0.2, 1.0);
            color[2] = Math.min(color[2] + 0.2, 1.0);
          }
          
          // 设置颜色uniform
          var colorLoc = gl.getUniformLocation(game.program, 'u_color');
          gl.uniform4fv(colorLoc, color);
          
          // 绘制立方体
          gl.drawElements(gl.TRIANGLES, game.cubeIndices.length, gl.UNSIGNED_SHORT, 0);
        }

      };

      game._niceShapes = game._getNiceShapes();
    },
    
    /**
     * 创建透视投影矩阵
     */
    _createPerspectiveMatrix: function(fov, aspect, near, far) {
      var f = 1.0 / Math.tan(fov / 2);
      var rangeInv = 1.0 / (near - far);
      
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
      ]);
    },
    
    /**
     * 创建视图矩阵
     */
    _createViewMatrix: function() {
      var angle = this.options.cameraAngle * Math.PI / 180;
      var distance = this.options.cameraDistance;
      
      // 相机位置
      var eyeX = 0;
      var eyeY = Math.sin(angle) * distance;
      var eyeZ = Math.cos(angle) * distance;
      
      // 目标位置
      var centerX = 0;
      var centerY = 0;
      var centerZ = 0;
      
      // 上方向
      var upX = 0;
      var upY = 1;
      var upZ = 0;
      
      // 计算视图矩阵
      var z0 = eyeX - centerX;
      var z1 = eyeY - centerY;
      var z2 = eyeZ - centerZ;
      var zLength = Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
      z0 /= zLength;
      z1 /= zLength;
      z2 /= zLength;
      
      var x0 = upY * z2 - upZ * z1;
      var x1 = upZ * z0 - upX * z2;
      var x2 = upX * z1 - upY * z0;
      var xLength = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
      x0 /= xLength;
      x1 /= xLength;
      x2 /= xLength;
      
      var y0 = z1 * x2 - z2 * x1;
      var y1 = z2 * x0 - z0 * x2;
      var y2 = z0 * x1 - z1 * x0;
      
      var translationX = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
      var translationY = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
      var translationZ = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
      
      return new Float32Array([
        x0, y0, z0, 0,
        x1, y1, z1, 0,
        x2, y2, z2, 0,
        translationX, translationY, translationZ, 1
      ]);
    },
    
    /**
     * 创建模型矩阵
     */
    _createModelMatrix: function(x, y, z, rotation) {
      var size = this.options.cubeSize;
      
      // 缩放
      var scaleX = size;
      var scaleY = size;
      var scaleZ = size;
      
      // 旋转（绕Y轴）
      var cos = Math.cos(rotation);
      var sin = Math.sin(rotation);
      
      // 平移
      var translateX = x;
      var translateY = y;
      var translateZ = z;
      
      // 组合矩阵
      return new Float32Array([
        scaleX * cos, 0, scaleX * sin, 0,
        0, scaleY, 0, 0,
        -scaleZ * sin, 0, scaleZ * cos, 0,
        translateX, translateY, translateZ, 1
      ]);
    },

    // Utility Functions
    _randInt: function(a, b) { return a + Math.floor(Math.random() * (1 + b - a)); },
    _randSign: function() { return this._randInt(0, 1) * 2 - 1; },
    _randChoice: function(choices) { return choices[this._randInt(0, choices.length-1)]; },

    _createHolder: function() {

      // Create the main holder (it holds all the ui elements, the original element is just the wrapper)
      this._$gameholder = $('<div class="blockrain-game-holder"></div>');
      this._$gameholder.css('position', 'relative').css('width', '100%').css('height', '100%');

      this.element.html('').append(this._$gameholder);

      // Create the game canvas and context
      this._$canvas = $('<canvas style="display:block; width:100%; height:100%; padding:0; margin:0; border:none; background-color: #111;" />');
      this._$gameholder.append(this._$canvas);

    },

    _createUI: function() {

      var game = this;

      // Score
      game._$score = $(
        '<div class="blockrain-score-holder" style="position:absolute; top:10px; left:10px; color:white; font-family:Arial, sans-serif; z-index:10;">'+ 
          '<div class="blockrain-score">'+ 
            '<div class="blockrain-score-msg">'+ this.options.scoreText +'</div>'+ 
            '<div class="blockrain-score-num">0</div>'+ 
          '</div>'+ 
        '</div>').hide();
      game._$scoreText = game._$score.find('.blockrain-score-num');
      game._$gameholder.append(game._$score);

      // Create the start menu
      game._$start = $(
        '<div class="blockrain-start-holder" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; color:white; font-family:Arial, sans-serif; z-index:10;">'+ 
          '<div class="blockrain-start">'+ 
            '<div class="blockrain-start-msg" style="font-size:24px; margin-bottom:20px;">'+ this.options.playText +'</div>'+ 
            '<a class="blockrain-btn blockrain-start-btn" style="display:inline-block; padding:10px 20px; background-color:rgba(255,255,255,0.2); border:1px solid white; text-decoration:none; color:white; cursor:pointer;">'+ this.options.playButtonText +'</a>'+ 
          '</div>'+ 
        '</div>').hide();
      game._$gameholder.append(game._$start);

      game._$start.find('.blockrain-start-btn').click(function(event){
        event.preventDefault();
        game.start();
      });

      // Create the game over menu
      game._$gameover = $(
        '<div class="blockrain-game-over-holder" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; color:white; font-family:Arial, sans-serif; z-index:10;">'+ 
          '<div class="blockrain-game-over">'+ 
            '<div class="blockrain-game-over-msg" style="font-size:24px; margin-bottom:20px;">'+ this.options.gameOverText +'</div>'+ 
            '<a class="blockrain-btn blockrain-game-over-btn" style="display:inline-block; padding:10px 20px; background-color:rgba(255,255,255,0.2); border:1px solid white; text-decoration:none; color:white; cursor:pointer;">'+ this.options.restartButtonText +'</a>'+ 
          '</div>'+ 
        '</div>').hide();
      game._$gameover.find('.blockrain-game-over-btn').click(function(event){
        event.preventDefault();
        game.restart();
      });
      game._$gameholder.append(game._$gameover);

      this._createControls();
    },

    _createControls: function() {

      var game = this;

      game._$touchLeft = $('<a class="blockrain-touch blockrain-touch-left" />').appendTo(game._$gameholder);
      game._$touchRight = $('<a class="blockrain-touch blockrain-touch-right" />').appendTo(game._$gameholder);
      game._$touchRotateRight = $('<a class="blockrain-touch blockrain-touch-rotate-right" />').appendTo(game._$gameholder);
      game._$touchRotateLeft = $('<a class="blockrain-touch blockrain-touch-rotate-left" />').appendTo(game._$gameholder);
      game._$touchDrop = $('<a class="blockrain-touch blockrain-touch-drop" />').appendTo(game._$gameholder);

    },

    _refreshBlockSizes: function() {

      if( this.options.autoBlockWidth ) {
        this.options.blockWidth = Math.ceil( this.element.width() / this.options.autoBlockSize );
      }

    },

    _getNiceShapes: function() {
      /*
       * Things I need for this to work...
       *  - ability to test each shape with this._filled data
       *  - maybe give empty spots scores? and try to maximize the score?
       */

      var game = this;

      var shapes = {},
          attr;

      for( var attr in this._shapeFactory ) {
        shapes[attr] = this._shapeFactory[attr]();
      }

      function scoreBlocks(possibles, blocks, x, y, filled, width, height) {
        var i, len=blocks.length, score=0, bottoms = {}, tx, ty, overlaps;

        // base score
        for (i=0; i<len; i+=2) {
          score += possibles[game._filled.asIndex(x + blocks[i], y + blocks[i+1])] || 0;
        }

        // overlap score -- //TODO - don't count overlaps if cleared?
        for (i=0; i<len; i+=2) {
          tx = blocks[i];
          ty = blocks[i+1];
          if (bottoms[tx] === undefined || bottoms[tx] < ty) {
            bottoms[tx] = ty;
          }
        }
        overlaps = 0;
        for (tx in bottoms) {
          tx = parseInt(tx);
          for (ty=bottoms[tx]+1, i=0; y+ty<height; ty++, i++) {
            if (!game._filled.check(x + tx, y + ty)) {
              overlaps += i == 0 ? 2 : 1; //TODO-score better
              //if (i == 0) overlaps += 1;
              break;
            }
          }
        }

        score = score - overlaps;

        return score;
      }

      function resetShapes() {
        for (var attr in shapes) {
          shapes[attr].x = 0;
          shapes[attr].y = -1;
        }
      }

      //TODO -- evil mode needs to realize that overlap is bad...
      var func = function(filled, checkCollisions, width, height, mode, _one_shape) {
        if (!_one_shape) resetShapes();

        var possibles = new Array(width * height),
            evil = mode == 'evil',
            x, y, py,
            attr, shape, i, blocks, bounds,
            score, best_shape, best_score = (evil ? 1 : -1) * 999, best_orientation, best_x,
            best_score_for_shape, best_orientation_for_shape, best_x_for_shape;

        for (x=0; x<width; x++) {
          for (y=0; y<=height; y++) {
            if (y == height || filled.check(x, y)) {
              for (py=y-4; py<y; py++) {
                possibles[filled.asIndex(x, py)] = py; //TODO - figure out better scoring?
              }
              break;
            }
          }
        }

        // for each shape...
        var opts = _one_shape === undefined ? shapes : {cur: _one_shape}; //BOO
        for (attr in opts) { //TODO - check in random order to prevent later shapes from winning
          shape = opts[attr];
          best_score_for_shape = -999;

          // for each orientation...
          for (i=0; i<(shape.symmetrical ? 2 : 4); i++) { //TODO - only look at unique orientations
            blocks = shape.getBlocks(i);
            bounds = shape.getBounds(blocks);

            // try each possible position...
            for (x=-bounds.left; x<width - bounds.width; x++) {
              for (y=-1; y<height - bounds.bottom; y++) {
                if( game._checkCollisions(x, y + 1, blocks, true) ) {
                  // collision
                  score = scoreBlocks(possibles, blocks, x, y, filled, width, height);
                  if (score > best_score_for_shape) {
                    best_score_for_shape = score;
                    best_orientation_for_shape = i;
                    best_x_for_shape = x;
                  }
                  break;
                }
              }
            }
          }

          if ((evil && best_score_for_shape < best_score) ||
              (!evil && best_score_for_shape > best_score)) {
            best_shape = shape;
            best_score = best_score_for_shape;
            best_orientation = best_orientation_for_shape;
            best_x = best_x_for_shape;
          }
        }

        best_shape.best_orientation = best_orientation;
        best_shape.best_x = best_x;

        return best_shape;
      };

      func.no_preview = true;
      return func;
    },

    _randomShapes: function() {
      // Todo: The shapefuncs should be cached.
      var shapeFuncs = [];
      $.each(this._shapeFactory, function(k,v) { shapeFuncs.push(v); });

      return this._randChoice(shapeFuncs);
    },

    /**
     * Controls
     */
    _setupControls: function(enable) {

      var game = this;

      var moveLeft = function(start) {
        if( ! start ) { game._board.holding.left = null; return; }
        if( ! game._board.holding.left ) {
          game._board.cur.moveLeft(); 
          game._board.holding.left = Date.now();
          game._board.holding.right = null; 
        }
      }
      var moveRight = function(start) {
        if( ! start ) { game._board.holding.right = null; return; }
        if( ! game._board.holding.right ) {
          game._board.cur.moveRight(); 
          game._board.holding.right = Date.now();
          game._board.holding.left = null; 
        }
      }
      var drop = function(start) {
        if( ! start ) { game._board.holding.drop = null; return; }
        if( ! game._board.holding.drop ) {
          game._board.cur.drop(); 
          game._board.holding.drop = Date.now();
        }
      }
      var rotateLeft = function() {
        game._board.cur.rotate('left'); 
      }
      var rotateRight = function() {
        game._board.cur.rotate('right'); 
      }

      // Handlers: These are used to be able to bind/unbind controls
      var handleKeyDown = function(evt) {
        if( ! game._board.cur ) { return true; }
        var caught = false;

        caught = true;
        if (game.options.asdwKeys) {
          switch(evt.keyCode) {
            case 65: /*a*/    moveLeft(true); break;
            case 68: /*d*/    moveRight(true); break;
            case 83: /*s*/    drop(true); break;
            case 87: /*w*/    game._board.cur.rotate('right'); break;
          }
        }
        switch(evt.keyCode) {
          case 37: /*left*/   moveLeft(true); break;
          case 39: /*right*/  moveRight(true); break;
          case 40: /*down*/   drop(true); break;
          case 38: /*up*/     game._board.cur.rotate('right'); break;
          case 88: /*x*/      game._board.cur.rotate('right'); break;
          case 90: /*z*/      game._board.cur.rotate('left'); break;
          default: caught = false;
        }
        if (caught) evt.preventDefault();
        return !caught;
      };

      var handleKeyUp = function(evt) {
        if( ! game._board.cur ) { return true; }
        var caught = false;

        caught = true;
        if (game.options.asdwKeys) {
          switch(evt.keyCode) {
            case 65: /*a*/    moveLeft(false); break;
            case 68: /*d*/    moveRight(false); break;
            case 83: /*s*/    drop(false); break;
          }
        }
        switch(evt.keyCode) {
          case 37: /*left*/   moveLeft(false); break;
          case 39: /*right*/  moveRight(false); break;
          case 40: /*down*/   drop(false); break;
          default: caught = false;
        }
        if (caught) evt.preventDefault();
        return !caught;
      };

      function isStopKey(evt) {
        var cfg = {
          stopKeys: {37:1, 38:1, 39:1, 40:1}
        };

        var isStop = (cfg.stopKeys[evt.keyCode] || (cfg.moreStopKeys && cfg.moreStopKeys[evt.keyCode]));
        if (isStop) evt.preventDefault();
        return isStop;
      }

      function getKey(evt) { return 'safekeypress.' + evt.keyCode; }

      function keydown(evt) {
        var key = getKey(evt);
        $.data(this, key, ($.data(this, key) || 0) - 1);
        return handleKeyDown.call(this, evt);
      }

      function keyup(evt) {
        $.data(this, getKey(evt), 0);
        handleKeyUp.call(this, evt);
        return isStopKey(evt);
      }

      // Unbind everything by default
      // Use event namespacing so we don't ruin other keypress events
      $(document) .unbind('keydown.blockrain')
                  .unbind('keyup.blockrain');

      if( ! game.options.autoplay ) {
        if( enable ) {
          $(document) .bind('keydown.blockrain', keydown)
                      .bind('keyup.blockrain', keyup);
        }
      }
    },

    _setupTouchControls: function(enable) {

      var game = this;

      // Movements can be held for faster movement
      var moveLeft = function(event){
        event.preventDefault();
        game._board.cur.moveLeft();
        game._board.holding.left = Date.now();
        game._board.holding.right = null;
        game._board.holding.drop = null;
      };
      var moveRight = function(event){
        event.preventDefault();
        game._board.cur.moveRight();
        game._board.holding.right = Date.now();
        game._board.holding.left = null;
        game._board.holding.drop = null;
      };
      var drop = function(event){
        event.preventDefault();
        game._board.cur.drop();
        game._board.holding.drop = Date.now();
      };
      var endMoveLeft = function(event){
        event.preventDefault();
        game._board.holding.left = null;
      };
      var endMoveRight = function(event){
        event.preventDefault();
        game._board.holding.right = null;
      };
      var endDrop = function(event){
        event.preventDefault();
        game._board.holding.drop = null;
      };

      // Rotations can't be held
      var rotateLeft = function(event){
        event.preventDefault();
        game._board.cur.rotate('left');
      };
      var rotateRight = function(event){
        event.preventDefault();
        game._board.cur.rotate('right');
      };

      // Unbind everything by default
      game._$touchLeft.unbind('touchstart touchend click');
      game._$touchRight.unbind('touchstart touchend click');
      game._$touchRotateLeft.unbind('touchstart touchend click');
      game._$touchRotateRight.unbind('touchstart touchend click');
      game._$touchDrop.unbind('touchstart touchend click');

      if( ! game.options.autoplay && enable ) {
        game._$touchLeft.show().bind('touchstart click', moveLeft).bind('touchend', endMoveLeft);
        game._$touchRight.show().bind('touchstart click', moveRight).bind('touchend', endMoveRight);
        game._$touchDrop.show().bind('touchstart click', drop).bind('touchend', endDrop);
        game._$touchRotateLeft.show().bind('touchstart click', rotateLeft);
        game._$touchRotateRight.show().bind('touchstart click', rotateRight);
      } else {
        game._$touchLeft.hide();
        game._$touchRight.hide();
        game._$touchRotateLeft.hide();
        game._$touchRotateRight.hide();
        game._$touchDrop.hide();
      }

    }

  });

})(jQuery));