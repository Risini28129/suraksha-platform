import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createWorker, type Worker } from 'tesseract.js';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
let busy = false;
export async function recognizeScreenshot(bytes: Buffer) {
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!png && !jpeg) throw new BadRequestException('Choose a PNG or JPG screenshot.');
  if (busy)
    throw new ServiceUnavailableException('Another screenshot is being read. Try again shortly.');
  busy = true;
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  try {
    const cachePath = resolve(process.env.OCR_CACHE_DIR || '.local/ocr');
    await mkdir(cachePath, { recursive: true });
    const work = (async () => {
      worker = await createWorker('eng', 1, { cachePath });
      if (cancelled) {
        await worker.terminate();
        throw new Error('Cancelled');
      }
      const { data } = await worker.recognize(bytes);
      const text = data.text.trim();
      if (!text)
        throw new BadRequestException(
          'No readable text found. Use a clearer screenshot or paste the text.',
        );
      return { text: text.slice(0, 10000), language: 'en' };
    })();
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          cancelled = true;
          reject(new Error('OCR timeout'));
        }, 45000);
      }),
    ]);
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new ServiceUnavailableException(
      'Could not read this screenshot. Try a clearer PNG/JPG or paste the text.',
    );
  } finally {
    clearTimeout(timer);
    if (worker) await worker.terminate().catch(() => {});
    busy = false;
  }
}
