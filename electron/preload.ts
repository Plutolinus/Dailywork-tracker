/**
 * AI Work Tracker - Electron Preload Script
 * 安全地暴露 Electron API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 录制控制
  startRecording: () => ipcRenderer.invoke('start-recording'),
  pauseRecording: () => ipcRenderer.invoke('pause-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  getRecordingStatus: () => ipcRenderer.invoke('get-recording-status'),
  
  // 截图管理
  readScreenshot: (filePath: string) => ipcRenderer.invoke('read-screenshot', filePath),
  getScreenshotPath: (fileName: string) => ipcRenderer.invoke('get-screenshot-path', fileName),
  
  // 会话管理
  setSessionId: (id: string) => ipcRenderer.invoke('set-session-id', id),
  
  // 事件监听
  onRecordingStarted: (callback: () => void) => {
    ipcRenderer.on('recording-started', callback);
    return () => ipcRenderer.removeListener('recording-started', callback);
  },
  
  onRecordingPaused: (callback: () => void) => {
    ipcRenderer.on('recording-paused', callback);
    return () => ipcRenderer.removeListener('recording-paused', callback);
  },
  
  onRecordingStopped: (callback: () => void) => {
    ipcRenderer.on('recording-stopped', callback);
    return () => ipcRenderer.removeListener('recording-stopped', callback);
  },
  
  onScreenshotCaptured: (callback: (data: { path: string; timestamp: string }) => void) => {
    const handler = (_: any, data: { path: string; timestamp: string }) => callback(data);
    ipcRenderer.on('screenshot-captured', handler);
    return () => ipcRenderer.removeListener('screenshot-captured', handler);
  }
});

// TypeScript 类型声明
declare global {
  interface Window {
    electronAPI: {
      startRecording: () => Promise<{ success: boolean }>;
      pauseRecording: () => Promise<{ success: boolean }>;
      stopRecording: () => Promise<{ success: boolean }>;
      getRecordingStatus: () => Promise<{ isRecording: boolean }>;
      readScreenshot: (filePath: string) => Promise<string | null>;
      getScreenshotPath: (fileName: string) => Promise<string>;
      setSessionId: (id: string) => Promise<{ success: boolean }>;
      onRecordingStarted: (callback: () => void) => () => void;
      onRecordingPaused: (callback: () => void) => () => void;
      onRecordingStopped: (callback: () => void) => () => void;
      onScreenshotCaptured: (callback: (data: { path: string; timestamp: string }) => void) => () => void;
    };
  }
}

