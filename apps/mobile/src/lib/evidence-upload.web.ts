import type { EvidenceFile } from '../providers/media';
export async function prepareEvidence(
  file: EvidenceFile | null,
  kind: string,
  text: string,
  note: string,
) {
  if (!file && !(kind === 'Chat log' && text.trim()))
    throw new Error('Choose or capture evidence first');
  if (file?.size && file.size > 25 * 1024 * 1024)
    throw new Error('Choose a file smaller than 25 MB');
  const pasted = kind === 'Chat log' && !!text.trim();
  const blob = pasted
    ? new Blob([text], { type: 'text/plain' })
    : await fetch(file!.uri).then((r) => r.blob());
  if (blob.size > 25 * 1024 * 1024) throw new Error('Choose a file smaller than 25 MB');
  const data = new FormData();
  data.append('file', blob, pasted ? 'Chat-log.txt' : file!.name);
  data.append('kind', kind);
  data.append('note', note);
  return { data, cleanup: () => {} };
}
