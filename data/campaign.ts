/**
 * CAMPAIGN SETTINGS — edit this file to change the promo.
 * Nothing here is hardcoded anywhere else in the UI.
 */

export const campaign = {
  /** Peso amount the basket must REACH (>=) for the reward to unlock. */
  rewardThreshold: 2299,

  rewardName: 'Personalized Biolane Toiletry Bag',
  rewardShortName: 'Personalized Toiletry Bag',

  /** Most units of one product a single mom can add. */
  maxQtyPerItem: 10,

  /** Button that submits the sign-up form and opens the checklist. */
  joinCtaLabel: 'Join',

  /** Hero copy */
  headline: 'Are you ready, Mommy?',
  subheadline: "Let's get baby ready.",
  supportingText:
    "Build your baby's Biolane essentials and see how close you are to unlocking your Grand Baby Fair reward.",
  ctaLabel: 'Start my checklist',

  /** Checklist page, under "Hi {name}" */
  checklistHeading: 'Welcome to Biolane Community!',
  checklistSubheading: 'Let’s build your baby’s essentials together.',
  /** Heading above the products she is shown, for every stage. */
  checklistSectionTitle: 'Checklist',
  /** Heading of the stage's suggestions, shown after her first add (data/stages.ts → suggestions). */
  recsTitle: 'You might also like',
  checklistIntro: 'We’re here to help you discover what’s best for your little one.',

  /** Reward banner on the checklist: "{amount} and get a FREE {rewardName}!" */
  rewardTeaserAmount: 'Spend ₱2,299 or more',
  rewardTeaserPrize: 'Get a FREE Personalized Biolane Toiletry Bag',

  /** Legal / fine print */
  rewardDisclaimer:
    'Qualifying purchase will be verified by the Biolane team at checkout. While supplies last.',
  confirmationDisclaimer:
    'Final reward qualification is based on the actual verified purchase.',

  /** Promo dates — shown in the footer. Free text, edit as needed. */
  promoDates: 'Grand Baby Fair · October 8–11',

  /**
   * Policy links. Privacy points at Biolane PH's live policy page.
   * biolane.ph has no Terms page yet — leave termsUrl empty and the form
   * simply omits the Terms link until there is a real URL to give it.
   */
  privacyPolicyUrl: 'https://biolane.ph/policies/privacy-policy',
  termsUrl: '',

  /** Community section */
  communityHeading: 'Welcome to Biolane!',
  communitySubheading: 'First, tell us a little about you & your little one.',
  consentLabel:
    "Yes, I'd love to receive Biolane's baby-care tips, monthly emails, special offers, product updates and community news.",
} as const

export const babyStages = [
  { value: 'expecting', label: 'Expecting' },
  { value: 'baby', label: 'Baby — 0 to 12 months' },
  { value: 'toddler', label: 'Toddler — 1 to 4 years old' },
  { value: 'others', label: 'Others' },
] as const

export type BabyStage = (typeof babyStages)[number]['value']

/** "Are you…" options on the sign-up form, shown in this order. */
export const relationships = [
  { value: 'dad', label: 'Dad' },
  { value: 'mom', label: 'Mom' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'others', label: 'Others' },
] as const

export type Relationship = (typeof relationships)[number]['value']
