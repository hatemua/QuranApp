import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export async function downloadIfMissing(url: string, dest: string): Promise<boolean> {
  if (existsSync(dest)) {
    console.log(`  already cached: ${dest}`);
    return false;
  }
  console.log(`  downloading: ${url}`);
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'quranic-immersion-seed/0.0.1 (+local script)' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  saved ${dest} (${buf.length.toLocaleString()} bytes)`);
  return true;
}
