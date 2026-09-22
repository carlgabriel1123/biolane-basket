/**
 * CAMPAIGN SETTINGS — edit this file to change the promo.
 * Nothing here is hardcoded anywhere else in the UI.
 */

export const campaign = {
  /** Peso amount the basket must REACH (>=) for the reward to unlock. */
  rewardThreshold: 2299,

  rewardName: 'Personalized Biolane Toiletry Bag',
  rewardShortName: 'Personalized Toiletry Bag',

  /** Hero copy */
  eyebrow: 'Biolane Grand Baby Fair',
  headline: 'Are you nesting, Mommy?',
  subheadline: "Let's get baby ready.",
  supportingText:
    "Build your baby's Biolane essentials and see how close you are to unlocking your Grand Baby Fair reward.",
  ctaLabel: 'Start my nesting checklist',

  /** Reward banner in the hero */
  rewardTeaserAmount: 'Spend ₱2,299',
  rewardTeaserPrize: 'Get a FREE Personalized Biolane Toiletry Bag',

  /** Legal / fine print */
  rewardDisclaimer:
    'Qualifying purchase will be verified by the Biolane team at checkout. While supplies last.',
  confirmationDisclaimer:
    'Final reward qualification is based on the actual verified purchase.',

  /** Promo dates — shown in the footer. Free text, edit as needed. */
  promoDates: 'Grand Baby Fair · October 8–11',

  /** Links — replace with the real URLs when available. */
  privacyPolicyUrl: '#privacy',
  termsUrl: '#terms',

  /** Community section */
  communityHeading: 'Welcome to the Biolane Mom Community',
  communityCopy: [
    "Your Biolane journey doesn't end at the Baby Fair.",
    'Join our community for helpful baby-care content, routines, special offers, product updates, events and little surprises along the way.',
  ],
  consentLabel:
    "Yes, I'd love to receive Biolane's baby-care tips, monthly emails, special offers, product updates and community news.",
} as const

export const babyStages = [
  { value: 'expecting', label: 'Expecting' },
  { value: 'newborn', label: 'Newborn — 0–3 months' },
  { value: 'baby', label: 'Baby — 4–12 months' },
  { value: 'toddler', label: 'Toddler — 1–4 years' },
] as const

export type BabyStage = (typeof babyStages)[number]['value']
