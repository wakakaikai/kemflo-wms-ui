import { ref, Ref } from 'vue';

interface TcpClientOptions {
  host: string;
  port: number;
  onConnect?: () => void;
  onMessage?: (data: string) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export class TcpClient {
  private socket: WebSocket | null = null;
  private options: TcpClientOptions;
  private retryCount = 0;
  private maxRetries = 3;
  private retryInterval = 3000;
  public status: Ref<'disconnected' | 'connecting' | 'connected'> = ref('disconnected');

  constructor(options: TcpClientOptions) {
    this.options = {
      timeout: 5000,
      ...options
    };
  }

  async connect(): Promise<void> {
    if (this.status.value === 'connected') return;

    this.status.value = 'connecting';

    try {
      // 通过WebSocket代理TCP连接（实际项目中应使用原生TCP连接）
      const wsUrl = `ws://${location.host}/tcp-proxy?host=${this.options.host}&port=${this.options.port}`;
      this.socket = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Socket initialization failed'));

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.options.timeout);

        this.socket.onopen = () => {
          clearTimeout(timeout);
          this.status.value = 'connected';
          this.retryCount = 0;
          this.options.onConnect?.();
          resolve(void 0);
        };

        this.socket.onerror = (event) => {
          clearTimeout(timeout);
          reject(new Error('Connection error'));
        };
      });
    } catch (error) {
      this.status.value = 'disconnected';
      throw error;
    }

    // 设置消息处理器
    if (this.socket) {
      this.socket.onmessage = (event) => {
        this.options.onMessage?.(event.data);
      };

      this.socket.onclose = () => {
        this.status.value = 'disconnected';
        this.options.onClose?.();
        this.attemptReconnect();
      };
    }
  }

  private attemptReconnect() {
    if (this.retryCount >= this.maxRetries) return;

    this.retryCount++;
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.retryCount}/${this.maxRetries})...`);
      this.connect().catch(() => {
        this.attemptReconnect();
      });
    }, this.retryInterval);
  }

  send(message: string): void {
    if (this.status.value !== 'connected' || !this.socket) {
      throw new Error('Not connected to server');
    }
    this.socket.send(message);
  }

  disconnect(): void {
    this.retryCount = this.maxRetries;
    if (this.socket) {
      this.socket.close();
    }
    this.status.value = 'disconnected';
  }
}
