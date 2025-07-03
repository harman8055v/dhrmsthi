export const SPIRITUAL_ORGS = [
  "Isha Foundation",
  "Vipassana/Dhamma",
  "ISKCON/Hare Krishna",
  "Ramakrishna Mission",
  "Art of Living",
  "Brahma Kumaris",
  "Chinmaya Mission",
  "Swaminarayan",
  "Sathya Sai Organization",
  "Divine Life Society",
  "Osho International",
  "Self-Realization Fellowship/YSS",
  "Sri Aurobindo Ashram",
  "Mata Amritanandamayi Math",
  "Ananda Marga",
  "Other (please specify)",
] as const;
export type SpiritualOrg = (typeof SPIRITUAL_ORGS)[number];
