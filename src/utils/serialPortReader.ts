/** Common scale formats: +10.31kg, 10.31kg, +123.456g */
const WEIGHT_PACKET_HEAD_RE = /^[+\-]?\d+\.\d+[a-zA-Z]*/;
const WEIGHT_PACKET_ANYWHERE_RE = /[+\-]?\d+\.\d+[a-zA-Z]*/g;

const MAX_BUFFER_SIZE = 128;

/**
 * Parse serial text stream into complete packets.
 * Supports line delimiters (\\r\\n, \\n, \\r, }) and delimiter-free scales like +10.31kg.
 * @see https://developer.chrome.com/docs/capabilities/serial#transform
 */
export class SerialPacketTransformer {
  private buffer = '';
  private onWaiting?: (buffer: string) => void;

  constructor(onWaiting?: (buffer: string) => void) {
    this.onWaiting = onWaiting;
  }

  transform(chunk: string, controller: TransformStreamDefaultController<string>) {
    this.buffer += chunk;
    this.drain(controller);
    if (this.buffer.length > 0) {
      this.onWaiting?.(this.buffer);
    }
  }

  flush(controller: TransformStreamDefaultController<string>) {
    this.drain(controller);
    const tail = this.buffer.trim();
    if (tail) {
      const match = tail.match(WEIGHT_PACKET_HEAD_RE);
      controller.enqueue(match ? match[0] : tail);
    }
    this.buffer = '';
  }

  private drain(controller: TransformStreamDefaultController<string>) {
    let progress = true;
    while (progress && this.buffer.length > 0) {
      progress = false;

      if (this.tryDrainByDelimiter(controller)) {
        progress = true;
        continue;
      }

      if (this.tryDrainByWeightPattern(controller)) {
        progress = true;
        continue;
      }

      if (this.buffer.length > MAX_BUFFER_SIZE) {
        this.recoverOversizedBuffer(controller);
        progress = true;
      }
    }
  }

  private tryDrainByDelimiter(controller: TransformStreamDefaultController<string>) {
    const rn = this.buffer.indexOf('\r\n');
    const n = this.buffer.indexOf('\n');
    const r = this.buffer.indexOf('\r');
    const brace = this.buffer.indexOf('}');

    const candidates = [
      rn >= 0 ? rn + 2 : -1,
      n >= 0 ? n + 1 : -1,
      r >= 0 ? r + 1 : -1,
      brace >= 0 ? brace + 1 : -1
    ].filter((idx) => idx >= 0);

    if (candidates.length === 0) {
      return false;
    }

    const end = Math.min(...candidates);
    const line = this.buffer.slice(0, end);
    this.buffer = this.buffer.slice(end);
    const trimmed = line.trim();
    if (trimmed) {
      controller.enqueue(trimmed);
    }
    return true;
  }

  /** Delimiter-free scale stream, e.g. repeated +10.31kg chunks */
  private tryDrainByWeightPattern(controller: TransformStreamDefaultController<string>) {
    const match = this.buffer.match(WEIGHT_PACKET_HEAD_RE);
    if (!match) {
      return false;
    }
    controller.enqueue(match[0]);
    this.buffer = this.buffer.slice(match[0].length);
    return true;
  }

  private recoverOversizedBuffer(controller: TransformStreamDefaultController<string>) {
    const matches = this.buffer.match(WEIGHT_PACKET_ANYWHERE_RE);
    if (matches?.length) {
      const last = matches[matches.length - 1];
      controller.enqueue(last);
    }
    this.buffer = '';
  }
}

/** @deprecated use SerialPacketTransformer */
export const LineBreakTransformer = SerialPacketTransformer;

/** Set DTR/RTS after open; some USB serial scales need this to transmit. */
export async function applySerialPortSignals(
  serialPort: SerialPort,
  signals: { dataTerminalReady?: boolean; requestToSend?: boolean } = {},
  logger?: { info: (msg: string, data?: unknown) => void; warn: (msg: string, data?: unknown) => void }
) {
  if (typeof serialPort.setSignals !== 'function') {
    logger?.warn('setSignals not supported on this port');
    return;
  }

  const payload: SerialOutputSignals = {};
  if (signals.dataTerminalReady !== undefined) {
    payload.dataTerminalReady = signals.dataTerminalReady;
  }
  if (signals.requestToSend !== undefined) {
    payload.requestToSend = signals.requestToSend;
  }
  if (Object.keys(payload).length === 0) {
    payload.dataTerminalReady = true;
  }

  try {
    await serialPort.setSignals(payload);
    logger?.info('output signals set', payload);
  } catch (error) {
    logger?.warn('Failed to set serial port signals', error);
  }
}

/** @deprecated use applySerialPortSignals */
export async function enableSerialPortDtr(serialPort: SerialPort) {
  await applySerialPortSignals(serialPort, { dataTerminalReady: true });
}
