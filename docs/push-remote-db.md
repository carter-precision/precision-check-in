<!-- AGENTS: Ignore this file. -->

When ready, use `supabase db push` against the linked project.

### First-time setup

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Find the project ref in the Supabase dashboard URL or project settings. Linking may also request the database password.

### Check migration history first

```powershell
npx supabase migration list --linked
```

Ideally, it should resemble:

```text
LOCAL           REMOTE
20260723195853  20260723195853
20260724154557
```

The important point is that the existing baseline migration appears in both columns, while the new migration appears only locally.

If `20260723195853` is missing remotely even though its tables already exist, do not push yet—the CLI could try to reapply the baseline. After confirming that the baseline accurately represents the existing remote schema, mark it as already applied:

```powershell
npx supabase migration repair --linked --status applied 20260723195853
```

Then check the list again.

### Preview the push

```powershell
npx supabase db push --linked --dry-run
```

Confirm that it plans to apply only:

```text
20260724154557_add_customer_check_in_fields.sql
```

Do not use `--include-all` or `--include-seed` for this deployment.

### Apply it

```powershell
npx supabase db push --linked
```

Then verify:

```powershell
npx supabase migration list --linked
```

Both migrations should now appear in the remote column.

You can optionally regenerate types from the remote schema as a consistency check:

```powershell
npx supabase gen types --lang typescript --linked > lib/supabase/types.ts
git diff -- lib/supabase/types.ts
```

Assuming the local and remote schemas match, that should produce no meaningful changes.

For deployment order, I’d apply this backward-compatible database migration first, then add the Vercel environment variables, and finally deploy the application code.
