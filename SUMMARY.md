## Goal
Modernize every page of the social network (feed, profile, community, chat, admin) with the dark Facebook-style design matching the new login page.

## Constraints & Preferences
- User wants the dark modern design (`#0f111a` background, `#1a1b23` cards, gradient buttons) across the **entire site**, not just the login page.
- Previous deployment of `unstable-social-network` was rejected ("eso no era el que realizaste").
- Live domain: `blacksocialnetwork.fun`.
- Production DB: `82.197.82.133` / `u533650113_black` / `Juan159159@` (already configured in `lib/db.ts`).
- Vercel project: `testtttts-projects-0f3bffb2/niggasocialnetwork`.
- GitHub repo: `0xcmetatron/nigga-social-network` (private, cloned at `C:\Users\PC\Documents\GitHub\nigga-social-network`).
- Correct working directory is `C:\Users\PC\Documents\GitHub\nigga-social-network`, NOT `unstable-social-network`.

## Progress
### Done
- Redeployed `nigga-social-network` (correct repo) back to Vercel prod after mistakenly deploying `unstable-social-network`.
- Modernized `app/feed/page.tsx`: changed `DEFAULT_THEME` to dark colors, removed server theme override, added gradient to Post button and comment Post button.
- Modernized `app/profile/page.tsx`: updated `DEFAULT_THEME` to dark, removed `placeholder_color`, removed server theme override, added gradient to Save Changes button.
- Modernized `app/profile/[id]/page.tsx`: updated `DEFAULT_THEME` to dark, removed server theme override, added gradient to Back to Feed and comment Post buttons.
- Modernized `app/community/page.tsx`: updated `DEFAULT_THEME` to dark, removed server theme override, added gradient to Create and Create Community buttons.
- Modernized `app/community/[slug]/page.tsx`: updated `DEFAULT_THEME` to dark, removed server theme override, added gradient to Back to Communities, Post, comment Post, and Save Settings buttons.
- Modernized `app/chat/page.tsx`: replaced hardcoded light colors with dark theme (`#0f111a` bg, `#1a1b23` cards, `#2a2b36` borders), added gradient to Send button and own-message bubbles.
- Modernized `app/admin/page.tsx`: updated to dark theme (`#0f111a` bg, `#1a1b23` cards, dark inputs/textarea/labels), added gradient to Save All Settings button, updated preview section.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Server theme (from DB settings) is now **ignored** in all pages — the dark modern theme is hardcoded via `DEFAULT_THEME` and inline styles to prevent the old light design from coming back.
- Removed `placeholder_color` from the Theme interface and references to prevent TS errors.
- Using `background: 'linear-gradient(135deg, #5773ff, #3b5de7)'` for all primary action buttons for consistency with the login page.

## Next Steps
1. Commit all changes and push to GitHub.
2. Deploy to Vercel prod.
3. Verify all pages at `blacksocialnetwork.fun` show the dark modern design.
4. If the user confirms, move on to build additional features (friends system, notifications, privacy settings, comment reactions).

## Critical Context
- The user's core complaint: the old black design was still on feed/profile/community/chat pages while only the login was updated. The `unstable-social-network` deployment was NOT the design the user wanted either.
- All pages now use the same dark theme constants: bg `#0f111a`, card `#1a1b23`, text `#e1e1e6`, accent `#252630`, border `#2a2b36`, primary gradient `#5773ff`→`#3b5de7`.
- The build compiles successfully locally with `npm run build` (not pnpm). Vercel uses pnpm on remote.

## Relevant Files
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\page.tsx`: new modern login page (dark, gradient buttons, eye toggle, icons).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\layout.tsx`: metadata for "Bull Social Network" with gun logo.
- `C:\Users\PC\Documents\GitHub\nigga-social-network\lib\db.ts`: points to `u533650113_black` / `Juan159159@`.
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\feed\page.tsx`: modernized (dark theme).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\profile\page.tsx`: modernized (dark theme).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\profile\[id]\page.tsx`: modernized (dark theme).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\community\page.tsx`: modernized (dark theme).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\community\[slug]\page.tsx`: modernized (dark theme).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\chat\page.tsx`: modernized (dark theme).
- `C:\Users\PC\Documents\GitHub\nigga-social-network\app\admin\page.tsx`: modernized (dark theme).
