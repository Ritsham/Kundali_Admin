# Kundali Admin

Standalone admin console for consultation requests.

## Run

```bash
cd /Users/riteshkumarsingh/Desktop/Kundali_admin
python3 -m http.server 8088
```

Open:

```text
http://127.0.0.1:8088
```

## Connect

1. Keep the main Kundali backend running at `http://127.0.0.1:8000`.
2. Apply the `consultants` and `consultation_requests` SQL from `Desktop/Kundali/scripts/supabase_migration.sql`.
3. Login as admin in the main app.
4. Paste the admin Supabase access token into Connection settings.

The admin console calls the main backend admin APIs. It does not store or use Supabase service-role keys in the browser.
