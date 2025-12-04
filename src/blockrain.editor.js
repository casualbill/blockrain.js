// Blockrain Editor Class
var BlockrainEditor = function() {
  // Editor configuration
  this.GRID_WIDTH = 10;
  this.GRID_HEIGHT = 20;
  this.MAX_SAVED_AREAS = 10;
  
  // Editor state
  this.currentGrid = [];
  this.savedAreas = [];
  
  // Initialize the editor
  this.init();
};

BlockrainEditor.prototype = {
  init: function() {
    // Load saved areas from localStorage
    this.loadSavedAreas();
    
    // Create the grid
    this.createGrid();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Load default area
    this.loadDefaultArea();
  },
  
  createGrid: function() {
    var $grid = $('#editor-grid');
    $grid.empty();
    
    // Initialize the grid with all available cells
    this.currentGrid = [];
    for (var y = 0; y < this.GRID_HEIGHT; y++) {
      this.currentGrid[y] = [];
      var $row = $('<div class="editor-row"></div>');
      
      for (var x = 0; x < this.GRID_WIDTH; x++) {
        this.currentGrid[y][x] = true; // true = available
        var $cell = $('<div class="editor-cell" data-x="' + x + '" data-y="' + y + '"></div>');
        $row.append($cell);
      }
      
      $grid.append($row);
    }
  },
  
  setupEventHandlers: function() {
    // Cell click handler
    $('#editor-grid').on('click', '.editor-cell', function() {
      var x = parseInt($(this).data('x'));
      var y = parseInt($(this).data('y'));
      
      // Toggle cell availability
      editor.currentGrid[y][x] = !editor.currentGrid[y][x];
      
      // Update cell CSS class
      if (editor.currentGrid[y][x]) {
        $(this).removeClass('unavailable');
      } else {
        $(this).addClass('unavailable');
      }
    });
  },
  
  loadSavedAreas: function() {
    this.savedAreas = JSON.parse(localStorage.getItem('customAreas') || '[]');
    
    // Update the saved areas list in the UI
    this.updateSavedAreasList();
  },
  
  loadDefaultArea: function() {
    // Create a full grid (all cells available)
    this.currentGrid = [];
    for (var y = 0; y < this.GRID_HEIGHT; y++) {
      this.currentGrid[y] = [];
      for (var x = 0; x < this.GRID_WIDTH; x++) {
        this.currentGrid[y][x] = true;
      }
    }
    
    // Update the grid UI
    this.updateGridUI();
  },
  
  saveCurrentArea: function() {
    var name = prompt('请输入区域名称：');
    if (!name) return;
    
    if (this.savedAreas.length >= this.MAX_SAVED_AREAS) {
      this.showMessage('已达到最大区域数量（10个）', 'error');
      return;
    }
    
    // Validate the area before saving
    if (!this.validateCurrentArea()) {
      this.showMessage('区域验证失败：请确保从顶部到底部有完整路径', 'error');
      return;
    }
    
    var area = {
      name: name,
      width: this.GRID_WIDTH,
      height: this.GRID_HEIGHT,
      grid: this.currentGrid,
      created: new Date().toISOString()
    };
    
    this.savedAreas.push(area);
    localStorage.setItem('customAreas', JSON.stringify(this.savedAreas));
    
    this.showMessage('区域保存成功', 'success');
    this.updateSavedAreasList();
  },
  
  loadSelectedArea: function() {
    var selectedIndex = this.getSelectedAreaIndex();
    if (selectedIndex === -1) {
      this.showMessage('请先选择一个区域', 'error');
      return;
    }
    
    var area = this.savedAreas[selectedIndex];
    this.currentGrid = area.grid;
    
    // Update the grid UI
    this.updateGridUI();
    
    this.showMessage('区域加载成功', 'success');
  },
  
  deleteSelectedArea: function() {
    var selectedIndex = this.getSelectedAreaIndex();
    if (selectedIndex === -1) {
      this.showMessage('请先选择一个区域', 'error');
      return;
    }
    
    if (confirm('确定要删除这个区域吗？')) {
      this.savedAreas.splice(selectedIndex, 1);
      localStorage.setItem('customAreas', JSON.stringify(this.savedAreas));
      
      this.showMessage('区域删除成功', 'success');
      this.updateSavedAreasList();
    }
  },
  
  validateCurrentArea: function() {
    // Check if there's a path from any top cell to any bottom cell
    var visited = [];
    for (var y = 0; y < this.GRID_HEIGHT; y++) {
      visited[y] = [];
      for (var x = 0; x < this.GRID_WIDTH; x++) {
        visited[y][x] = false;
      }
    }
    
    // Start BFS from each top cell that is available
    for (var x = 0; x < this.GRID_WIDTH; x++) {
      if (this.currentGrid[0][x] && !visited[0][x]) {
        if (this.bfs(x, 0, visited)) {
          return true;
        }
      }
    }
    
    return false;
  },
  
  bfs: function(startX, startY, visited) {
    var queue = [];
    queue.push({x: startX, y: startY});
    visited[startY][startX] = true;
    
    // Directions: up, down, left, right
    var directions = [
      {x: 0, y: -1},
      {x: 0, y: 1},
      {x: -1, y: 0},
      {x: 1, y: 0}
    ];
    
    while (queue.length > 0) {
      var current = queue.shift();
      
      // Check if we've reached the bottom
      if (current.y === this.GRID_HEIGHT - 1) {
        return true;
      }
      
      // Explore all four directions
      for (var i = 0; i < directions.length; i++) {
        var newX = current.x + directions[i].x;
        var newY = current.y + directions[i].y;
        
        // Check if the new position is within bounds and available
        if (newX >= 0 && newX < this.GRID_WIDTH && newY >= 0 && newY < this.GRID_HEIGHT) {
          if (this.currentGrid[newY][newX] && !visited[newY][newX]) {
            visited[newY][newX] = true;
            queue.push({x: newX, y: newY});
          }
        }
      }
    }
    
    return false;
  },
  
  clearAllCells: function() {
    // Make all cells available
    for (var y = 0; y < this.GRID_HEIGHT; y++) {
      for (var x = 0; x < this.GRID_WIDTH; x++) {
        this.currentGrid[y][x] = true;
      }
    }
    
    // Update the grid UI
    this.updateGridUI();
    
    this.showMessage('网格已清空', 'success');
  },
  
  exportSelectedArea: function() {
    var selectedIndex = this.getSelectedAreaIndex();
    if (selectedIndex === -1) {
      this.showMessage('请先选择一个区域', 'error');
      return;
    }
    
    var area = this.savedAreas[selectedIndex];
    
    // Create export data
    var exportData = {
      name: area.name,
      width: area.width,
      height: area.height,
      grid: area.grid,
      created: area.created,
      version: '1.0',
      type: 'BlockrainCustomArea'
    };
    
    // Convert to JSON string
    var jsonStr = JSON.stringify(exportData, null, 2);
    
    // Create download link
    var blob = new Blob([jsonStr], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = area.name + '.blockrain';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showMessage('区域导出成功', 'success');
  },
  
  importArea: function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.blockrain,.json';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      
      var reader = new FileReader();
      reader.onload = function(event) {
        try {
          var importData = JSON.parse(event.target.result);
          
          // Validate import data format
          if (importData.type !== 'BlockrainCustomArea') {
            throw new Error('不是有效的Blockrain自定义区域文件');
          }
          
          if (!importData.grid || !Array.isArray(importData.grid)) {
            throw new Error('无效的网格数据格式');
          }
          
          // Check if area dimensions match current editor
          if (importData.width !== editor.GRID_WIDTH || importData.height !== editor.GRID_HEIGHT) {
            throw new Error('区域尺寸与当前编辑器尺寸不匹配');
          }
          
          // Check if we've reached the maximum number of saved areas
          if (editor.savedAreas.length >= editor.MAX_SAVED_AREAS) {
            throw new Error('已达到最大区域数量（10个），请先删除一个区域');
          }
          
          // Create new area object
          var newArea = {
            name: importData.name || '导入的区域',
            width: importData.width,
            height: importData.height,
            grid: importData.grid,
            created: new Date().toISOString()
          };
          
          // Add to saved areas
          editor.savedAreas.push(newArea);
          
          // Save to localStorage
          localStorage.setItem('customAreas', JSON.stringify(editor.savedAreas));
          
          // Update the saved areas list
          editor.updateSavedAreasList();
          
          editor.showMessage('区域导入成功', 'success');
        } catch (error) {
          editor.showMessage('导入失败：' + error.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },
  
  updateGridUI: function() {
    // Update the CSS classes for all cells
    for (var y = 0; y < this.GRID_HEIGHT; y++) {
      for (var x = 0; x < this.GRID_WIDTH; x++) {
        var $cell = $('#editor-grid .editor-row').eq(y).find('.editor-cell').eq(x);
        if (this.currentGrid[y][x]) {
          $cell.removeClass('unavailable');
        } else {
          $cell.addClass('unavailable');
        }
      }
    }
  },
  
  updateSavedAreasList: function() {
    var $container = $('#saved-areas');
    $container.empty();
    
    for (var i = 0; i < this.savedAreas.length; i++) {
      var area = this.savedAreas[i];
      var $areaDiv = $('<div class="saved-area" data-index="' + i + '"></div>');
      $areaDiv.html('<strong>' + area.name + '</strong> (创建于: ' + new Date(area.created).toLocaleDateString() + ')');
      
      // Add select class to first area by default
      if (i === 0) {
        $areaDiv.addClass('selected');
      }
      
      // Select area on click
      $areaDiv.click(function() {
        $('.saved-area').removeClass('selected');
        $(this).addClass('selected');
      });
      
      $container.append($areaDiv);
    }
  },
  
  getSelectedAreaIndex: function() {
    var selectedIndex = -1;
    $('.saved-area').each(function(index) {
      if ($(this).hasClass('selected')) {
        selectedIndex = index;
      }
    });
    
    return selectedIndex;
  },
  
  showMessage: function(message, type) {
    var $message = $('#editor-message');
    if ($message.length === 0) {
      // Create message element if it doesn't exist
      $message = $('<div id="editor-message" class="editor-message"></div>');
      $('#editor-container').append($message);
    }
    
    $message.text(message);
    $message.attr('class', 'editor-message ' + type);
    
    // Hide message after 3 seconds
    setTimeout(function() {
      $message.hide();
    }, 3000);
    
    $message.show();
  },
  
  // Public methods for external access
  clearGrid: function() {
    this.clearAllCells();
  },
  
  resetGrid: function() {
    this.loadDefaultArea();
  },
  
  saveArea: function() {
    this.saveCurrentArea();
  },
  
  loadArea: function() {
    this.loadSelectedArea();
  },
  
  deleteArea: function() {
    this.deleteSelectedArea();
  },
  
  exportArea: function() {
    this.exportSelectedArea();
  },
  
  importArea: function() {
    this.importArea();
  }
};

// Initialize the editor when the page is ready
$(document).ready(function() {
  // If we're on the editor.html page, initialize the editor
  if (window.location.pathname.includes('editor.html')) {
    editor = new BlockrainEditor();
  }
});