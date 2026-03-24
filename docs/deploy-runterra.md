# Deploy to runterra

- App path: `/home/user1/apps/saitalevit/current`
- PM2 app: `saitalevit`
- Internal port: `3003`
- Public route via Caddy: `/saitalevit/`

## Notes

- Caddy should redirect `/saitalevit` to `/saitalevit/`
- Caddy should proxy `/saitalevit/*` to `127.0.0.1:3003` with `uri strip_prefix /saitalevit`
- The app uses relative privacy links and runtime-detected base path for form API and builder sprite images
