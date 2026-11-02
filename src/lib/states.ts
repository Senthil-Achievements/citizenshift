export interface USState {
  name: string;
  code: string;
}

export const US_STATES: USState[] = [
  { name: "Alabama", code: "AL" }, { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" }, { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" }, { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" }, { name: "Delaware", code: "DE" },
  { name: "Florida", code: "FL" }, { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" }, { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" }, { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" }, { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" }, { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" }, { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" }, { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" }, { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" }, { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" }, { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" }, { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" }, { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" }, { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" }, { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" }, { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" }, { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" }, { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" }, { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" }, { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" }, { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" }, { name: "Wyoming", code: "WY" },
  { name: "United States (Federal only)", code: "US" },
];

export const STATE_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  US_STATES.map((s) => [s.code, s.name]),
);

/** Policy areas used by the feed. Ordered for the filter bar. */
export const POLICY_AREAS: string[] = [
  "Civil & Human Rights",
  "Criminal Justice & Policing",
  "Immigration",
  "National Security & Defense",
  "Elections & Government Transparency",
  "Taxation & Fiscal Policy",
  "Employment & Labor Rights",
  "Business & Innovation",
  "Trade & Globalization",
  "Healthcare",
  "Education",
  "Housing & Urban Development",
  "Environmental Protection & Climate Change",
  "Food & Agriculture",
  "Transportation & Infrastructure",
  "Technology & Privacy",
  "Energy Policy",
  "Space & Research",
  "Gun Policy & Public Safety",
  "Social Welfare & Poverty Reduction",
];
