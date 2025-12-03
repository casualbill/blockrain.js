class BlockRain3D {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.gameState = {
            score: 0,
            lines: 0,
            level: 1,
            isGameOver: false,
            isPaused: false
        };
        
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.board = Array(this.boardHeight * this.boardWidth).fill(null);
        
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.cubeSize = 1.0;
        this.boardOffsetX = -this.boardWidth * this.cubeSize / 2;
        this.boardOffsetY = -this.boardHeight * this.cubeSize / 2;
        
        this.colors = {
            I: [0.0, 1.0, 1.0, 1.0],    // Cyan
            O: [1.0, 1.0, 0.0, 1.0],    // Yellow
            T: [0.8, 0.0, 0.8, 1.0],    // Purple
            S: [0.0, 1.0, 0.0, 1.0],    // Green
            Z: [1.0, 0.0, 0.0, 1.0],    // Red
            J: [0.0, 0.0, 1.0, 1.0],    // Blue
            L: [1.0, 0.5, 0.0, 1.0]     // Orange
        };
        
        this.shapes = {
            I: [[[0,0],[1,0],[2,0],[3,0]], [[1,0],[1,1],[1,2],[1,3]]],
            O: [[[0,0],[1,0],[0,1],[1,1]]],
            T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
            S: [[[1,0],[2,0],[0,1],[1,1]], [[0,0],[0,1],[1,1],[1,2]]],
            Z: [[[0,0],[1,0],[1,1],[2,1]], [[1,0],[0,1],[1,1],[0,2]]],
            J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
            L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]]
        };
        
        this.initWebGL();
        this.initGame();
        this.setupControls();
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    initWebGL() {
        const vertexShaderSource = `
            attribute vec3 position;
            attribute vec3 normal;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform vec4 color;
            
            varying vec4 vColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vColor = color;
                vNormal = normal;
                vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec4 vColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                vec3 normal = normalize(vNormal);
                
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 ambient = vec3(0.3);
                vec3 diffuse = diff * vColor.rgb;
                
                vec3 viewDir = normalize(-vPosition);
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                vec3 specular = vec3(0.5) * spec;
                
                gl_FragColor = vec4(ambient + diffuse + specular, vColor.a);
            }
        `;
        
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(this.vertexShader, this.fragmentShader);
        
        if (!this.program) {
            console.error('Failed to create WebGL program');
            return;
        }
        
        this.positionAttribute = this.gl.getAttribLocation(this.program, 'position');
        this.normalAttribute = this.gl.getAttribLocation(this.program, 'normal');
        this.colorUniform = this.gl.getUniformLocation(this.program, 'color');
        this.modelMatrixUniform = this.gl.getUniformLocation(this.program, 'modelMatrix');
        this.viewMatrixUniform = this.gl.getUniformLocation(this.program, 'viewMatrix');
        this.projectionMatrixUniform = this.gl.getUniformLocation(this.program, 'projectionMatrix');
        
        this.cubeVertices = this.createCubeVertices();
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cubeVertices), this.gl.STATIC_DRAW);
        
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        this.gl.cullFace(this.gl.BACK);
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    createCubeVertices() {
        const size = this.cubeSize;
        const vertices = [];
        
        const verticesData = [
            // Front face
            -size/2, -size/2,  size/2,
             size/2, -size/2,  size/2,
             size/2,  size/2,  size/2,
            -size/2,  size/2,  size/2,
            // Back face
            -size/2, -size/2, -size/2,
            -size/2,  size/2, -size/2,
             size/2,  size/2, -size/2,
             size/2, -size/2, -size/2,
            // Left face
            -size/2, -size/2, -size/2,
            -size/2, -size/2,  size/2,
            -size/2,  size/2,  size/2,
            -size/2,  size/2, -size/2,
            // Right face
             size/2, -size/2, -size/2,
             size/2,  size/2, -size/2,
             size/2,  size/2,  size/2,
             size/2, -size/2,  size/2,
            // Bottom face
            -size/2, -size/2, -size/2,
             size/2, -size/2, -size/2,
             size/2, -size/2,  size/2,
            -size/2, -size/2,  size/2,
            // Top face
            -size/2,  size/2, -size/2,
            -size/2,  size/2,  size/2,
             size/2,  size/2,  size/2,
             size/2,  size/2, -size/2
        ];
        
        const normalsData = [
            // Front face
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            // Back face
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            // Right face
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            // Bottom face
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            // Top face
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0
        ];
        
        for (let i = 0; i < verticesData.length; i += 3) {
            vertices.push(
                verticesData[i],
                verticesData[i + 1],
                verticesData[i + 2],
                normalsData[i],
                normalsData[i + 1],
                normalsData[i + 2]
            );
        }
        
        return vertices;
    }
    
    initGame() {
        this.board.fill(null);
        this.gameState.score = 0;
        this.gameState.lines = 0;
        this.gameState.level = 1;
        this.gameState.isGameOver = false;
        this.gameState.isPaused = false;
        
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.lastDropTime = Date.now();
        
        this.updateUI();
    }
    
    createPiece() {
        const shapeTypes = Object.keys(this.shapes);
        const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        const shape = this.shapes[type];
        const rotation = 0;
        
        return {
            type: type,
            shape: shape,
            rotation: rotation,
            x: Math.floor(this.boardWidth / 2) - 1,
            y: 0,
            color: this.colors[type]
        };
    }
    
    createModelMatrix(x, y, z) {
        const scale = 0.9;
        return new Float32Array([
            scale, 0, 0, 0,
            0, scale, 0, 0,
            0, 0, scale, 0,
            x, y, z, 1
        ]);
    }
    
    createViewMatrix() {
        const eyeX = 0;
        const eyeY = -20;
        const eyeZ = 30;
        const centerX = 0;
        const centerY = 0;
        const centerZ = 0;
        const upX = 0;
        const upY = 1;
        const upZ = 0;
        
        const zx = eyeX - centerX;
        const zy = eyeY - centerY;
        const zz = eyeZ - centerZ;
        const zLength = Math.sqrt(zx*zx + zy*zy + zz*zz);
        const zxNorm = zx / zLength;
        const zyNorm = zy / zLength;
        const zzNorm = zz / zLength;
        
        const xLength = Math.sqrt(upY*upY + upZ*upZ);
        const xxNorm = 0;
        const xyNorm = upZ / xLength;
        const xzNorm = -upY / xLength;
        
        const yxNorm = zyNorm * xzNorm - zzNorm * xyNorm;
        const yyNorm = zzNorm * xxNorm - zxNorm * xzNorm;
        const yzNorm = zxNorm * xyNorm - zyNorm * xxNorm;
        
        return new Float32Array([
            xxNorm, yxNorm, zxNorm, 0,
            xyNorm, yyNorm, zyNorm, 0,
            xzNorm, yzNorm, zzNorm, 0,
            -xxNorm*eyeX - xyNorm*eyeY - xzNorm*eyeZ,
            -yxNorm*eyeX - yyNorm*eyeY - yzNorm*eyeZ,
            -zxNorm*eyeX - zyNorm*eyeY - zzNorm*eyeZ,
            0, 0, 0, 1
        ]);
    }
    
    createProjectionMatrix() {
        const fieldOfView = 45 * Math.PI / 180;
        const aspect = this.canvas.width / this.canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;
        const f = 1.0 / Math.tan(fieldOfView / 2);
        const nf = 1.0 / (zNear - zFar);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (zFar + zNear) * nf, -1,
            0, 0, 2 * zFar * zNear * nf, 0
        ]);
    }
    
    drawCube(x, y, z, color) {
        const worldX = this.boardOffsetX + (x + 0.5) * this.cubeSize;
        const worldY = this.boardOffsetY + (y + 0.5) * this.cubeSize;
        const worldZ = z * this.cubeSize;
        
        const modelMatrix = this.createModelMatrix(worldX, worldY, worldZ);
        
        this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix);
        this.gl.uniform4fv(this.colorUniform, color);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        
        this.gl.vertexAttribPointer(this.positionAttribute, 3, this.gl.FLOAT, false, 24, 0);
        this.gl.enableVertexAttribArray(this.positionAttribute);
        
        this.gl.vertexAttribPointer(this.normalAttribute, 3, this.gl.FLOAT, false, 24, 12);
        this.gl.enableVertexAttribArray(this.normalAttribute);
        
        for (let i = 0; i < 6; i++) {
            this.gl.drawArrays(this.gl.TRIANGLE_FAN, i * 4, 4);
        }
        
        this.gl.disableVertexAttribArray(this.positionAttribute);
        this.gl.disableVertexAttribArray(this.normalAttribute);
    }
    
    drawGrid() {
        this.gl.uniform4fv(this.colorUniform, [0.3, 0.3, 0.4, 0.5]);
        
        const lineVertices = [
            -this.boardWidth * this.cubeSize / 2, -this.boardHeight * this.cubeSize / 2, 0,
             this.boardWidth * this.cubeSize / 2, -this.boardHeight * this.cubeSize / 2, 0,
             this.boardWidth * this.cubeSize / 2,  this.boardHeight * this.cubeSize / 2, 0,
            -this.boardWidth * this.cubeSize / 2,  this.boardHeight * this.cubeSize / 2, 0
        ];
        
        const lineBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lineBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lineVertices), this.gl.STATIC_DRAW);
        
        this.gl.vertexAttribPointer(this.positionAttribute, 3, this.gl.FLOAT, false, 12, 0);
        this.gl.enableVertexAttribArray(this.positionAttribute);
        
        this.gl.drawArrays(this.gl.LINE_LOOP, 0, 4);
        
        this.gl.deleteBuffer(lineBuffer);
        this.gl.disableVertexAttribArray(this.positionAttribute);
    }
    
    render() {
        this.gl.clearColor(0.1, 0.1, 0.15, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.gl.useProgram(this.program);
        
        const viewMatrix = this.createViewMatrix();
        const projectionMatrix = this.createProjectionMatrix();
        
        this.gl.uniformMatrix4fv(this.viewMatrixUniform, false, viewMatrix);
        this.gl.uniformMatrix4fv(this.projectionMatrixUniform, false, projectionMatrix);
        
        this.drawGrid();
        
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const block = this.board[y * this.boardWidth + x];
                if (block) {
                    this.drawCube(x, y, 0, block.color);
                }
            }
        }
        
        if (this.currentPiece) {
            const shape = this.currentPiece.shape[this.currentPiece.rotation];
            for (let i = 0; i < shape.length; i++) {
                const [dx, dy] = shape[i];
                const x = this.currentPiece.x + dx;
                const y = this.currentPiece.y + dy;
                this.drawCube(x, y, 0.5, this.currentPiece.color);
            }
        }
    }
    
    checkCollision(x, y, rotation) {
        const shape = this.currentPiece.shape[rotation];
        
        for (let i = 0; i < shape.length; i++) {
            const [dx, dy] = shape[i];
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX < 0 || newX >= this.boardWidth || newY >= this.boardHeight) {
                return true;
            }
            
            if (newY >= 0 && this.board[newY * this.boardWidth + newX]) {
                return true;
            }
        }
        
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.rotation)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const newRotation = (this.currentPiece.rotation + 1) % this.currentPiece.shape.length;
        
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, newRotation)) {
            this.currentPiece.rotation = newRotation;
        }
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        const shape = this.currentPiece.shape[this.currentPiece.rotation];
        
        for (let i = 0; i < shape.length; i++) {
            const [dx, dy] = shape[i];
            const x = this.currentPiece.x + dx;
            const y = this.currentPiece.y + dy;
            
            if (y >= 0) {
                this.board[y * this.boardWidth + x] = {
                    color: this.currentPiece.color
                };
            }
        }
        
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.rotation)) {
            this.gameOver();
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            let isFull = true;
            
            for (let x = 0; x < this.boardWidth; x++) {
                if (!this.board[y * this.boardWidth + x]) {
                    isFull = false;
                    break;
                }
            }
            
            if (isFull) {
                linesCleared++;
                for (let yy = y; yy > 0; yy--) {
                    for (let x = 0; x < this.boardWidth; x++) {
                        this.board[yy * this.boardWidth + x] = this.board[(yy - 1) * this.boardWidth + x];
                    }
                }
                for (let x = 0; x < this.boardWidth; x++) {
                    this.board[x] = null;
                }
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.gameState.lines += linesCleared;
            this.gameState.score += [0, 100, 300, 500, 800][linesCleared] * this.gameState.level;
            this.gameState.level = Math.floor(this.gameState.lines / 10) + 1;
            this.updateUI();
        }
    }
    
    gameOver() {
        this.gameState.isGameOver = true;
        document.getElementById('game-over').style.display = 'block';
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('lines').textContent = this.gameState.lines;
        document.getElementById('level').textContent = this.gameState.level;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState.isGameOver) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    while (this.movePiece(0, 1));
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.gameState.isPaused = !this.gameState.isPaused;
                    break;
            }
        });
        
        document.getElementById('btn-left').addEventListener('click', () => this.movePiece(-1, 0));
        document.getElementById('btn-right').addEventListener('click', () => this.movePiece(1, 0));
        document.getElementById('btn-down').addEventListener('click', () => this.movePiece(0, 1));
        document.getElementById('btn-rotate').addEventListener('click', () => this.rotatePiece());
        document.getElementById('btn-hard-drop').addEventListener('click', () => this.hardDrop());
        document.getElementById('btn-restart').addEventListener('click', () => {
            document.getElementById('game-over').style.display = 'none';
            this.initGame();
        });
    }
    
    gameLoop() {
        if (!this.lastDropTime) {
            this.lastDropTime = Date.now();
        }
        
        if (!this.gameState.isGameOver && !this.gameState.isPaused) {
            this.render();
            
            const dropInterval = Math.max(100, 1000 - (this.gameState.level - 1) * 100);
            if (Date.now() - this.lastDropTime > dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                }
                this.lastDropTime = Date.now();
            }
        } else {
            this.render();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new BlockRain3D();
});