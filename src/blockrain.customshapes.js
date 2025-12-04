((function ($) {

  "use strict";

  /**
   * Custom Shape Manager
   * Handles creation, saving, loading, and management of custom shapes
   */
  function CustomShapeManager(game) {
    this.game = game;
    this.customShapes = this.loadCustomShapes();
    this.maxShapes = 20;
    this.maxBlocks = 6;
    this.gridSize = 5; // 5x5 grid for shape creation
  }

  CustomShapeManager.prototype = {
    /**
     * Load custom shapes from localStorage
     */
    loadCustomShapes: function () {
      var saved = localStorage.getItem('blockrain_custom_shapes');
      return saved ? JSON.parse(saved) : [];
    },

    /**
     * Save custom shapes to localStorage
     */
    saveCustomShapes: function () {
      localStorage.setItem('blockrain_custom_shapes', JSON.stringify(this.customShapes));
    },

    /**
     * Check if user has reached the maximum number of custom shapes
     */
    hasReachedMaxShapes: function () {
      return this.customShapes.length >= this.maxShapes;
    },

    /**
     * Validate a custom shape
     * - Check if all blocks are within 5x5 grid
     * - Check if blocks are connected
     * - Check if there are no overlapping blocks
     * - Check if number of blocks is between 1 and maxBlocks
     */
    validateShape: function (blocks) {
      // Check number of blocks
      if (blocks.length < 1 || blocks.length > this.maxBlocks) {
        return { valid: false, message: '形状必须包含1到6个方块' };
      }

      // Check if all blocks are within 5x5 grid and no overlaps
      var grid = new Array(this.gridSize * this.gridSize).fill(false);
      for (var i = 0; i < blocks.length; i++) {
        var x = blocks[i].x;
        var y = blocks[i].y;

        // Check if within grid bounds
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
          return { valid: false, message: '所有方块必须在5×5网格范围内' };
        }

        // Check for overlaps
        var index = x + y * this.gridSize;
        if (grid[index]) {
          return { valid: false, message: '方块不能重叠' };
        }
        grid[index] = true;
      }

      // Check if all blocks are connected
      if (!this.isConnected(blocks)) {
        return { valid: false, message: '所有方块必须连接在一起' };
      }

      return { valid: true, message: '形状验证通过' };
    },

    /**
     * Check if all blocks in a shape are connected
     */
    isConnected: function (blocks) {
      if (blocks.length <= 1) {
        return true;
      }

      // Use BFS to check connectivity
      var visited = new Array(blocks.length).fill(false);
      var queue = [0]; // Start with first block
      visited[0] = true;
      var connectedCount = 1;

      while (queue.length > 0) {
        var currentIndex = queue.shift();
        var currentBlock = blocks[currentIndex];

        // Check all adjacent blocks (up, down, left, right)
        for (var i = 0; i < blocks.length; i++) {
          if (!visited[i]) {
            var dx = Math.abs(blocks[i].x - currentBlock.x);
            var dy = Math.abs(blocks[i].y - currentBlock.y);

            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
              visited[i] = true;
              queue.push(i);
              connectedCount++;
            }
          }
        }
      }

      return connectedCount === blocks.length;
    },

    /**
     * Create a custom shape
     * - Validate the shape
     * - Generate all rotations
     * - Add to custom shapes list
     * - Save to localStorage
     */
    createCustomShape: function (name, blocks) {
      // Check if name is empty
      if (!name.trim()) {
        return { success: false, message: '形状名称不能为空' };
      }

      // Check if name already exists
      if (this.customShapes.some(shape => shape.name === name.trim())) {
        return { success: false, message: '形状名称已存在' };
      }

      // Check if user has reached max shapes
      if (this.hasReachedMaxShapes()) {
        return { success: false, message: '已达到自定义形状的最大数量（20个）' };
      }

      // Validate shape
      var validation = this.validateShape(blocks);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      // Generate all rotations for the shape
      var orientations = this.generateRotations(blocks);

      // Create custom shape object
      var customShape = {
        id: Date.now(), // Use timestamp as unique ID
        name: name.trim(),
        blocks: blocks,
        orientations: orientations,
        enabled: true,
        probability: 1 // Default probability (1-10)
      };

      // Add to custom shapes list
      this.customShapes.push(customShape);

      // Save to localStorage
      this.saveCustomShapes();

      // Add to shape factory
      this.addToShapeFactory(customShape);

      return { success: true, message: '自定义形状创建成功', shape: customShape };
    },

    /**
     * Generate all 4 rotations for a shape
     */
    generateRotations: function (blocks) {
      var rotations = [];

      // Original shape
      rotations.push(this.blocksToArray(blocks));

      // Rotate 90 degrees left (3 times to get all rotations)
      var currentBlocks = blocks;
      for (var i = 0; i < 3; i++) {
        currentBlocks = this.rotateShape(currentBlocks);
        rotations.push(this.blocksToArray(currentBlocks));
      }

      return rotations;
    },

    /**
     * Rotate a shape 90 degrees left
     */
    rotateShape: function (blocks) {
      var rotated = [];

      // Find the center of the shape to rotate around
      // For simplicity, we'll rotate around the first block
      var centerX = blocks[0].x;
      var centerY = blocks[0].y;

      for (var i = 0; i < blocks.length; i++) {
        // Translate block to origin (center block)
        var dx = blocks[i].x - centerX;
        var dy = blocks[i].y - centerY;

        // Rotate 90 degrees left: (x, y) -> (-y, x)
        var rotatedDx = -dy;
        var rotatedDy = dx;

        // Translate back to original position
        rotated.push({
          x: centerX + rotatedDx,
          y: centerY + rotatedDy
        });
      }

      // Normalize the rotated shape so it's centered within the 5x5 grid
      return this.normalizeShape(rotated);
    },

    /**
     * Normalize a shape so it's centered within the 5x5 grid
     */
    normalizeShape: function (blocks) {
      // Find the minimum x and y values
      var minX = blocks.reduce((min, block) => Math.min(min, block.x), this.gridSize);
      var minY = blocks.reduce((min, block) => Math.min(min, block.y), this.gridSize);

      // Shift blocks so the minimum x and y are 0 (or centered)
      var normalized = [];
      for (var i = 0; i < blocks.length; i++) {
        normalized.push({
          x: blocks[i].x - minX,
          y: blocks[i].y - minY
        });
      }

      return normalized;
    },

    /**
     * Convert an array of block objects to a flat array of [x1, y1, x2, y2, ...]
     */
    blocksToArray: function (blocks) {
      var array = [];
      for (var i = 0; i < blocks.length; i++) {
        array.push(blocks[i].x);
        array.push(blocks[i].y);
      }
      return array;
    },

    /**
     * Add a custom shape to the game's shape factory
     */
    addToShapeFactory: function (shape) {
      var game = this.game;
      var shapeId = 'custom_' + shape.id;

      // Add shape factory function
      game._shapeFactory[shapeId] = function () {
        return new game._Shape(game, shape.orientations, false, shapeId);
      };
    },

    /**
     * Remove a custom shape
     */
    removeCustomShape: function (shapeId) {
      // Find and remove the shape from the list
      var index = this.customShapes.findIndex(shape => shape.id === shapeId);
      if (index !== -1) {
        this.customShapes.splice(index, 1);

        // Save to localStorage
        this.saveCustomShapes();

        // Remove from shape factory
        var shapeId = 'custom_' + shapeId;
        delete this.game._shapeFactory[shapeId];

        return { success: true, message: '自定义形状删除成功' };
      }

      return { success: false, message: '未找到指定的自定义形状' };
    },

    /**
     * Update a custom shape's enabled status and probability
     */
    updateCustomShape: function (shapeId, enabled, probability) {
      var shape = this.customShapes.find(shape => shape.id === shapeId);
      if (shape) {
        shape.enabled = enabled;
        shape.probability = Math.max(1, Math.min(10, probability)); // Clamp to 1-10

        // Save to localStorage
        this.saveCustomShapes();

        return { success: true, message: '自定义形状更新成功' };
      }

      return { success: false, message: '未找到指定的自定义形状' };
    },

    /**
     * Get all custom shapes
     */
    getAllCustomShapes: function () {
      return this.customShapes;
    },

    /**
     * Get enabled custom shapes
     */
    getEnabledCustomShapes: function () {
      return this.customShapes.filter(shape => shape.enabled);
    }
  };

  // Add custom shape manager to Blockrain widget
  $.widget('aerolab.blockrain', $.aerolab.blockrain, {
    _create: function () {
      // Call the original _create method
      this._super();

      // Initialize custom shape manager
      this._customShapeManager = new CustomShapeManager(this);
    },

    // Add public methods for custom shapes
    customShapes: function () {
      return this._customShapeManager;
    }
  });

})(jQuery));
