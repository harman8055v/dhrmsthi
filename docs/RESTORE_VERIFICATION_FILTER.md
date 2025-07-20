# Restoring the Verification Filter for Swiping/Discovery

These instructions walk you through reverting the temporary change that allowed **all onboarded profiles** (verified or not) to show up in the swiping UI and discovery API.

## Background
For testing purposes we commented out every `.eq("verification_status", "verified")` filter in two locations:

1. `app/api/profiles/discover/route.ts`
2. `lib/data-service.ts` → inside `swipeService.getProfilesToSwipe()`

While this lets QA view the last 100 created profiles regardless of verification, **it should be reverted before production deploy** to preserve platform trust & safety.

---

## Step-by-Step Revert Guide

1. **Open the files**
   ```bash
   code app/api/profiles/discover/route.ts
   code lib/data-service.ts
   ```

2. **Find the commented filter lines** (search for `verification_status`).

3. **Uncomment each line**
   • Remove the leading `//` so the filter is active again.

   Example:
   ```ts
   // .eq("verification_status", "verified") // Temporarily disabled
   →
   .eq("verification_status", "verified")
   ```

4. **Save the files**.

5. **Run type-check & lint** (optional but recommended):
   ```bash
   npm run lint
   npm run typecheck
   ```

6. **Run tests** (if you have related unit/integration tests):
   ```bash
   npm test
   ```

7. **Restart the dev/build server** and verify:
   * Only _verified_ profiles now appear in Discovery & Swiping.

8. **Commit the change** (if you handle git commits manually):
   ```bash
   git add app/api/profiles/discover/route.ts lib/data-service.ts docs/RESTORE_VERIFICATION_FILTER.md
   git commit -m "feat: restore verification filter for profile discovery & swiping"
   git push origin <branch>
   ```

---

## Optional Hardening Ideas

* Add an **ENV flag** (e.g., `BYPASS_VERIFICATION_FILTER`) and guard the query with a conditional. This allows easier toggling without code edits.
* Implement a **role-based override** so that only admin/QA roles can see unverified profiles.
* Automate a **pre-deploy hook** that fails CI if the filter is commented out.

---

## Questions?
Reach out to the platform team in Slack #dharma-saathi-backend for help. 