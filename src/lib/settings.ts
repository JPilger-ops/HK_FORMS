import { prisma } from './prisma';

function isDbUnavailable(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ((error as { code?: string }).code === 'P1001' || (error as { code?: string }).code === 'P1000')
  );
}

export async function getSetting(key: string) {
  try {
    const entry = await prisma.setting.findUnique({ where: { key } });
    return entry?.value ?? null;
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.warn(`Settings fallback: DB unreachable while reading key "${key}".`);
      return null;
    }
    throw error;
  }
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export async function getReservationTerms() {
  return (
    (await getSetting('reservation_terms')) ??
    'Bitte bestätigen Sie, dass Sie die Reservierungsbedingungen gelesen haben.'
  );
}

const defaultDataOwner = `Thomas Pilger
Mauspfad 3
53842 Troisdorf
Steuernummer: 220/5060/2434 - USt-IdNr.: DE123224453`;

const defaultPrivacyText = (owner: string) => `Verantwortlicher (Art. 4 Nr. 7 DSGVO)
${owner}

Verarbeitung im Reservierungsportal
Wir verarbeiten die Angaben, die Sie uns über das Reservierungsformular mitteilen (z. B. Kontakt- und Rechnungsdaten, gewünschtes Veranstaltungsdatum, Personenanzahl, Zahlungswünsche, optionale Notizen und Extras), um Ihre Anfrage zu prüfen, Rückfragen zu stellen und ein Angebot zu erstellen.

Rechtsgrundlagen
Die Verarbeitung erfolgt zur Vertragsanbahnung bzw. -erfüllung (Art. 6 Abs. 1 lit. b DSGVO). Soweit Sie freiwillige Angaben machen, stützen wir diese auf Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit mit Wirkung für die Zukunft widerrufen können.

Empfänger und Dienstleister
Wir setzen Hosting- und E-Mail-Dienstleister als Auftragsverarbeiter ein. Eine Weitergabe an Dritte zu Werbe- oder Trackingzwecken findet nicht statt. Zugriff haben nur berechtigte Mitarbeiterinnen und Mitarbeiter, die zur Vertraulichkeit verpflichtet sind.

Speicherdauer
Reservierungsdaten bewahren wir solange auf, wie es für die Bearbeitung Ihrer Anfrage und zur Erfüllung etwaiger Nachweispflichten erforderlich ist. Danach löschen oder anonymisieren wir die Daten, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

Cookies und Protokolle
Wir verwenden nur technisch notwendige Cookies, etwa für Zugriffs-Token zu Einladungslinks und für Sitzungen im Admin-Bereich. Serverseitige Protokolle (z. B. IP-Adresse, Zeitstempel, Fehlermeldungen) werden zur Sicherstellung von Stabilität und Sicherheit erstellt und regelmäßig gelöscht.

Ihre Rechte
Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen verarbeitete Daten aus berechtigtem Interesse. Zudem besteht ein Beschwerderecht bei der zuständigen Aufsichtsbehörde.`;

const defaultCookieText = `Einsatz von Cookies
Unser Reservierungsportal verwendet ausschließlich technisch notwendige Cookies. Es kommen keine Analyse-, Marketing- oder Tracking-Cookies zum Einsatz.

Notwendige Cookies
- Einladungs-/Token-Cookie: speichert den Zugangsschlüssel zu Ihrem Formular, damit der Link während der Session gültig bleibt.
- Session-Cookie (Admin-Login): authentifiziert berechtigte Nutzerinnen und Nutzer im Admin-Bereich; wird beim Logout oder Ablauf der Sitzung gelöscht.
- Sicherheits-Cookies (z. B. CSRF): schützen Formulareingaben und verhindern Missbrauch.

Lebensdauer und Verwaltung
Die meisten Cookies werden mit dem Ende der Session gelöscht; einige Sicherheits-Cookies besitzen eine kurze, technisch notwendige Gültigkeit. Sie können Cookies im Browser löschen oder blockieren; dadurch kann der Funktionsumfang (z. B. Login oder Einladung) eingeschränkt sein.`;

const defaultImprintText = `Anbieter des Reservierungsportals
Dieses Reservierungsportal wird von der Waldwirtschaft Heidekönig betrieben. Der oben genannte Verantwortliche ist zugleich inhaltlich verantwortlich gemäß § 55 Abs. 2 RStV.

Kontaktwege
Für rechtliche Hinweise, Auskunftsersuchen oder Anliegen zum Portal nutzen Sie bitte die oben stehende Anschrift oder die in Ihrer Reservierungsanfrage bzw. -bestätigung angegebenen Kommunikationswege.

Haftung für Inhalte
Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte verantwortlich. Nach §§ 8 bis 10 TMG sind wir nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung bleiben hiervon unberührt.

Haftung für Links
Externe Links wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße geprüft. Für Inhalte externer Seiten übernehmen wir keine Haftung; bei Bekanntwerden von Rechtsverletzungen werden entsprechende Links umgehend entfernt.

Online-Streitbeilegung und Verbraucherschlichtung
Die Europäische Kommission stellt unter https://ec.europa.eu/consumers/odr/ eine Plattform zur Online-Streitbeilegung bereit. Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`;

function parseBoolean(value: string | null, fallback: boolean) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function normalizeString(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseOptionalBoolean(value: string | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value: string | null) {
  const parsed = Number(value ?? undefined);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEmailList(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const PRICE_PER_GUEST_DEFAULT = 35;

export async function getPricePerGuestSetting() {
  const fromDb = parseOptionalNumber(await getSetting('price_per_guest'));
  const fromEnv =
    parseOptionalNumber(process.env.NEXT_PUBLIC_PRICE_PER_GUEST ?? null) ??
    parseOptionalNumber(process.env.PRICE_PER_PERSON ?? null);
  const value = fromDb ?? fromEnv ?? PRICE_PER_GUEST_DEFAULT;
  return value < 0 ? 0 : value;
}

export async function getDepositSettings() {
  const enabled = parseBoolean(await getSetting('deposit_enabled'), true);
  const amount = parseNumber(await getSetting('deposit_amount'), 300);
  return { enabled, amount };
}

export async function getPricingSettings() {
  const [deposit, pricePerGuest] = await Promise.all([
    getDepositSettings(),
    getPricePerGuestSetting()
  ]);
  return { ...deposit, pricePerGuest };
}

export type LegalPageKey = 'impressum' | 'datenschutz' | 'cookies';

const legalDefaults: Record<LegalPageKey, string> = {
  impressum: [
    'Waldwirtschaft Heidekönig',
    'Inhaber: Max Beispiel',
    'Heideweg 12, 29660 Beispielstadt',
    '',
    'Kontakt',
    'Telefon: +49 (0) 5123 456789',
    'E-Mail: reservierung@heidekoenig.de',
    '',
    'Umsatzsteuer-ID gemäß § 27 a UStG: DE999999999',
    'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: Max Beispiel, Anschrift wie oben.',
    '',
    'Haftung für Inhalte',
    'Die Inhalte wurden mit größter Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität übernehmen wir keine Gewähr. Verpflichtungen zur Entfernung oder Sperrung der Nutzung bleiben unberührt.',
    '',
    'Haftung für Links',
    'Für Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung wurden keine rechtswidrigen Inhalte erkannt.',
    '',
    'Urheberrecht',
    'Alle Inhalte unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung bedürfen der schriftlichen Zustimmung, soweit nicht gesetzlich erlaubt.',
    '',
    'Online-Streitbeilegung',
    'Plattform der EU-Kommission: https://ec.europa.eu/consumers/odr/ - Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'
  ].join('\n'),
  datenschutz: [
    '1. Verantwortlicher',
    'Waldwirtschaft Heidekönig, Heideweg 12, 29660 Beispielstadt',
    'E-Mail: reservierung@heidekoenig.de, Telefon: +49 (0) 5123 456789',
    '',
    '2. Zwecke und Rechtsgrundlagen',
    '- Bearbeitung von Reservierungsanfragen und Kommunikation (Art. 6 Abs. 1 lit. b DSGVO).',
    '- Erfüllung rechtlicher Pflichten, z. B. Aufbewahrung nach Handels- und Steuerrecht (Art. 6 Abs. 1 lit. c DSGVO).',
    '- Wahrung berechtigter Interessen, etwa IT-Sicherheit, Missbrauchserkennung oder Nachvollziehbarkeit von Änderungen (Art. 6 Abs. 1 lit. f DSGVO).',
    '',
    '3. Verarbeitete Datenkategorien',
    '- Kontaktdaten und Reservierungsdetails aus dem Formular (z. B. Name, Anschrift, Datum, Personenanzahl, Extras).',
    '- Protokolldaten bei Nutzung des Adminbereichs (z. B. Zeitstempel, Nutzerkennung, Änderungen).',
    '- Technisch notwendige Cookies und Server-Logs (IP-Adresse, User-Agent, Zeitstempel), um die Anwendung sicher zu betreiben.',
    '',
    '4. Empfänger',
    '- Interne Mitarbeitende, die Reservierungen verwalten.',
    '- IT-Dienstleister und Hosting-Partner mit entsprechenden Auftragsverarbeitungsverträgen.',
    '- Behörden, wenn eine gesetzliche Pflicht besteht.',
    '',
    '5. Aufbewahrungsdauer',
    '- Reservierungs- und Abrechnungsdaten nach gesetzlichen Fristen (in der Regel 6-10 Jahre).',
    '- Technische Logdaten und Session-Informationen werden regelmäßig gelöscht, sobald sie für Betriebssicherheit und Nachvollziehbarkeit nicht mehr erforderlich sind.',
    '',
    '6. Cookies & ähnliche Technologien',
    '- Session-/Login-Cookies für den Adminbereich und ein Consent-Cookie für die Cookie-Auswahl. Sie sind technisch notwendig und werden nach Ablauf der Session oder spätestens nach 12 Monaten gelöscht.',
    '- Es werden keine Tracking- oder Marketing-Cookies gesetzt.',
    'Details finden Sie in der Cookie-Richtlinie.',
    '',
    '7. Ihre Rechte',
    'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen die Verarbeitung aus berechtigtem Interesse. Zudem besteht ein Beschwerderecht bei der zuständigen Aufsichtsbehörde.',
    '',
    '8. Sicherheit',
    'Wir treffen angemessene technische und organisatorische Maßnahmen (Zugriffsbeschränkungen, Verschlüsselung, Rollen- und Rechtekonzept), um Ihre Daten vor Verlust und unberechtigtem Zugriff zu schützen.',
    '',
    '9. Kontakt',
    'Bei Fragen oder zur Wahrnehmung Ihrer Rechte wenden Sie sich an reservierung@heidekoenig.de. Ein Datenschutzbeauftragter ist mangels gesetzlicher Pflicht nicht bestellt.'
  ].join('\n'),
  cookies: [
    'Diese Cookie-Richtlinie beschreibt, welche Cookies wir verwenden und wie Sie damit umgehen können.',
    '',
    '1. Technisch notwendige Cookies',
    '- Sitzungs-/Login-Cookies für den Adminbereich (Authentifizierung, CSRF-Schutz).',
    '- Ein Consent-Cookie zur Speicherung Ihrer Auswahl im Cookie-Banner.',
    'Ohne diese Cookies funktioniert die Anwendung nicht zuverlässig. Sie werden nach Ende der Session oder spätestens nach 12 Monaten gelöscht.',
    '',
    '2. Keine optionalen Tracking-Cookies',
    '- Wir setzen derzeit keine Analyse-, Marketing- oder Drittanbieter-Tracking-Cookies ein.',
    '',
    '3. Verwaltung & Widerruf',
    '- Sie können die Speicherung technisch notwendiger Cookies in Ihrem Browser einschränken oder blockieren; manche Funktionen stehen dann nicht zur Verfügung.',
    '- Ihre Einwilligung zum Consent-Cookie können Sie jederzeit über die Cookie-Einstellungen Ihres Browsers löschen.',
    '',
    '4. Kontakt',
    'Fragen zum Einsatz von Cookies beantworten wir unter reservierung@heidekoenig.de.'
  ].join('\n')
};

export async function getLegalContent(page: LegalPageKey) {
  return (await getSetting(`legal_${page}`)) ?? legalDefaults[page];
}

export type SmtpSettings = {
  host: string | null;
  port: number | null;
  user: string | null;
  pass: string | null;
  from: string | null;
  secure: boolean | null;
};

export async function getSmtpSettings(): Promise<SmtpSettings> {
  const host = normalizeString(await getSetting('smtp_host')) ?? normalizeString(process.env.SMTP_HOST);
  const port =
    parseOptionalNumber(await getSetting('smtp_port')) ??
    (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null);
  const user = normalizeString(await getSetting('smtp_user')) ?? normalizeString(process.env.SMTP_USER);
  const pass = normalizeString(await getSetting('smtp_pass')) ?? normalizeString(process.env.SMTP_PASS);
  const from = normalizeString(await getSetting('smtp_from')) ?? normalizeString(process.env.SMTP_FROM);
  const secure =
    parseOptionalBoolean(await getSetting('smtp_secure')) ??
    (port ? port === 465 : null);

  return { host, port, user, pass, from, secure };
}

export const emailTemplateDefaults = {
  subject: 'Ihre Anfrage bei der Waldwirtschaft Heidekönig',
  body: [
    'Hallo {{guestName}},',
    'Firma: {{guestCompany}}',
    '',
    'vielen Dank für Ihre Reservierungsanfrage am {{eventDate}} ({{eventStart}} - {{eventEnd}}).',
    'Wir prüfen die Verfügbarkeit und melden uns zeitnah mit einem Angebot.',
    '',
    'Ihre Anfragenummer: {{reservationId}}',
    'Bei Rückfragen antworten Sie gern auf diese E-Mail.',
    '',
    'Freundliche Grüße',
    'Ihr Team der Waldwirtschaft Heidekönig',
    '',
    'Veggie/Vegan: {{dietaryNotes}}',
    'Vegetarisch: {{vegetarianGuests}}',
    'Vegan: {{veganGuests}}'
  ].join('\n')
};

export async function getEmailTemplateSettings() {
  const subject = (await getSetting('email_tpl_guest_subject')) ?? '';
  const body = (await getSetting('email_tpl_guest_body')) ?? '';
  return {
    subject: subject.trim() ? subject : emailTemplateDefaults.subject,
    body: body.trim() ? body : emailTemplateDefaults.body
  };
}

export const inviteTemplateDefaults = {
  subject: 'Heidekönig – Reservierungsanfrage',
  body: [
    'Hallo,',
    'bitte füllen Sie Ihre Reservierungsanfrage aus.',
    'Formular-Link: {{inviteLink}}',
    'Formular: {{formKey}}',
    'Gültig bis: {{expiresAt}}'
  ].join('\n')
};

export async function getInviteTemplateSettings() {
  const defaults = inviteTemplateDefaults;
  const subject = (await getSetting('email_tpl_invite_subject')) ?? '';
  const body = (await getSetting('email_tpl_invite_body')) ?? '';
  return {
    subject: subject.trim() ? subject : defaults.subject,
    body: body.trim() ? body : defaults.body
  };
}

export const icsTemplateDefaults = {
  notes: [
    'Gast: {{guestName}} ({{guestEmail}})',
    'Firma: {{guestCompany}}',
    'Telefon: {{guestPhone}}',
    'Adresse: {{guestAddress}}',
    'Datum: {{eventDate}} {{eventStart}} - {{eventEnd}}',
    'Personen: {{guests}}',
    'Zahlungsart: {{paymentMethod}}',
    'Start Essen: {{startMeal}}',
    'Preis p. P.: {{pricePerGuest}}',
    'Extras: {{extrasList}}',
    'Veggie/Vegan: {{dietaryNotes}}',
    'Vegetarisch: {{vegetarianGuests}}',
    'Vegan: {{veganGuests}}',
    'Bemerkungen: {{notes}}',
    'Anfrage-ID: {{reservationId}}'
  ].join('\n')
};

export async function getIcsTemplateSettings() {
  const notes = (await getSetting('ics_template_notes')) ?? '';
  return {
    notes: notes.trim() ? notes : icsTemplateDefaults.notes
  };
}

export const notificationTemplateDefaults = {
  subject: 'Neue Reservierungsanfrage {{guestName}}',
  body: [
    'Es liegt eine neue Reservierungsanfrage vor.',
    'Gast: {{guestName}} ({{guestEmail}})',
    'Firma: {{guestCompany}}',
    'Kontakt: {{guestPhone}} · {{guestAddress}}',
    'Datum: {{eventDate}} ({{eventStart}} - {{eventEnd}})',
    'Personen: {{guests}} · Start Essen: {{startMeal}} · Zahlungsart: {{paymentMethod}}',
    'Preis p. P.: {{pricePerGuest}} · Gesamtsumme: {{totalPrice}}',
    'Extras:',
    '{{extrasList}}',
    'Bemerkungen: {{notes}}',
    'Veggie/Vegan: {{dietaryNotes}}',
    'Vegetarisch: {{vegetarianGuests}}',
    'Vegan: {{veganGuests}}',
    'Anfrage-ID: {{reservationId}}'
  ].join('\n')
};

export async function getNotificationSettings() {
  const enabled = parseBoolean(await getSetting('notification_enabled'), true);
  const defaults = notificationTemplateDefaults;
  const recipientsSource =
    (await getSetting('notification_recipients')) ??
    process.env.ADMIN_NOTIFICATION_EMAILS ??
    process.env.SMTP_FROM ??
    '';
  const subject = (await getSetting('notification_subject')) ?? '';
  const body = (await getSetting('notification_body')) ?? '';

  return {
    enabled,
    recipients: parseEmailList(recipientsSource),
    subject: subject.trim() ? subject : defaults.subject,
    body: body.trim() ? body : defaults.body
  };
}

export type ReWebAppSettings = {
  enabled: boolean;
  baseUrl: string | null;
  apiKey: string | null;
  organizationId: string | null;
};

export async function getReWebAppSettings(): Promise<ReWebAppSettings> {
  const enabledSetting = parseOptionalBoolean(await getSetting('re_webapp_enabled'));
  const enabledEnv = parseOptionalBoolean(process.env.RE_WEBAPP_ENABLED ?? null);
  const enabled = enabledSetting ?? enabledEnv ?? false;
  const baseUrl =
    normalizeString(await getSetting('re_webapp_base_url')) ??
    normalizeString(process.env.RE_WEBAPP_BASE_URL);
  const apiKey =
    normalizeString(await getSetting('re_webapp_api_key')) ??
    normalizeString(process.env.RE_WEBAPP_API_KEY);
  const organizationId =
    normalizeString(await getSetting('re_webapp_org_id')) ??
    normalizeString(process.env.RE_WEBAPP_ORG_ID);

  return { enabled, baseUrl, apiKey, organizationId };
}
