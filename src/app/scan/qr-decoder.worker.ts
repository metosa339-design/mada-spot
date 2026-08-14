// Mada Spot — Scanner : Web Worker de décodage QR (zxing).
// Décode les trames vidéo hors du thread principal pour garder l'UI fluide.
// Reçoit une trame RGBA (ArrayBuffer transférable), renvoie le texte ou null.

/// <reference lib="webworker" />

import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  HybridBinarizer,
  BinaryBitmap,
} from '@zxing/library';

const reader = new MultiFormatReader();
const hints = new Map<DecodeHintType, unknown>();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
hints.set(DecodeHintType.TRY_HARDER, true);
reader.setHints(hints);

interface FrameMessage {
  id: number;
  width: number;
  height: number;
  buffer: ArrayBuffer;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<FrameMessage>) => {
  const { id, width, height, buffer } = e.data;
  const rgba = new Uint8ClampedArray(buffer);
  const size = width * height;

  // Conversion RGBA → luminance (moyenne vert-favorisée : (r + 2g + b) / 4).
  const luminances = new Uint8ClampedArray(size);
  for (let i = 0, j = 0; i < size; i++, j += 4) {
    luminances[i] = (rgba[j] + 2 * rgba[j + 1] + rgba[j + 2]) >> 2;
  }

  try {
    const source = new RGBLuminanceSource(luminances, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const result = reader.decode(bitmap);
    ctx.postMessage({ id, text: result.getText() });
  } catch {
    // NotFoundException attendu quand aucune trame ne contient de QR.
    ctx.postMessage({ id, text: null });
  } finally {
    reader.reset();
  }
};

export {};
