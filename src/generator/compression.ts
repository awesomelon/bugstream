import { strToU8, gzip, strFromU8, gunzip, type FlateError } from 'fflate';

export async function compressData(data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = strToU8(data);
    gzip(input, { level: 9 }, (err: FlateError | null, compressed: Uint8Array) => {
      if (err) {
        reject(err);
        return;
      }
      // Convert Uint8Array to base64 without spread operator to avoid stack overflow
      // Process in chunks to handle large arrays safely
      const CHUNK_SIZE = 0x8000; // 32KB chunks
      let binary = '';
      for (let i = 0; i < compressed.length; i += CHUNK_SIZE) {
        const chunk = compressed.subarray(i, i + CHUNK_SIZE);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      const base64 = btoa(binary);
      resolve(base64);
    });
  });
}

export async function decompressData(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    gunzip(bytes, (err: FlateError | null, decompressed: Uint8Array) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(strFromU8(decompressed));
    });
  });
}
