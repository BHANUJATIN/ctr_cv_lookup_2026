/**
 * Calculate days between two dates
 */
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  return Math.floor(diffTime / oneDay);
};

/**
 * Calculate days remaining until next CV can be submitted
 */
export const daysUntilNextSubmission = (lastSubmissionDate, cooldownDays = 60) => {
  const daysPassed = daysBetween(lastSubmissionDate, new Date());
  const daysRemaining = cooldownDays - daysPassed;
  return Math.max(0, daysRemaining);
};

/**
 * Check if enough time has passed since last submission
 */
export const canSubmitCV = (lastSubmissionDate, cooldownDays = 60) => {
  if (!lastSubmissionDate) return true;
  const daysPassed = daysBetween(lastSubmissionDate, new Date());
  return daysPassed >= cooldownDays;
};

/**
 * Calculate next available submission date
 */
export const getNextSubmissionDate = (lastSubmissionDate, cooldownDays = 60) => {
  if (!lastSubmissionDate) return new Date();

  const nextDate = new Date(lastSubmissionDate);
  nextDate.setDate(nextDate.getDate() + cooldownDays);
  return nextDate;
};
