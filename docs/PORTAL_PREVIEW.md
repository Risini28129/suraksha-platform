# Staff portal preview

All four portals share the existing admin layout and responsive components. Colors follow `Suraksha_Screen_Admin,police,counsilor.docx`: navy sidebar, pale blue background, white cards, green selected navigation, and red selected navigation for police. Existing API actions and authorization are unchanged.

Open http://localhost:3000 and use these existing demo accounts:

| Portal        | URL                | Login       |
| ------------- | ------------------ | ----------- |
| Admin         | /admin/sign-in     | SL-ADM-0192 |
| Police        | /police/sign-in    | WP-CDU-0044 |
| Counselor     | /counselor/sign-in | CNS-0071    |
| Legal advisor | /legal/sign-in     | LGL-0012    |

Passwords use the existing SEED_PASSWORD in .env.

To add fictional portal data after standard demo accounts have been seeded:

```powershell
node --env-file=.env node_modules/tsx/dist/cli.mjs --tsconfig services/api/tsconfig.json services/api/prisma/seed-portals-preview.ts
```

The seed adds four fictional clients, four sessions dated on the day of execution, private messages, one care note, four legal queries and three SOS alerts. It preserves existing workflow decisions when rerun and refuses production environments. New dates create a new daily schedule. No external services are contacted.

Desktop (1440px) and mobile (390px) screenshots and a browser smoke-check script are in artifacts/portal-reference. The script visits 19 staff routes at both widths. It checks browser errors, visible API errors and horizontal overflow. It does not exercise every mutation.
