# Local mobile browser preview

Open http://localhost:8083. The app has a centered mobile layout on desktop and adapts to phone widths. Existing navy, green and blue colors are preserved across all 31 screens.

Start these commands in separate terminals from the repository root:

- `npm run dev:api` (port 4001; requires PostgreSQL and root .env)
- `npm run dev:ai` (port 8000; install `python -m pip install -r services/ai/requirements.txt` first)
- `npm run dev:mobile:web` (port 8083; proxies /v1 to the local API)

## Demo login

NIC/login: `MOBILE-DEMO-01`. Password: existing `SEED_PASSWORD` in `.env`. PIN: `123456`.
After login, hold the calculator display for 1.5 seconds to open private PIN entry, then enter the PIN. This is the app's privacy disguise. Browser credentials stay in memory; reloading requires login again. Native builds use SecureStore.

Create this fictional account and three upcoming counselor slots with:

`node --env-file=.env node_modules/tsx/dist/cli.mjs --tsconfig services/api/tsconfig.json services/api/prisma/seed-mobile-preview.ts`

## Local storage

This workspace uses `EVIDENCE_PROVIDER=local` and `LOCAL_OBJECT_DIR=C:/Users/User/suraksha-platform/.local/evidence` because local MinIO was unavailable. Evidence remains encrypted by the existing API encryption service. No existing evidence records were present when switching. The data directory is ignored by Git. Configure the appropriate storage provider separately for deployment.

## Verification

- Mobile TypeScript and ESLint checks pass.
- 44 mobile tests pass, including all screen renders, media flows, asynchronous errors, duplicate submission prevention, consent withdrawal and SOS without location.
- Android and iOS production bundles export successfully.
- Edge browser checks cover login/disguise/PIN, contacts, encrypted evidence upload and decrypted preview, attached reports and case messages, legal chat/escalation, wellbeing consent, counselor booking/messages, community moderation submission, analysis, SOS/safe status and logout.
- Run `node artifacts/check-mobile-modern.cjs` while the services are running. It writes screenshots and creates fictional demo records; counselor slots must be available.

## External/device limits

Phone camera, microphone, biometrics, notifications and launcher disguise require physical-device testing. Browser checks do not verify those native integrations. External emergency/contact delivery, live video and live safe routing are not connected. Analysis uses the existing explicitly non-validated development model. The UI reports these limits rather than claiming real dispatch or validated safety predictions.

## Screenshot import and native uploads

Native evidence uploads use Expo FileSystem multipart tasks directly, with authorization, timeout cancellation and the existing encrypted API storage. Browser uploads retain FormData. In Scan a message, Import screenshot extracts text from English PNG/JPG images (maximum 10 MB); review/edit it before analysis. OCR runs locally with Tesseract; its English model downloads on first use and caches in the API working directory under .local/ocr. No screenshot is sent to an external OCR provider. Analysis remains a basic phrase check, not a calibrated risk probability.
