# Library & Utility Functions

The `lib/` directory contains all non-UI business logic. Everything exported from these files is considered **public API** for the front-end code-base – feel free to import them anywhere inside the repo.  If you need to use these in a separate project you should copy or wrap them as the package is not yet published.

## Quick Import Helper

```ts
// Absolute alias as configured in tsconfig.json
import { cn, isUserVerified } from "@/lib/utils";
```

<br>

## `lib/utils.ts`

| Function | Purpose |
|----------|---------|
| `cn(...classValues)` | Merge TailwindCSS class strings intelligently via [`tailwind-merge`](https://github.com/dcastil/tailwind-merge). |
| `isUserVerified(profile)` | Returns `true` if the given profile is verified **or** belongs to a premium / elite account. |
| `canAccessVerifiedFeatures(profile)` | Convenience wrapper around `isUserVerified`. |
| `getVerificationStatusText(profile)` | Nicely formatted text for UI badges. |
| `formatPhoneE164(phone)` | Convert any local / messy phone number into strict `+919876543210` E.164 form. |
| `isValidPhoneE164(phone)` | Basic regex validation for E.164 numbers (10–15 digits). |

### Example
```ts
import { formatPhoneE164, isValidPhoneE164 } from "@/lib/utils";

const phone = "+1 (408) 555-1212";
const clean = formatPhoneE164(phone); // +14085551212
if (!isValidPhoneE164(clean)) throw new Error("Please enter a valid phone");
```


## `lib/matching-engine.ts`

The heart of Dharma Saathi.  An **AI-inspired** scoring engine that crunches two `UserProfile` objects and spits out a rich `CompatibilityScore`.

Key entry-points:

```ts
import { AdvancedMatchingEngine } from "@/lib/matching-engine";

const engine = new AdvancedMatchingEngine();
const score = engine.calculateCompatibility(myProfile, theirProfile);
console.log(score.total); // => 87
```

1. `calculateCompatibility(user, target)` – single comparison returning scores, breakdown, reasons & concerns.
2. `sortProfilesByCompatibility(user, candidates)` – helper that returns the `candidates` array sorted desc by `compatibility.total`.
3. Weights are tweakable by passing a partial `MatchingWeights` object to the constructor.

> The implementation runs **entirely locally** – no external ML services needed.

<br>

## `lib/analytics.ts`

Thin wrapper around Supabase `analytics_events` table.

| Function | Description |
|----------|-------------|
| `track(event: string, properties?: Record<string, any>)` | Fire-and-forget insert. |
| `query({ eventType?, startDate?, endDate? })` | Returns array of events matching the filter. |


## `lib/data-service.ts`

A *server-side* only abstraction used by API route handlers.

Major helpers:

• `getUserProfile(id)` – fetches profile plus relational look-ups (city, state, country)
• `getSwipes(userId)` – returns arrays of swiped IDs & types
• `createSwipe({ swiperId, swipedId, direction })`

…and many more.  Refer to inline JSDoc for the full list.


## `lib/logger.ts`

Thin wrapper around `console` that prefixes output with a timestamp and environment (dev / prod).

```ts
import { log } from "@/lib/logger";
log.info("Profile saved", { userId });
```


---
Need something that isn’t here?  Search the folder:

```bash
rg "export function" lib/
```

and you’ll likely find what you’re after.  All helpers are unit-tested inside `__tests__/`.