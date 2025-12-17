const DEFAULT_PRICE_PER_GUEST = 35;
const DEFAULT_AUTO_LOGOUT_MINUTES = 30;

function parsePositiveNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getPricePerGuest() {
  const publicValue = parsePositiveNumber(process.env.NEXT_PUBLIC_PRICE_PER_GUEST);
  const privateValue = parsePositiveNumber(process.env.PRICE_PER_PERSON);
  return publicValue ?? privateValue ?? DEFAULT_PRICE_PER_GUEST;
}

export function getAutoLogoutMinutes() {
  const fromServer = parsePositiveNumber(process.env.AUTO_LOGOUT_MINUTES);
  const fromClient = parsePositiveNumber(process.env.NEXT_PUBLIC_AUTO_LOGOUT_MINUTES);
  return fromServer ?? fromClient ?? DEFAULT_AUTO_LOGOUT_MINUTES;
}

export function inviteTokenRequired() {
  const setting = process.env.INVITE_REQUIRE_TOKEN;
  // Default: Tokens sind erforderlich. Explizit 'false' schaltet die Pflicht ab.
  if (setting === undefined) return true;
  return setting === 'true';
}
