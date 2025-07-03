export const MOTHER_TONGUES = [
  'Assamese','Bengali','Bodo','Dogri','Gujarati','Hindi','Kannada','Kashmiri','Konkani','Maithili','Malayalam','Manipuri','Marathi','Nepali','Odia','Punjabi','Sanskrit','Santali','Sindhi','Tamil','Telugu','Urdu'
] as const
export type MotherTongue = (typeof MOTHER_TONGUES)[number]
