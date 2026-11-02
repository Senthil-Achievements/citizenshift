/**
 * Onboarding field definitions — Phase 10.
 *
 * Step 1 mirrors the supplied client screenshot exactly: the labels, the
 * optional markers, and the ZIP / street-address explanation are preserved.
 *
 * Steps 2 and 3 are intentionally EMPTY of questions. The brief says: "Do not
 * invent Step 2 and Step 3 fields. Wait for the client's additional reference
 * screens and final requirements." They render as explicit
 * "awaiting client reference" placeholders rather than fabricated questions.
 *
 * No field here is sensitive-demographic. Race/ethnicity and political leaning
 * are deliberately absent — they require an approved privacy notice, purpose,
 * consent and retention rules first.
 */

import type { ProfileUpdate } from "@/lib/supabase/profiles";

export interface OnboardingField {
  key: keyof ProfileUpdate;
  label: string;
  /** Mirrors the screenshot's "optional" marker. */
  optional?: boolean;
  type: "text" | "tel" | "date" | "select";
  autoComplete?: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  options?: { value: string; label: string }[];
  hint?: string;
}

export interface OnboardingStep {
  number: number;
  title: string;
  description: string;
  fields: OnboardingField[];
  /** True once the client supplies the real questions for this step. */
  pendingClientReference: boolean;
}

/** US state codes + names used by the State select. */
export const STATE_OPTIONS: { value: string; label: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([value, label]) => ({ value, label }));

/** The ZIP / street-address explanation from the reference screenshot. */
export const ADDRESS_EXPLANATION =
  "We use your ZIP code to identify your congressional district and your representatives. " +
  "Your street address is optional and gives a more precise district match — a ZIP alone can " +
  "span more than one district.";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    number: 1,
    title: "Personal information",
    description: "Tell us who you are so we can match you to the right representatives.",
    pendingClientReference: false,
    fields: [
      { key: "first_name", label: "First name", type: "text", autoComplete: "given-name" },
      { key: "last_name", label: "Last name", type: "text", autoComplete: "family-name" },
      {
        key: "username",
        label: "Username",
        type: "text",
        autoComplete: "username",
        hint: "How you'll appear in the community. Letters, numbers and underscores.",
      },
      { key: "phone_number", label: "Phone number", optional: true, type: "tel", autoComplete: "tel", inputMode: "numeric" },
      { key: "date_of_birth", label: "Date of birth", type: "date" },
      { key: "state", label: "State", type: "select", options: STATE_OPTIONS },
      {
        key: "zip_code",
        label: "ZIP code",
        type: "text",
        inputMode: "numeric",
        maxLength: 5,
        autoComplete: "postal-code",
        hint: "Five digits.",
      },
      { key: "street_address", label: "Street address", optional: true, type: "text", autoComplete: "street-address" },
    ],
  },
  {
    number: 2,
    title: "Step 2",
    description: "Awaiting the client's reference screen.",
    pendingClientReference: true,
    fields: [],
  },
  {
    number: 3,
    title: "Step 3",
    description: "Awaiting the client's reference screen.",
    pendingClientReference: true,
    fields: [],
  },
];

/** Field keys collected in Step 1, used for draft persistence. */
export const STEP1_KEYS: (keyof ProfileUpdate)[] = ONBOARDING_STEPS[0].fields.map((f) => f.key);

/**
 * Validates Step 1. Returns a map of field key → message.
 * Only required fields are enforced; optional ones are never blocking.
 */
export function validateStep1(values: Partial<ProfileUpdate>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.first_name?.trim()) errors.first_name = "First name is required.";
  if (!values.last_name?.trim()) errors.last_name = "Last name is required.";

  const username = values.username?.trim();
  if (!username) {
    errors.username = "Username is required.";
  } else if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    errors.username = "Use 3–30 letters, numbers or underscores.";
  }

  if (values.date_of_birth) {
    const dob = new Date(values.date_of_birth);
    if (Number.isNaN(dob.getTime())) errors.date_of_birth = "Enter a valid date.";
    else if (dob > new Date()) errors.date_of_birth = "Date of birth cannot be in the future.";
  } else {
    errors.date_of_birth = "Date of birth is required.";
  }

  if (!values.state?.trim()) errors.state = "State is required.";

  const zip = values.zip_code?.trim();
  if (!zip) errors.zip_code = "ZIP code is required.";
  else if (!/^\d{5}$/.test(zip)) errors.zip_code = "Enter a five-digit ZIP code.";

  // Optional fields: validate format only when provided.
  if (values.phone_number?.trim() && !/^[\d\s()+.-]{7,20}$/.test(values.phone_number.trim())) {
    errors.phone_number = "Enter a valid phone number.";
  }

  return errors;
}
