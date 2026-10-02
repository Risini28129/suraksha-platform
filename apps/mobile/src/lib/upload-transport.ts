import {
  createUploadTask,
  FileSystemUploadType,
  FileSystemSessionType,
} from 'expo-file-system/legacy';
export function isNativeUpload(
  body: unknown,
): body is {
  nativeUpload: true;
  uri: string;
  mimeType: string;
  parameters: Record<string, string>;
} {
  return !!body && typeof body === 'object' && 'nativeUpload' in body && body.nativeUpload === true;
}
export async function nativeUpload(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  signal: AbortSignal,
) {
  if (!isNativeUpload(body)) throw new Error('Invalid upload');
  const task = createUploadTask(url, body.uri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    sessionType: FileSystemSessionType.FOREGROUND,
    fieldName: 'file',
    mimeType: body.mimeType,
    parameters: body.parameters,
    headers,
  });
  const cancel = () => {
    void task.cancelAsync().catch(() => {});
  };
  signal.addEventListener('abort', cancel);
  try {
    if (signal.aborted) throw new Error('Upload cancelled');
    const result = await task.uploadAsync();
    if (!result) throw new Error('Upload cancelled');
    return new Response(result.body, { status: result.status, headers: result.headers });
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}
