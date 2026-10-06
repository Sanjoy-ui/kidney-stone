/**
 * Self-contained QR Code Generator (Pure JavaScript, Zero External Dependencies)
 * Generates QR Code matrices for vector rendering in PDFKit.
 */

// Galois Field GF(256) tables for Reed-Solomon error correction
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 128 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function polyMul(p, q) {
  const result = new Uint8Array(p.length + q.length - 1);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      result[i + j] ^= gMul(p[i], q[j]);
    }
  }
  return result;
}

function getGeneratorPoly(deg) {
  let g = new Uint8Array([1]);
  for (let i = 0; i < deg; i++) {
    g = polyMul(g, new Uint8Array([1, EXP_TABLE[i]]));
  }
  return g;
}

function rsEncode(data, ecCount) {
  const gen = getGeneratorPoly(ecCount);
  const msg = new Uint8Array(data.length + ecCount);
  msg.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// Version table parameters for Error Correction Level L
// [Version, ModuleCount, TotalCodewords, ECCodewords, DataCodewords]
const VERSIONS = [
  { version: 1, size: 21, total: 26, ec: 7, data: 19 },
  { version: 2, size: 25, total: 44, ec: 10, data: 34 },
  { version: 3, size: 29, total: 70, ec: 15, data: 55 },
  { version: 4, size: 33, total: 100, ec: 20, data: 80 },
  { version: 5, size: 37, total: 134, ec: 26, data: 108 },
];

export function generateQRCodeMatrix(text) {
  const bytes = Buffer.from(text, 'utf-8');
  let ver = VERSIONS.find((v) => v.data >= bytes.length + 3);
  if (!ver) {
    ver = VERSIONS[VERSIONS.length - 1];
  }

  // Bit buffer for byte mode (Mode: 0100)
  const bitArr = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bitArr.push((val >> i) & 1);
    }
  }

  // 1. Mode Indicator: 0100 (8-bit Byte)
  pushBits(0b0100, 4);

  // 2. Character Count Indicator (8 bits for Ver 1-9)
  const len = Math.min(bytes.length, ver.data - 2);
  pushBits(len, 8);

  // 3. Encoded data bytes
  for (let i = 0; i < len; i++) {
    pushBits(bytes[i], 8);
  }

  // 4. Terminator (up to 4 bits)
  const maxBits = ver.data * 8;
  const pad = Math.min(4, maxBits - bitArr.length);
  pushBits(0, pad);

  // 5. Pad to multiple of 8
  while (bitArr.length % 8 !== 0) {
    bitArr.push(0);
  }

  // 6. Fill with alternate padding bytes 0xEC and 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArr.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataWords = new Uint8Array(ver.data);
  for (let i = 0; i < ver.data; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitArr[i * 8 + b];
    }
    dataWords[i] = byteVal;
  }

  // Compute Reed-Solomon Error Correction Codewords
  const ecWords = rsEncode(dataWords, ver.ec);

  // Combine Data + EC
  const finalCodewords = new Uint8Array(ver.total);
  finalCodewords.set(dataWords, 0);
  finalCodewords.set(ecWords, ver.data);

  // Convert final codewords to bit stream
  const finalBits = [];
  for (let i = 0; i < finalCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((finalCodewords[i] >> b) & 1);
    }
  }

  // Matrix creation: size x size
  const N = ver.size;
  const matrix = Array.from({ length: N }, () => Array(N).fill(null));
  const isFunction = Array.from({ length: N }, () => Array(N).fill(false));

  function setModule(r, c, val, isFunc = true) {
    matrix[r][c] = val;
    isFunction[r][c] = isFunc;
  }

  // Draw 7x7 Finder Pattern with 1-module white separator
  function drawFinder(r0, c0) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(rr, cc, isBlack ? 1 : 0);
        } else {
          setModule(rr, cc, 0);
        }
      }
    }
  }

  // Place Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    setModule(6, i, i % 2 === 0 ? 1 : 0);
    setModule(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Dark module
  setModule(4 * ver.version + 9, 8, 1);

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) isFunction[8][i] = true;
    if (matrix[i][8] === null) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][N - 1 - i] === null) isFunction[8][N - 1 - i] = true;
    if (matrix[N - 1 - i][8] === null) isFunction[N - 1 - i][8] = true;
  }

  // Alignment pattern for Version 2+
  if (ver.version >= 2) {
    const alignCoords = ver.version === 2 ? [18] : ver.version === 3 ? [22] : [26];
    for (const r of alignCoords) {
      for (const c of alignCoords) {
        if (isFunction[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setModule(r + dr, c + dc, isBlack ? 1 : 0);
          }
        }
      }
    }
  }

  // Place data bits in standard 2-column zigzag
  let bitIdx = 0;
  let upwards = true;
  for (let right = N - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    for (let vertical = 0; vertical < N; vertical++) {
      const r = upwards ? N - 1 - vertical : vertical;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const c = right - colOffset;
        if (!isFunction[r][c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply standard Mask 0: (r + c) % 2 == 0
          const mask = (r + c) % 2 === 0 ? 1 : 0;
          matrix[r][c] = bit ^ mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info for Level L, Mask 0: 0b111011111000100
  const formatInfo = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  // Write format info around top-left, top-right, bottom-left
  for (let i = 0; i < 6; i++) matrix[8][i] = formatInfo[i];
  matrix[8][7] = formatInfo[6];
  matrix[8][8] = formatInfo[7];
  matrix[7][8] = formatInfo[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatInfo[i];

  for (let i = 0; i < 8; i++) matrix[8][N - 1 - i] = formatInfo[i];
  for (let i = 8; i < 15; i++) matrix[N - 15 + i][8] = formatInfo[i];

  return matrix;
}

/**
 * Helper to render the generated QR matrix directly into a PDFKit document
 */
export function drawQRCodeInPDF(doc, matrix, startX, startY, size, color = '#03045e') {
  const N = matrix.length;
  const cellSize = size / N;
  doc.save();
  doc.fillColor(color);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c] === 1) {
        doc.rect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize).fill();
      }
    }
  }
  doc.restore();
}
