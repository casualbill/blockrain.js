const { test, expect } = require('@playwright/test');

test('页面加载并显示标题', async ({ page }) => {
  // 访问3D游戏页面
  await page.goto('http://localhost:3000');
  
  // 检查页面标题
  await expect(page).toHaveTitle('3D BlockRain - Tetris Game');
  
  // 检查主标题是否存在
  await expect(page.locator('h1')).toHaveText('🎮 3D BlockRain');
});

test('游戏容器存在', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 检查游戏容器是否存在
  await expect(page.locator('#blockrain-game')).toBeVisible();
  
  // 检查游戏容器是否有正确的尺寸
  const gameContainer = page.locator('#blockrain-game');
  await expect(gameContainer).toHaveCSS('width', '100%');
  await expect(gameContainer).toHaveCSS('height', '100%');
});

test('模式选择按钮存在且可点击', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 检查模式选择按钮
  const normalBtn = page.locator('button[onclick="changeMode(\'normal\')"]');
  const niceBtn = page.locator('button[onclick="changeMode(\'nice\')"]');
  const evilBtn = page.locator('button[onclick="changeMode(\'evil\')"]');
  
  await expect(normalBtn).toBeVisible();
  await expect(niceBtn).toBeVisible();
  await expect(evilBtn).toBeVisible();
  
  // 检查默认激活的模式
  await expect(normalBtn).toHaveClass(/active/);
  await expect(niceBtn).not.toHaveClass(/active/);
  await expect(evilBtn).not.toHaveClass(/active/);
  
  // 测试点击模式按钮
  await niceBtn.click();
  await expect(niceBtn).toHaveClass(/active/);
  await expect(normalBtn).not.toHaveClass(/active/);
  
  await evilBtn.click();
  await expect(evilBtn).toHaveClass(/active/);
  await expect(niceBtn).not.toHaveClass(/active/);
});

test('控制说明存在', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 检查控制说明
  const controlsInfo = page.locator('.controls-info');
  await expect(controlsInfo).toBeVisible();
  await expect(controlsInfo.locator('h3')).toHaveText('🎯 Controls');
  
  // 检查控制说明内容
  await expect(controlsInfo.locator('p')).toHaveCount(5);
  await expect(controlsInfo.locator('p').nth(0)).toContainText('Move Left/Right');
  await expect(controlsInfo.locator('p').nth(1)).toContainText('Rotate Right');
  await expect(controlsInfo.locator('p').nth(2)).toContainText('Rotate Left');
  await expect(controlsInfo.locator('p').nth(3)).toContainText('Soft Drop');
  await expect(controlsInfo.locator('p').nth(4)).toContainText('Hard Drop');
});

test('开始游戏按钮存在且可点击', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 等待开始菜单显示
  await page.waitForSelector('.blockrain-start-holder', { state: 'visible' });
  
  // 检查开始按钮
  const startBtn = page.locator('.blockrain-start-btn');
  await expect(startBtn).toBeVisible();
  await expect(startBtn).toHaveText('Play');
  
  // 点击开始按钮
  await startBtn.click();
  
  // 检查开始菜单是否隐藏
  await expect(page.locator('.blockrain-start-holder')).not.toBeVisible();
  
  // 检查分数显示是否出现
  await expect(page.locator('.blockrain-score-holder')).toBeVisible();
  await expect(page.locator('.blockrain-score-num')).toHaveText('0');
});