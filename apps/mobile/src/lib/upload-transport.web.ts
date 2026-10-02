export function isNativeUpload(_body: unknown): boolean {
  return false;
}
export async function nativeUpload(
  _url: string,
  _body: unknown,
  _headers: Record<string, string>,
  _signal: AbortSignal,
): Promise<Response> {
  throw new Error('Native file upload is not used in the browser');
}
