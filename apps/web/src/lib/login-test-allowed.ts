/**
 * Gate the login test UI + `/api/auth/login-debug` so they are not public in production
 * unless you explicitly enable them (temporary debugging).
 */
export function isLoginTestAllowed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ENABLE_LOGIN_TEST === 'true'
}
