export interface ManagedEventSourceOptions {
  onMessage: (event: MessageEvent<string>) => void;
  onOpen?: () => void;
  onError?: (event: Event, retryAttempt: number) => void;
  onFailed?: (event: Event) => void;
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  /** 连接稳定超过该时长后，错误重试计数是否清零。默认 false，避免代理断线导致无限重连 */
  resetRetryOnStable?: boolean;
  stableConnectionMs?: number;
}

/**
 * 创建可控重连的 SSE 连接。
 * 原生 EventSource 会无限重连，这里在错误时主动关闭并使用有上限的退避重连。
 */
export const createManagedEventSource = (url: string, options: ManagedEventSourceOptions): (() => void) => {
  const maxRetries = options.maxRetries ?? 5;
  const retryDelay = options.retryDelay ?? 3000;
  const maxRetryDelay = options.maxRetryDelay ?? 30000;
  const resetRetryOnStable = options.resetRetryOnStable ?? false;
  const stableConnectionMs = options.stableConnectionMs ?? 60000;

  let source: EventSource | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let retryCount = 0;
  let openedAt = 0;

  const clearReconnectTimer = () => {
    if (!reconnectTimer) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  };

  const connect = () => {
    if (stopped) return;
    clearReconnectTimer();

    const currentSource = new EventSource(url);
    source = currentSource;
    currentSource.onopen = () => {
      openedAt = Date.now();
      options.onOpen?.();
    };
    currentSource.onmessage = options.onMessage;
    currentSource.onerror = (event) => {
      if (stopped || source !== currentSource) return;

      const stableConnection = openedAt > 0 && Date.now() - openedAt >= stableConnectionMs;
      currentSource.close();
      source = undefined;
      openedAt = 0;
      if (resetRetryOnStable && stableConnection) retryCount = 0;

      if (retryCount >= maxRetries) {
        options.onFailed?.(event);
        return;
      }

      retryCount += 1;
      options.onError?.(event, retryCount);
      const delay = Math.min(retryDelay * 2 ** (retryCount - 1), maxRetryDelay);
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return () => {
    if (stopped) return;
    stopped = true;
    clearReconnectTimer();
    source?.close();
    source = undefined;
  };
};
