export const TOKEN_TYPES = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  PASSWORD_RESET: 'PASSWORD_RESET',
  REFRESH_TOKEN: 'REFRESH_TOKEN'
};

export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours in ms
  PASSWORD_RESET: 15 * 60 * 1000 // 15 minutes in ms
};