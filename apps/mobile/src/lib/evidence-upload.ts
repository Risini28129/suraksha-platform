import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import type { EvidenceFile } from '../providers/media';
export async function prepareEvidence(
  file: EvidenceFile | null,
  kind: string,
  text: string,
  note: string,
) {
  let temporary: File | null = null;
  let selected = file;
  if (kind === 'Chat log' && text.trim()) {
    temporary = new File(Paths.cache, `captured-${randomUUID()}.txt`);
    temporary.write(text);
    selected = {
      uri: temporary.uri,
      name: 'Chat-log.txt',
      mimeType: 'text/plain',
      size: temporary.size,
    };
  }
  if (!selected) throw new Error('Choose or capture evidence first');
  if (selected.size && selected.size > 25 * 1024 * 1024) {
    temporary?.delete();
    throw new Error('Choose a file smaller than 25 MB');
  }
  const source = temporary || new File(selected.uri);
  if (!source.exists) {
    throw new Error('The selected file is no longer available. Import it again.');
  }
  if (source.size > 25 * 1024 * 1024) {
    temporary?.delete();
    throw new Error('Choose a file smaller than 25 MB');
  }
  const data = {
    nativeUpload: true as const,
    uri: source.uri,
    mimeType: selected.mimeType || source.type || 'application/octet-stream',
    parameters: { kind, note, filename: selected.name },
  };
  return {
    data,
    cleanup: () => {
      if (temporary?.exists) temporary.delete();
    },
  };
}
