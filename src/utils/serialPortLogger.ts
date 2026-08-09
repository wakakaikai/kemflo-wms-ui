export type SerialLogLevel = 'info' | 'warn' | 'error' | 'raw' | 'packet';

export interface SerialPortLogger {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  raw: (message: string, bytes: Uint8Array) => void;
  packet: (message: string, packet: string) => void;
}

const LOG_PREFIX = '[SerialPort]';
const DEBUG_STORAGE_KEY = 'serialPortDebug';

export function isSerialDebugEnabled(explicit?: boolean) {
  if (explicit !== undefined) {
    return explicit;
  }
  if (typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_STORAGE_KEY) === '1') {
    return true;
  }
  return import.meta.env.DEV;
}

export function formatSerialHex(bytes: Uint8Array, max = 64) {
  const slice = bytes.slice(0, max);
  const hex = Array.from(slice)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
  return bytes.length > max ? `${hex} ... (+${bytes.length - max} bytes)` : hex;
}

export function formatSerialAscii(bytes: Uint8Array, max = 64) {
  const slice = bytes.slice(0, max);
  const text = Array.from(slice)
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');
  return bytes.length > max ? `${text}...` : text;
}

export function createSerialPortLogger(enabled: boolean): SerialPortLogger {
  const write = (level: SerialLogLevel, message: string, data?: unknown) => {
    if (!enabled) {
      return;
    }
    const time = new Date().toISOString().slice(11, 23);
    const header = `${LOG_PREFIX} ${time} [${level}] ${message}`;
    if (data === undefined) {
      console.log(header);
      return;
    }
    console.log(header, data);
  };

  return {
    info: (message, data) => write('info', message, data),
    warn: (message, data) => write('warn', message, data),
    error: (message, data) => console.error(`${LOG_PREFIX} [error] ${message}`, data ?? ''),
    raw: (message, bytes) => {
      if (!enabled) {
        return;
      }
      write('raw', message, {
        length: bytes.length,
        hex: formatSerialHex(bytes),
        ascii: formatSerialAscii(bytes)
      });
    },
    packet: (message, packet) => write('packet', message, { length: packet.length, packet })
  };
}

/** Background consumer: logs whether any raw bytes arrive from the device. */
export async function monitorRawSerialStream(
  stream: ReadableStream<Uint8Array>,
  logger: SerialPortLogger,
  shouldContinue: () => boolean,
  onChunk?: (bytes: Uint8Array) => void
) {
  const reader = stream.getReader();
  let totalBytes = 0;
  let chunkCount = 0;

  logger.info('raw monitor started');

  try {
    while (shouldContinue()) {
      const { value, done } = await reader.read();
      if (done) {
        logger.info('raw monitor stream done', { totalBytes, chunkCount });
        break;
      }
      if (!value?.length) {
        continue;
      }
      chunkCount += 1;
      totalBytes += value.length;
      onChunk?.(value);
      logger.raw(`chunk #${chunkCount}`, value);
    }
  } catch (error) {
    logger.error('raw monitor failed', error);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
    logger.info('raw monitor stopped', { totalBytes, chunkCount });
  }
}

export interface SerialDebugStats {
  connectedAt: string;
  totalRawBytes: number;
  totalRawChunks: number;
  totalPackets: number;
  lastRawAt: string;
  lastPacketAt: string;
  lastError: string;
}

export function createEmptySerialDebugStats(): SerialDebugStats {
  return {
    connectedAt: '',
    totalRawBytes: 0,
    totalRawChunks: 0,
    totalPackets: 0,
    lastRawAt: '',
    lastPacketAt: '',
    lastError: ''
  };
}
