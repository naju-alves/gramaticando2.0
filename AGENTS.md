<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Use TanStack Start server functions for app APIs and server-only helpers for credential and session handling; browser code must never receive secrets.
- Preserve the six specified domain tables, field names and relationships on the user-approved Cloud PostgreSQL database; do not add schema without authorization.
- Authenticate against `usuario` with salted PBKDF2 hashes and signed HTTP-only cookies using a dedicated session secret.
- Give students and teachers identical study-only access regardless of self-selected account label; disable all management operations and administrator sign-in without changing the domain schema.
- Fetch educational data from the database, not permanent frontend fixtures; only the three prescribed levels are initially seeded.
