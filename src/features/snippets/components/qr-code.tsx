"use client";

import { useRef, useEffect, forwardRef } from "react";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

function encodeQr(data: string): { modules: boolean[][]; size: number } {
  const segments = [{ mode: 4 as const, data: new TextEncoder().encode(data) }];

  for (let version = 1; version <= 6; version++) {
    const capacity = QR_BYTE_CAPACITY[version];
    const totalBytes = segments.reduce((sum, seg) => sum + seg.data.length, 0);
    if (totalBytes <= capacity) {
      const result = buildQrMatrix(version, segments);
      if (result) return result;
    }
  }
  return buildQrMatrix(6, segments) ?? { modules: [], size: 0 };
}

const QR_BYTE_CAPACITY: Record<number, number> = {
  1: 17, 2: 32, 3: 53, 4: 78, 5: 106, 6: 134,
};

const ALIGNMENT_PATTERNS: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
};

function buildQrMatrix(
  version: number,
  segments: { mode: number; data: Uint8Array }[]
): { modules: boolean[][]; size: number } | null {
  const size = 17 + version * 4;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  addFinderPatterns(modules, size);
  addTimingPatterns(modules, size);
  addAlignmentPatterns(modules, size, version);
  reserveFormatInfo(modules, size);

  const totalCodewords = QR_BYTE_CAPACITY[version];
  const ecCodewordsPerBlock = EC_CODEWORDS_PER_BLOCK[version];
  const blocks1 = EC_BLOCKS1[version];
  const dataCodewords = totalCodewords - ecCodewordsPerBlock * blocks1;

  const bitBuffer: number[] = [];
  for (const seg of segments) {
    addModeBits(bitBuffer, seg.mode);
    addLengthBits(bitBuffer, seg.data.length, version);
    for (const b of seg.data) {
      for (let i = 7; i >= 0; i--) bitBuffer.push((b >> i) & 1);
    }
  }
  addTerminatorBits(bitBuffer, dataCodewords * 8);

  const dataBytes = bitsToBytes(bitBuffer, dataCodewords);
  if (dataBytes.length < dataCodewords) {
    const pad = [0xEC, 0x11];
    let pi = 0;
    while (dataBytes.length < dataCodewords) {
      dataBytes.push(pad[pi % 2]);
      pi++;
    }
  }

  const allBlocks: number[][] = [];
  for (let b = 0; b < blocks1; b++) {
    const start = b * dataCodewords;
    const block = dataBytes.slice(start, start + dataCodewords);
    const ec = computeEc(block, ecCodewordsPerBlock);
    allBlocks.push([...block, ...ec]);
  }
  const interleaved = interleave(allBlocks);
  const finalBytes = interleaved.slice(0, totalCodewords);

  placeData(modules, size, finalBytes);
  applyMask(modules, size, 2);

  return { modules, size };
}

function addFinderPatterns(modules: boolean[][], size: number) {
  const positions = [[0, 0], [0, size - 7], [size - 7, 0]];
  for (const [r, c] of positions) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const v = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        modules[r + i][c + j] = v;
      }
    }
  }
}

function addTimingPatterns(modules: boolean[][], size: number) {
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }
}

function addAlignmentPatterns(modules: boolean[][], size: number, version: number) {
  const centers = ALIGNMENT_PATTERNS[version];
  for (const r of centers) {
    for (const c of centers) {
      if (
        (r < 9 && c < 9) ||
        (r < 9 && c > size - 9) ||
        (r > size - 9 && c < 9)
      ) continue;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          modules[r + i][c + j] = i === -2 || i === 2 || j === -2 || j === 2 || (i === 0 && j === 0);
        }
      }
    }
  }
}

function reserveFormatInfo(modules: boolean[][], size: number) {
  for (let i = 0; i <= 8; i++) {
    if (modules[8][i] === false) modules[8][i] = false;
    if (modules[i][8] === false) modules[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    modules[8][i] = false;
  }
  for (let i = size - 7; i < size; i++) {
    modules[i][8] = false;
  }
  modules[size - 8][8] = true;
}

function addModeBits(buffer: number[], mode: number) {
  const bits = mode === 4 ? [0, 1, 0, 0] : [0, 0, 1, 0];
  buffer.push(...bits);
}

function addLengthBits(buffer: number[], length: number, version: number) {
  const bitCount = version <= 9 ? 8 : 16;
  for (let i = bitCount - 1; i >= 0; i--) {
    buffer.push((length >> i) & 1);
  }
}

function addTerminatorBits(buffer: number[], capacity: number) {
  const termBits = Math.min(4, capacity - buffer.length);
  for (let i = 0; i < termBits; i++) buffer.push(0);
  while (buffer.length % 8 !== 0) buffer.push(0);
}

function bitsToBytes(bits: number[], maxBytes: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length && bytes.length < maxBytes; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | (bits[i + j] ?? 0);
    }
    bytes.push(b);
  }
  return bytes;
}

const EC_CODEWORDS_PER_BLOCK: Record<number, number> = { 1: 7, 2: 10, 3: 15, 4: 20, 5: 26, 6: 18 };
const EC_BLOCKS1: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2 };

function computeEc(data: number[], ecCount: number): number[] {
  const generator = getGeneratorPoly(ecCount);
  const msg = [...data, ...Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    if (msg[i] === 0) continue;
    const factor = GF_EXP[GF_LOG[msg[i]]];
    for (let j = 0; j < generator.length; j++) {
      msg[i + j] ^= gfMul(generator[j], factor);
    }
  }
  return msg.slice(data.length);
}

const _generatorCache: Record<number, number[]> = {};
function getGeneratorPoly(degree: number): number[] {
  if (_generatorCache[degree]) return _generatorCache[degree];
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, [1, GF_EXP[i]]);
  }
  _generatorCache[degree] = poly;
  return poly;
}

function polyMul(a: number[], b: number[]): number[] {
  const result = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return result;
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

const GF_EXP = new Array(256);
const GF_LOG = new Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11D;
  }
  GF_EXP[255] = GF_EXP[0];
  GF_LOG[0] = 0;
}

function interleave(blocks: number[][]): number[] {
  const result: number[] = [];
  const maxLen = Math.max(...blocks.map(b => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const block of blocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  return result;
}

function placeData(modules: boolean[][], size: number, data: number[]) {
  let bitIndex = 0;
  let col = size - 1;
  let goingUp = true;

  while (col > 0) {
    if (col === 6) col--;
    const rows = goingUp
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (modules[row][c] === false && bitIndex < data.length * 8) {
          const byteIdx = bitIndex >> 3;
          const bitPos = 7 - (bitIndex & 7);
          modules[row][c] = ((data[byteIdx] >> bitPos) & 1) === 1;
          bitIndex++;
        } else if (modules[row][c] === false) {
          modules[row][c] = false;
        }
      }
    }
    col -= 2;
    goingUp = !goingUp;
  }
}

function applyMask(modules: boolean[][], size: number, maskPattern: number) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFunctionModule(r, c, size)) continue;
      let invert = false;
      switch (maskPattern) {
        case 0: invert = (r + c) % 2 === 0; break;
        case 1: invert = r % 2 === 0; break;
        case 2: invert = c % 3 === 0; break;
        case 3: invert = (r + c) % 3 === 0; break;
        case 4: invert = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
        case 5: invert = ((r * c) % 2) + ((r * c) % 3) === 0; break;
        case 6: invert = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; break;
        case 7: invert = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; break;
      }
      if (invert) modules[r][c] = !modules[r][c];
    }
  }
}

function isFunctionModule(r: number, c: number, size: number): boolean {
  if (r === 6 || c === 6) return true;
  if (r <= 8 && c <= 8) return true;
  if (r <= 8 && c >= size - 8) return true;
  if (r >= size - 8 && c <= 8) return true;
  return false;
}

export const QrCode = forwardRef<HTMLCanvasElement, QrCodeProps>(({ value, size = 200, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    const qr = encodeQr(value);
    if (qr.size === 0) return;

    const moduleSize = Math.floor(size / qr.size);
    const quietZone = 4 * moduleSize;
    const totalSize = qr.size * moduleSize + quietZone * 2;

    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalSize, totalSize);

    ctx.fillStyle = "#000000";
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.modules[r][c]) {
          ctx.fillRect(
            quietZone + c * moduleSize,
            quietZone + r * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, size]);

  return (
    <canvas
      ref={(node) => {
        canvasRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={className}
      style={{ width: size, height: size }}
    />
  );
});
QrCode.displayName = "QrCode";
