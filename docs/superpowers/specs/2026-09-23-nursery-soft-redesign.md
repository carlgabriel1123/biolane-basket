# "Nursery Soft" redesign — brief

Date: 2026-09-23. Direction chosen by the site owner: warm, gentle, premium.
Everything below applies to the public site (sign-up, checklist, basket,
confirmation) and to /admin. All existing copy, field order, product order,
flows, validation, saving, analytics and accessibility behaviour stay
EXACTLY as they are — this is a visual and interaction upgrade only.

## Foundation (already in the repo — use it, don't reinvent it)

- `app/globals.css` — tokens: ink / ink-soft / blue / blue-deep / sky /
  sky-soft / cream / cream-soft / blush / blush-soft / blush-deep / gold /
  gold-soft / mint / mint-soft / mint-deep / lilac / lilac-soft / lilac-deep /
  success / danger; radius-card, radius-pill; shadow-soft / lift / bar / glow;
  motion tokens (`--ease-soft`, `--ease-spring`, `--duration-fast/base/slow`).
  Utilities: `.press` (tap squeeze), `.stagger` (children rise in with
  `style={{'--i': n}}`), `.animate-rise`, `.animate-slide-up`, `.animate-fade`,
  `.animate-pop`, `.animate-bump`, `.reward-sheen`, `.progress-fill`,
  `.meter-fill`, `.animate-drift`, `.skeleton`, `.no-scrollbar`.
- `components/icons.tsx` — the ONLY icon family. No emoji as icons anywhere
  (🎁 💛 🎉 🛍️ ✨ ✓ must go). Decorative icons are aria-hidden by default;
  icon-only buttons get aria-label.
- `components/ui.tsx` — `Button` (variants primary/secondary/ghost/gold/
  success/danger-ghost; sizes sm/md/lg; `loading`, `iconLeft`, `iconRight`,
  `full`), `IconButton`, `ChoiceChip` (native radio/checkbox inside a
  tappable card, stage `tone`), `Card`, `Badge` (ink/blue/gold/success/
  danger/soft), `StepIndicator`, `Skeleton`, `BottleMeter`, `STAGE_TONES` /
  `stageTone(stage)`.

## Visual language

- Surfaces: white cards (`Card`) on the sky-soft page; section washes use the
  stage tone (`stageTone(stage).bg`). Radius: cards `rounded-card`, controls
  `rounded-pill`, inputs `rounded-2xl`. Borders `border-ink/10`. Shadows only
  soft / lift; never ad-hoc values.
- Type: Nunito (`font-display`) for headings, prices and claim codes; Inter
  for body. Body ≥ 16px in inputs, ≥ 13px elsewhere. Numbers `tabular-nums`.
- Stage identity: every stage has a tone + icon (Expecting heart/peach, Baby
  baby-face/sky, Toddler sun/mint, Others sparkles/lilac). Use it on the stage
  chips, the stage picker, the checklist section header strip and product
  image wells. Text stays ink / ink-soft on tints.
- Motion: entrances rise (stagger lists 40 ms apart), sheets slide up with a
  faded scrim, taps squeeze (`.press`), counters bump (`.animate-bump`) when
  they change, the reward meter fills smoothly. One or two moving things per
  view, never more. Everything respects reduced motion (globals handles it).
- Touch: every control ≥ 44 px, ≥ 8 px apart; `touch-action: manipulation`
  is global. Fixed bars keep `env(safe-area-inset-bottom)`.
- Feedback: loading buttons show `SpinnerIcon` and disable; success uses
  `success` green with a check icon; errors `danger` red with text next to the
  field and `role="alert"`; never colour alone.

## Screens

### Sign-up (`JoinPage`, `CommunityForm`)
- Top: logo, `StepIndicator step=1 total=2 label="About you"`. Two pastel
  blobs drift slowly behind (`.animate-drift`).
- Heading unchanged. Inputs: 16px, `rounded-2xl`, white on the card, a
  decorative leading icon (UserIcon / MailIcon / PhoneIcon / CalendarIcon)
  inside the field on the left, label above, helper/error below.
- "Are you…" → four `ChoiceChip`s (2 columns) with icons: Dad UserIcon, Mom
  HeartIcon, Grandparent UsersIcon, Others SparklesIcon; tone `STAGE_TONES.baby`
  (sky) for all four. "Baby stage" → four `ChoiceChip`s (1 column) with each
  stage's own tone + icon and a one-line hint ("Getting ready for baby" /
  "Newborn to first birthday" / "Walking, talking, exploring" / "Just browsing").
- Consent stays a real checkbox styled as a soft sky card with the check
  icon; never pre-checked.
- Validate on blur per field (in addition to submit) — same rules and
  messages as today.
- Join button: `Button size="lg" full iconRight={<ArrowRightIcon/>}`,
  `loading` while submitting.

### Checklist (`ChecklistPage` + `ProductSection`, `ProductCard`, `QtyStepper`,
`RewardProgress`, `RewardUnlocked`, `Suggestions`, `BasketBar`, `BasketSheet`)
- Header: logo left, "Start over" ghost button right, then
  `StepIndicator step=2 total=2 label="Your checklist"`. "Hi {Name}" with a
  HeartIcon (gold) instead of 💛; keep the three lines of copy.
- Reward banner: gold GiftIcon in a cream circle, same words.
- Stage chip: pill tinted with the stage tone + its icon; "Change" opens the
  in-place picker as `ChoiceChip`s (same options, same behaviour).
- Checklist section: a thin coloured strip / icon in the stage tone next to
  the "Checklist" heading and the caption; cards rise in staggered.
- `ProductCard`: 88 px image in a rounded well tinted by stage (pass a `tone`
  prop or class), name, size as a tiny `Badge soft`, blurb, then price (orig
  struck through) + `Button size="sm" variant="secondary" iconLeft={Plus}`
  "Add". In basket: blue ring + a small ink check badge on the image (SVG),
  `QtyStepper` replaces Add. "Why this?" keeps its HelpCircleIcon button.
  Unpriced products: "Price at the booth" + a dashed `Badge`-like chip "Ask our
  team" with InfoIcon; no Add.
- `QtyStepper`: pill with MinusIcon / TrashIcon at 1 / PlusIcon; the number
  `animate-bump`s on change (re-mount a span keyed by qty).
- "You might also like" section: SparklesIcon by the heading; same cards.
- Nudge pill: SparklesIcon instead of ✨; same text and behaviour.
- "See all" accordion: ChevronDownIcon rotates; panel `.animate-rise`.
- Aside: `RewardProgress` shows the `BottleMeter` on the left and the numbers
  on the right (total / threshold, "₱x more to unlock"); unlocked → gold state
  with GiftIcon. `RewardUnlocked`: PartyIcon in a gold circle (no 🎉/🎁),
  same form and preview. `Suggestions` ("Almost there"): SparklesIcon, each
  row a `press` card with PlusIcon.
- `BasketBar`: BagIcon (or GiftIcon when unlocked), the total bumps when it
  changes, "View basket" `Button` with the unit count badge.
- `BasketSheet`: scrim `.animate-fade`, panel `.animate-slide-up` on phones
  (rise on desktop), a small drag-handle pill at the top, XIcon close, line
  items with tinted thumbnails and steppers, the progress bar, "Finish
  checklist" `Button size="lg" iconRight={<CheckIcon/>}` with `loading`.
  Empty state: BagIcon in a sky circle + "Back to checklist" `Button
  variant="secondary"`.

### Confirmation (`Confirmation`)
- CheckCircleIcon (success) in a big pale circle that `animate-pop`s, "Thank
  you, {FirstName}!", then the claim code as a ticket: dashed border card,
  code in Nunito 30 px `tracking-wider`, time under it, and the
  Saved / Will sync `Badge` (success + CheckIcon, or gold + ClockIcon).
- Gift card (cream) with GiftIcon; bag name preview. Basket lines. Community
  card with HeartIcon. "Show this screen" card with StoreIcon. Start over
  `Button variant="secondary"`.

### Admin (`components/admin/*`, `app/admin/page.tsx`)
- `AdminShell`: logo + LockIcon badge "Booth dashboard".
- Login / Setup / Change password: the same `rounded-2xl` inputs with icons
  (KeyIcon for the setup code, UserIcon, LockIcon), a show/hide password
  toggle (`IconButton` with EyeIcon / EyeOffIcon, aria-pressed), `Button
  loading`.
- Dashboard: sticky top bar (logo, "Admin" `Badge ink`, username, Change
  password ghost, Log out secondary with LogOutIcon). Stat tiles with icons
  (ClockIcon Today, UsersIcon Sign-ups, CheckCircleIcon Finished, GiftIcon
  Gift unlocked, TagIcon Paid) and numbers that `animate-bump` on change.
  Search field with SearchIcon; the filter `<select>` becomes a horizontal
  row of chips (`no-scrollbar`, `aria-pressed`, keyboard reachable) — same
  options. Download CSV `Button variant="secondary" iconLeft={Download}`;
  Sync sheet `Button variant="ghost" iconLeft={Refresh}` (spins while
  syncing). While loading: 4 `Skeleton` rows. Rows: claim code in a mono
  `Badge ink`, status `Badge` (blue Finished / soft Signed up), Gift `Badge
  gold`, "Sheet pending" `Badge soft` with CloudOffIcon; mobile as a tel link
  with PhoneIcon; products expander with ChevronDownIcon; Paid: `Button
  variant="success"` "✓ Paid" → use CheckIcon, or `variant="secondary"` "Mark
  paid" with TagIcon; paid rows get a faint green left border. Empty state:
  BagIcon + text. Notice line stays `aria-live="polite"`.

## Do not

- Change any copy, product order, prices, validation, data shapes, API calls,
  session logic or analytics events.
- Add dependencies. Use raw hex only inside `globals.css` / SVGs.
- Use emoji as icons, hover-only affordances, animations on width/height,
  or anything that moves layout on press.
