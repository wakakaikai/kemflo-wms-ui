import { ElMessage } from 'element-plus';
import { applySerialPortSignals, SerialPacketTransformer } from '@/utils/serialPortReader';
import { createEmptySerialDebugStats, createSerialPortLogger, isSerialDebugEnabled, monitorRawSerialStream, type SerialDebugStats, type SerialPortLogger } from '@/utils/serialPortLogger';

export interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialPortConfig {
  baudRate: number;
  dataBits: 8 | 7 | 6 | 5;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
  flowControl: 'none' | 'hardware';
  bufferSize: number;
}

export interface UseSerialPortOptions {
  getConfig?: () => Partial<SerialPortConfig>;
  /** USB filters for navigator.serial.requestPort() */
  filters?: SerialPortFilter[];
  /** Reuse the only granted port without prompting again */
  preferGrantedPort?: boolean;
  /** Output signals after open; DTR is enabled by default */
  signals?: { dataTerminalReady?: boolean; requestToSend?: boolean };
  /** Enable console debug logs; dev mode on by default. localStorage serialPortDebug=1 to force on */
  debug?: boolean;
  /** Warn in console if no raw bytes received within this many ms after connect */
  noDataWarnMs?: number;
}

const DEFAULT_CONFIG: SerialPortConfig = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
  bufferSize: 1024
};

const MSG = {
  unsupported: '当前浏览器不支持 Web Serial API，请使用 Chrome 89+ 或 Edge 89+，并通过 HTTPS 或 localhost 访问',
  connectSuccess: '串口连接成功',
  noPortSelected: '未选择串口设备',
  portBusy: '串口已被占用或处于非法状态，请关闭其他串口软件后重试',
  connectFailed: '串口连接失败: ',
  disconnected: '串口已断开',
  disconnectFailed: '断开串口失败: ',
  deviceConnected: '检测到串口设备已插入',
  deviceDisconnected: '串口设备已拔出',
  grantedPort: '已授权串口设备',
  readError: '读取串口数据时发生错误:',
  forgetFailed: '撤销串口权限失败:'
};

/** @see https://developer.chrome.com/docs/capabilities/serial */
export function isSerialPortSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function canForgetSerialPort() {
  return isSerialPortSupported() && 'forget' in SerialPort.prototype;
}

export function getSerialBrowserHint() {
  return MSG.unsupported;
}

function getPortDisplayName(port: SerialPort) {
  const info = port.getInfo?.() || {};
  if (info.usbVendorId && info.usbProductId) {
    return `USB (0x${info.usbVendorId.toString(16)}:0x${info.usbProductId.toString(16)})`;
  }
  return MSG.grantedPort;
}

/** Prefer a single granted port; otherwise prompt the user. */
async function requestSerialPort(filters: SerialPortFilter[] | undefined, preferGrantedPort: boolean, logger: SerialPortLogger) {
  const ports = preferGrantedPort ? await navigator.serial.getPorts() : [];
  logger.info('getPorts result', { count: ports.length, preferGrantedPort });

  if (ports.length === 1) {
    logger.info('reuse granted port', ports[0].getInfo?.());
    return { port: ports[0], source: 'granted' as const };
  }

  if (ports.length > 1) {
    logger.warn(
      'multiple granted ports, opening picker',
      ports.map((p) => p.getInfo?.())
    );
  }

  const port = await navigator.serial.requestPort(filters?.length ? { filters } : undefined);
  logger.info('user selected port', port.getInfo?.());
  return { port, source: 'picker' as const };
}

export function useSerialPort(onPacket: (packet: string) => void, options: UseSerialPortOptions = {}) {
  const preferGrantedPort = options.preferGrantedPort ?? true;
  const noDataWarnMs = options.noDataWarnMs ?? 8000;
  const debugEnabled = isSerialDebugEnabled(options.debug);
  const logger = createSerialPortLogger(debugEnabled);
  const resolveConfig = (): SerialPortConfig => ({ ...DEFAULT_CONFIG, ...options.getConfig?.() });

  const isConnected = ref(false);
  const connecting = ref(false);
  const portName = ref('');
  const debugStats = ref<SerialDebugStats>(createEmptySerialDebugStats());

  let serialPort: SerialPort | null = null;
  let keepReading = false;
  let reader: ReadableStreamDefaultReader<string> | null = null;
  let readableStreamClosed: Promise<void> | null = null;
  let readLoopPromise: Promise<void> | null = null;
  let noDataTimer: ReturnType<typeof setTimeout> | null = null;

  /** 当前 tee() 调试分支的取消控制器与完成 Promise，断口时需先取消以解除 readable 流的锁 */
  let rawMonitorAbort: AbortController | null = null;
  let rawMonitorDone: Promise<void> | null = null;

  const clearNoDataTimer = () => {
    if (noDataTimer) {
      clearTimeout(noDataTimer);
      noDataTimer = null;
    }
  };

  const scheduleNoDataWarn = () => {
    clearNoDataTimer();
    if (!debugEnabled) {
      return;
    }
    noDataTimer = setTimeout(() => {
      if (!keepReading) {
        return;
      }
      const stats = { ...debugStats.value };
      if (stats.totalRawBytes === 0) {
        logger.warn('no raw bytes received yet', {
          waitedMs: noDataWarnMs,
          hints: ['check baudRate matches scale (default 9600)', 'close other serial tools using same COM port', 'some scales need DTR/RTS or stable weight trigger', 'open chrome://device-log for Web Serial events'],
          stats
        });
        return;
      }
      if (stats.totalPackets === 0) {
        logger.warn('raw bytes received but no complete packet parsed', {
          waitedMs: noDataWarnMs,
          hints: ['scale may use non-standard line ending', 'check buffer waiting for delimiter logs above', 'verify data format in raw hex/ascii logs'],
          stats
        });
      }
    }, noDataWarnMs);
  };

  const handlePacket = (packet: string) => {
    const trimmed = packet.trim();
    if (!trimmed) {
      return;
    }
    // 不去重：每次收到串口完整包都交给业务层，保证实际重量实时更新
    debugStats.value.totalPackets += 1;
    debugStats.value.lastPacketAt = new Date().toISOString();
    logger.packet('line parsed', trimmed);
    onPacket(trimmed);
  };

  const onRawChunk = (bytes: Uint8Array) => {
    debugStats.value.totalRawBytes += bytes.length;
    debugStats.value.totalRawChunks += 1;
    debugStats.value.lastRawAt = new Date().toISOString();
    clearNoDataTimer();
  };

  let lastPendingLog = '';
  const logPendingBuffer = (pending: string) => {
    if (!debugEnabled || pending === lastPendingLog) {
      return;
    }
    lastPendingLog = pending;
    logger.info('buffer waiting for delimiter', {
      pendingLength: pending.length,
      pendingPreview: pending.slice(0, 80)
    });
  };

  const readUntilClosed = async () => {
    let loop = 0;
    while (serialPort?.readable && keepReading) {
      loop += 1;
      lastPendingLog = '';
      logger.info('read loop started', { loop, readable: !!serialPort.readable, writable: !!serialPort.writable });

      const [processStream, debugStream] = serialPort.readable.tee();
      rawMonitorAbort = new AbortController();
      rawMonitorDone = monitorRawSerialStream(debugStream, logger, () => keepReading, onRawChunk, rawMonitorAbort.signal);

      const textDecoder = new TextDecoderStream();
      readableStreamClosed = processStream.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.pipeThrough(new TransformStream(new SerialPacketTransformer(logPendingBuffer))).getReader();

      try {
        while (keepReading) {
          const { value, done } = await reader.read();
          if (done) {
            logger.info('text reader done');
            break;
          }
          if (value) {
            handlePacket(value);
          }
        }
      } catch (error) {
        debugStats.value.lastError = String(error);
        if (keepReading) {
          logger.error(MSG.readError, error);
        }
      } finally {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
        reader = null;
      }

      if (readableStreamClosed) {
        await readableStreamClosed.catch((error) => {
          logger.warn('readable pipe closed with error', error);
        });
        readableStreamClosed = null;
      }

      if (!keepReading || !serialPort.readable) {
        logger.info('read loop exit', { keepReading, readable: !!serialPort?.readable, stats: { ...debugStats.value } });
        rawMonitorAbort = null;
        rawMonitorDone = null;
        break;
      }

      logger.warn('recreating read stream after interruption');
    }
  };

  const connect = async () => {
    if (!isSerialPortSupported()) {
      ElMessage.error(getSerialBrowserHint());
      return;
    }
    if (isConnected.value) {
      return;
    }

    if (debugEnabled) {
      logger.info('debug enabled', {
        tip: "set localStorage.serialPortDebug='1' to keep logs in production"
      });
    }

    connecting.value = true;
    try {
      const config = resolveConfig();
      const picked = await requestSerialPort(options.filters, preferGrantedPort, logger);
      serialPort = picked.port;
      portName.value = getPortDisplayName(serialPort);

      logger.info('opening port', { source: picked.source, config, portInfo: serialPort.getInfo?.() });

      await serialPort.open({
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity,
        flowControl: config.flowControl,
        bufferSize: config.bufferSize
      });

      logger.info('port opened', {
        readable: !!serialPort.readable,
        writable: !!serialPort.writable
      });

      const signalConfig = options.signals ?? { dataTerminalReady: true };
      await applySerialPortSignals(serialPort, signalConfig, logger);

      if (typeof serialPort.getSignals === 'function') {
        try {
          const inputSignals = await serialPort.getSignals();
          logger.info('input signals after open', inputSignals);
        } catch (error) {
          logger.warn('getSignals failed', error);
        }
      }

      debugStats.value = {
        ...createEmptySerialDebugStats(),
        connectedAt: new Date().toISOString()
      };

      keepReading = true;
      isConnected.value = true;
      readLoopPromise = readUntilClosed();
      scheduleNoDataWarn();
      logger.info('read loop scheduled');
      ElMessage.success(MSG.connectSuccess);
    } catch (error: any) {
      debugStats.value.lastError = String(error);
      serialPort = null;
      isConnected.value = false;
      keepReading = false;
      clearNoDataTimer();
      logger.error('connect failed', error);
      if (error?.name === 'NotFoundError') {
        ElMessage.warning(MSG.noPortSelected);
      } else if (error?.name === 'InvalidStateError') {
        ElMessage.error(MSG.portBusy);
      } else {
        ElMessage.error(MSG.connectFailed + (error?.message || error));
      }
    } finally {
      connecting.value = false;
    }
  };

  /**
   * cancel reader -> wait for pipe close -> close port
   * @see https://developer.chrome.com/docs/capabilities/serial#close-port
   */
  const disconnect = async (silent = false) => {
    keepReading = false;
    clearNoDataTimer();

    try {
      if (reader) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
      }

      // 取消 tee() 调试分支：不取消它会让 readable 流一直被锁定，导致 port.close() 失败
      const abort = rawMonitorAbort;
      const monitorDone = rawMonitorDone;
      rawMonitorAbort = null;
      rawMonitorDone = null;
      if (abort) {
        try {
          abort.abort();
        } catch {
          // ignore
        }
      }

      if (readLoopPromise) {
        await readLoopPromise.catch(() => {
          // ignore
        });
        readLoopPromise = null;
      }

      if (monitorDone) {
        await monitorDone.catch(() => {
          // ignore
        });
      }

      if (readableStreamClosed) {
        await readableStreamClosed.catch(() => {
          // ignore
        });
        readableStreamClosed = null;
      }

      if (serialPort) {
        try {
          await serialPort.close();
        } catch (error) {
          // 若流仍未释放，close 会抛 InvalidStateError
          logger.warn('port close error', error);
        }
      }

      isConnected.value = false;
      serialPort = null;
      reader = null;
      logger.info('disconnected', { stats: { ...debugStats.value } });
      if (!silent) {
        ElMessage.info(MSG.disconnected);
      }
    } catch (error: any) {
      ElMessage.error(MSG.disconnectFailed + (error?.message || error));
    }
  };

  const handleConnect = async () => {
    if (isConnected.value) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const handleSerialConnect = () => {
    ElMessage.success(MSG.deviceConnected);
  };

  const handleSerialDisconnect = () => {
    if (isConnected.value) {
      void disconnect(true);
      ElMessage.warning(MSG.deviceDisconnected);
    }
  };

  const checkBrowserSupport = (showError = true) => {
    const supported = isSerialPortSupported();
    if (!supported && showError) {
      ElMessage.error(getSerialBrowserHint());
    }
    return supported;
  };

  const setupListeners = () => {
    navigator.serial.addEventListener('connect', handleSerialConnect);
    navigator.serial.addEventListener('disconnect', handleSerialDisconnect);
  };

  const teardownListeners = async () => {
    navigator.serial.removeEventListener('connect', handleSerialConnect);
    navigator.serial.removeEventListener('disconnect', handleSerialDisconnect);
    await disconnect(true);

    if (serialPort && canForgetSerialPort()) {
      try {
        await serialPort.forget();
      } catch (error) {
        console.error(MSG.forgetFailed, error);
      }
    }
  };

  return {
    isConnected,
    connecting,
    portName,
    debugStats,
    handleConnect,
    connect,
    disconnect,
    checkBrowserSupport,
    setupListeners,
    teardownListeners
  };
}
