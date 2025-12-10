/**
 * AI Work Tracker - Browser Screen Capture
 * 使用浏览器 Screen Capture API 实现屏幕截图
 */

export class ScreenCapture {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isCapturing = false;
  private onScreenshot: ((imageBase64: string) => void) | null = null;

  /**
   * 开始屏幕共享
   */
  async startCapture(onScreenshot: (imageBase64: string) => void): Promise<boolean> {
    try {
      // 请求屏幕共享权限
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // 优先整个屏幕
          frameRate: { ideal: 1, max: 5 } // 低帧率节省资源
        },
        audio: false
      });

      // 创建视频元素来接收流
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.mediaStream;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      
      await this.videoElement.play();

      // 创建 canvas 用于截图
      this.canvas = document.createElement('canvas');

      // 监听流结束事件（用户点击"停止共享"）
      this.mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopCapture();
      });

      this.onScreenshot = onScreenshot;
      this.isCapturing = true;

      // 立即截取第一张
      await this.captureFrame();

      // 每5秒截取一次
      this.intervalId = setInterval(() => {
        if (this.isCapturing) {
          this.captureFrame();
        }
      }, 5000);

      return true;
    } catch (error) {
      console.error('Screen capture failed:', error);
      return false;
    }
  }

  /**
   * 截取当前帧
   */
  private async captureFrame(): Promise<void> {
    if (!this.videoElement || !this.canvas || !this.onScreenshot) return;

    const video = this.videoElement;
    const canvas = this.canvas;

    // 设置 canvas 尺寸（限制最大尺寸以减小文件大小）
    const maxWidth = 1920;
    const maxHeight = 1080;
    
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 绘制当前视频帧
    ctx.drawImage(video, 0, 0, width, height);

    // 转换为 base64（使用 JPEG 压缩以减小大小）
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // 移除 data URL 前缀
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    this.onScreenshot(base64Data);
  }

  /**
   * 停止屏幕共享
   */
  stopCapture(): void {
    this.isCapturing = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvas = null;
    this.onScreenshot = null;
  }

  /**
   * 检查是否正在捕获
   */
  get capturing(): boolean {
    return this.isCapturing;
  }

  /**
   * 检查浏览器是否支持屏幕共享
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }
}

// 单例实例
let screenCaptureInstance: ScreenCapture | null = null;

export function getScreenCapture(): ScreenCapture {
  if (!screenCaptureInstance) {
    screenCaptureInstance = new ScreenCapture();
  }
  return screenCaptureInstance;
}

