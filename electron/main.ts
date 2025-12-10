/**
 * AI Work Tracker - Electron Main Process
 */

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, desktopCapturer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let screenshotInterval: NodeJS.Timeout | null = null;
let isRecording = false;
let sessionId: string | null = null;

// 截图保存目录
const SCREENSHOTS_DIR = path.join(app.getPath('userData'), 'screenshots');

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/icon-512x512.png')
  });

  // 开发模式加载本地服务器，生产模式加载打包后的文件
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 最小化到托盘
  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('close', (event: Event) => {
    if (isRecording) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

/**
 * 创建系统托盘
 */
function createTray() {
  const iconPath = path.join(__dirname, '../public/favicon-32x32.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  updateTrayMenu();

  tray.on('click', () => {
    mainWindow?.show();
  });
}

/**
 * 更新托盘菜单
 */
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isRecording ? '⏸️ 暂停记录' : '▶️ 开始记录',
      click: () => {
        if (isRecording) {
          pauseRecording();
        } else {
          startRecording();
        }
      }
    },
    {
      label: '🛑 结束工作',
      enabled: isRecording,
      click: () => stopRecording()
    },
    { type: 'separator' },
    {
      label: '📊 打开面板',
      click: () => mainWindow?.show()
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isRecording = false;
        app.quit();
      }
    }
  ]);

  tray?.setContextMenu(contextMenu);
  tray?.setToolTip(isRecording ? 'AI Work Tracker - 记录中' : 'AI Work Tracker');
}

/**
 * 截取屏幕
 */
async function captureScreen(): Promise<string | null> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length === 0) {
      console.error('No screen source found');
      return null;
    }

    const primaryScreen = sources[0];
    const thumbnail = primaryScreen.thumbnail;
    const pngBuffer = thumbnail.toPNG();

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `screenshot-${timestamp}.png`;
    const filePath = path.join(SCREENSHOTS_DIR, fileName);

    // 保存到本地
    fs.writeFileSync(filePath, pngBuffer);

    return filePath;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return null;
  }
}

/**
 * 开始记录
 */
async function startRecording() {
  if (isRecording) return;

  isRecording = true;
  updateTrayMenu();

  // 通知渲染进程开始会话
  mainWindow?.webContents.send('recording-started');

  // 每 5 秒截屏一次
  screenshotInterval = setInterval(async () => {
    if (!isRecording) return;

    const filePath = await captureScreen();
    if (filePath) {
      // 通知渲染进程有新截图
      mainWindow?.webContents.send('screenshot-captured', {
        path: filePath,
        timestamp: new Date().toISOString()
      });
    }
  }, 5000);

  // 立即截取第一张
  const firstScreenshot = await captureScreen();
  if (firstScreenshot) {
    mainWindow?.webContents.send('screenshot-captured', {
      path: firstScreenshot,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 暂停记录
 */
function pauseRecording() {
  isRecording = false;
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  updateTrayMenu();
  mainWindow?.webContents.send('recording-paused');
}

/**
 * 停止记录
 */
function stopRecording() {
  isRecording = false;
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  updateTrayMenu();
  mainWindow?.webContents.send('recording-stopped');
}

// ==================== IPC 事件处理 ====================

ipcMain.handle('start-recording', async () => {
  await startRecording();
  return { success: true };
});

ipcMain.handle('pause-recording', () => {
  pauseRecording();
  return { success: true };
});

ipcMain.handle('stop-recording', () => {
  stopRecording();
  return { success: true };
});

ipcMain.handle('get-recording-status', () => {
  return { isRecording };
});

ipcMain.handle('get-screenshot-path', (_, fileName: string) => {
  return path.join(SCREENSHOTS_DIR, fileName);
});

ipcMain.handle('read-screenshot', async (_, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Failed to read screenshot:', error);
    return null;
  }
});

ipcMain.handle('set-session-id', (_, id: string) => {
  sessionId = id;
  return { success: true };
});

// ==================== App 生命周期 ====================

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (!isRecording) {
      app.quit();
    }
  }
});

app.on('before-quit', () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
});

