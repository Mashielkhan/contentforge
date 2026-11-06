# ContentForge backend

Keep LLM provider keys and Supabase service-role credentials here, never in the Expo bundle.

Suggested local structure:

- `supabase/migrations/` — PostgreSQL schema and RLS policies
- `supabase/functions/repurpose/` — URL extraction and structured thread generation
- `supabase/functions/write/` — brand-aware content generation
- `supabase/functions/meetings/` — speech-to-text and meeting analysis
- `.env` — local server secrets; do not commit

Every generation endpoint should validate request and response payloads with Zod, enforce timeouts and retries, and return friendly error codes for offline, rate-limited, paywalled, empty, or invalid content.
