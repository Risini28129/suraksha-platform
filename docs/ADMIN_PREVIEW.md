# Admin preview

The admin workspace uses a responsive teal and sage theme with larger type, accessible field labels, searchable tables, filtered CSV export, explicit save feedback and one active navigation item. Pages include overview, reports, case details, users, moderation and model monitoring. Case actions are disabled together while an update is in flight to avoid stale-version conflicts.

## Local data

With the database migrated and the standard demo accounts already seeded, run:

```powershell
npm run db:seed:admin
```

This adds six fictional staff accounts, sixteen fictional reports, nine completed sample SOS records, seven moderation examples and model audit records. All extra staff use `SEED_PASSWORD` from `.env`. Two accounts start pending verification and one starts suspended so those views can be exercised. The command preserves existing records and review decisions when rerun. AI evaluation scores are intentionally not fabricated.

Start the API and web app using `npm run dev:api` and `npm run dev:web`. The web app uses `NEXT_PUBLIC_API_URL`; this local workspace currently uses port 4001 because another project occupies port 4000.

## Browser regression checks

With both services running and preview data seeded:

```powershell
$env:BROWSER_CHANNEL = 'msedge'
npx playwright test --config tests/admin-preview.config.ts
```

Omit `BROWSER_CHANNEL` to use Playwright's installed Chromium. Tests cover all six pages at desktop and phone widths, active navigation, horizontal overflow, browser/API error states, search, export, accessible controls and sign-out. They do not change review decisions.

During implementation, separate browser checks also exercised real database writes for police assignment, case notes, requests for information, escalation, resolution, staff creation/verification/suspension, moderation approval/removal and model audit requests. Those checks used fictional records only.
