import { prisma } from './prisma';

export async function getSetting(key: string) {
  const entry = await prisma.setting.findUnique({ where: { key } });
  return entry?.value ?? null;
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

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getDepositSettings() {
  const enabled = parseBoolean(await getSetting('deposit_enabled'), true);
  const amount = parseNumber(await getSetting('deposit_amount'), 300);
  return { enabled, amount };
}

export async function getDataOwner() {
  return (await getSetting('legal_data_owner')) ?? defaultDataOwner;
}

export async function getPrivacyText() {
  const owner = await getDataOwner();
  return (await getSetting('legal_privacy')) ?? defaultPrivacyText(owner);
}

export async function getCookieText() {
  return (await getSetting('legal_cookies')) ?? defaultCookieText;
}

export async function getImprintText() {
  return (await getSetting('legal_imprint')) ?? defaultImprintText;
}
