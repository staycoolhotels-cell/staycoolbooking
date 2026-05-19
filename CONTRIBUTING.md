# Contributing to StayCool Booking

Welcome! We maintain a high standard of professional software development. Whether you are a core engineer, a solo developer, or an external collaborator, following these guidelines ensures a clean, robust, and premium codebase.

---

## 🗺️ Codebase Principles

1. **Less Clutter**: Keep root directories clean. Never dump temporary scripts or SQL fragments in the root. Use `experiments/`, `reports/`, or the appropriate `scripts/` subdirectories.
2. **Predictable Naming**: Use lowercase snake_case for scripts and database migration files (`database/migrations/`). Use lowercase kebab-case for documentation files (`docs/`).
3. **TypeScript First**: Strict typing is enabled. Avoid using `any` type. Define interfaces inside `src/types/`.
4. **Row Level Security (RLS)**: Any database schema addition MUST have corresponding RLS policies. Do not bypass RLS in the frontend.

---

## 🌿 Git Branching & Workflow

We follow a structured Git branching strategy:
- `main` or `production`: Production-ready code only.
- `staging`: Integration testing branch.
- `feature/...`: For implementing new features.
- `bugfix/...`: For patching existing bugs.
- `hotfix/...`: For urgent production fixes.

### Feature Flow:
1. Create a branch from `main` (e.g., `git checkout -b feature/auth-roles`).
2. Implement code, adhere to styling standards, and add tests.
3. Keep database migrations sequential.
4. Run locally and verify no TypeScript or ESLint errors:
   ```bash
   npm run lint
   npm run build
   ```
5. Submit a Pull Request targeting `staging` or `main`.

---

## 💬 Commit Message Convention

We follow the **Conventional Commits** specification to keep git history clean, readable, and machine-parsable:

Format: `<type>(<scope>): <description>`

### Types:
- `feat`: A new feature (e.g., `feat(payments): integrate razorpay refund api`)
- `fix`: A bug fix (e.g., `fix(calendar): prevent double bookings on same day`)
- `docs`: Documentation updates (e.g., `docs(readme): update environment setup instructions`)
- `style`: Code style changes (formatting, missing semi-colons, no logic changes)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Code changes that improve performance
- `test`: Adding or correcting tests (e.g., `test(rls): add profile view integration tests`)
- `chore`: Updates to build scripts, configurations, or dependencies

---

## 🎨 Coding Standards

- **Formatting**: Handled by Prettier and ESLint. Do not commit poorly formatted code.
- **Indentation**: 2 spaces (configured via `.editorconfig`).
- **React Components**: 
  - Store reusable UI under `src/components/`.
  - Prefix pages and route layouts properly using Next.js App Router rules.
  - Prioritize tailwind classes or custom vanilla CSS over inline styling.
- **Database Schema**:
  - Write SQL migrations under `database/migrations/`.
  - Prefix with current date: `YYYY_MM_DD_NN_slug.sql` (e.g. `2026_05_20_01_add_wallets.sql`).

---

## 🚀 Migration Best Practices

When adding a database modification:
1. Generate the migration file using the `YYYY_MM_DD_NN_slug.sql` pattern in `database/migrations/`.
2. Ensure you handle backward-compatibility (e.g. set default values for new columns or handle nulls).
3. Update the typescript types if schema changes:
   ```bash
   # Run supabase type generator if available or update:
   # src/types/supabase.ts
   ```

Thank you for helping us keep StayCool Booking a premium and professional platform!
