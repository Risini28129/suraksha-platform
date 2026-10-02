import { File } from 'expo-file-system';
import { prepareEvidence } from '../src/lib/evidence-upload';
import { nativeUpload } from '../src/lib/upload-transport';
import { createUploadTask } from 'expo-file-system/legacy';
jest.mock('expo-file-system/legacy', () => ({
  createUploadTask: jest.fn(),
  FileSystemUploadType: { MULTIPART: 1 },
  FileSystemSessionType: { FOREGROUND: 0 },
}));
let source: any;
beforeEach(() => {
  jest.clearAllMocks();
  (File as unknown as jest.Mock).mockImplementation(() => {
    source = {
      uri: 'file:///cache/example',
      exists: true,
      size: 20,
      type: 'image/png',
      write: jest.fn(),
      delete: jest.fn(),
    };
    return source;
  });
});
it('uploads photo files directly with authorization and metadata', async () => {
  const prepared = await prepareEvidence(
    { uri: 'file:///cache/photo.png', name: 'photo.png', mimeType: 'image/png' },
    'Photo',
    '',
    'Example',
  );
  (createUploadTask as jest.Mock).mockReturnValue({
    uploadAsync: async () => ({ body: '{"id":"saved"}', status: 201, headers: {} }),
    cancelAsync: jest.fn(),
  });
  const response = await nativeUpload(
    'http://localhost/evidence',
    prepared.data,
    { Authorization: 'Bearer test' },
    new AbortController().signal,
  );
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ id: 'saved' });
  expect(createUploadTask).toHaveBeenCalledWith(
    'http://localhost/evidence',
    'file:///cache/example',
    expect.objectContaining({
      fieldName: 'file',
      mimeType: 'image/png',
      headers: { Authorization: 'Bearer test' },
      parameters: { kind: 'Photo', note: 'Example', filename: 'photo.png' },
    }),
  );
  prepared.cleanup();
  expect(source.delete).not.toHaveBeenCalled();
});
it('writes pasted text to a file and cleans it after uploading', async () => {
  const upload = await prepareEvidence(null, 'Chat log', 'Fictional message', '');
  expect(source.write).toHaveBeenCalledWith('Fictional message');
  expect(upload.data.parameters.filename).toBe('Chat-log.txt');
  expect(upload.data.mimeType).toBe('text/plain');
  upload.cleanup();
  expect(source.delete).toHaveBeenCalledTimes(1);
});
it('rejects oversize files before uploading', async () => {
  await expect(
    prepareEvidence(
      { uri: 'file:///large.png', name: 'large.png', size: 26 * 1024 * 1024 },
      'Photo',
      '',
      '',
    ),
  ).rejects.toThrow('25 MB');
});
it('cancels the native task when the request times out', async () => {
  const cancelAsync = jest.fn().mockResolvedValue(undefined);
  let finish: (value: any) => void = () => {};
  (createUploadTask as jest.Mock).mockReturnValue({
    uploadAsync: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    cancelAsync,
  });
  const controller = new AbortController();
  const upload = nativeUpload(
    'http://localhost/evidence',
    { nativeUpload: true, uri: 'file:///photo', mimeType: 'image/png', parameters: {} },
    {},
    controller.signal,
  );
  controller.abort();
  expect(cancelAsync).toHaveBeenCalledTimes(1);
  finish(undefined);
  await expect(upload).rejects.toThrow('Upload cancelled');
});
