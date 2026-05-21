import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={14} suppressHydrationWarning />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8">Datenschutzerkl&auml;rung</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Allgemeine Hinweise</h3>
            <p className="text-muted-foreground">
              KoalaSnippets ist eine selbstgehostete Webanwendung zum Verwalten von Code-Snippets.
              Datenschutz hat bei uns h&ouml;chste Priorit&auml;t. Diese Anwendung wurde nach dem
              Prinzip &bdquo;Privacy by Design&ldquo; entwickelt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Keine externen Abh&auml;ngigkeiten (Zero-CDN)</h2>
            <p className="text-muted-foreground">
              Im Gegensatz zu den meisten Webanwendungen verwendet KoalaSnippets keinerlei externe
              CDNs oder Drittanbieter-Dienste:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Schriften:</strong> Lokal geb&uuml;ndelt via <code>next/font</code>, keine Google Fonts-Anfragen</li>
              <li><strong>Icons:</strong> <code>lucide-react</code> als npm-Paket, kein Icon-CDN</li>
              <li><strong>Bibliotheken:</strong> S&auml;mtliche Abh&auml;ngigkeiten im eigenen Bundle</li>
              <li><strong>Analytics:</strong> Keine Tracking-Skripte, keine Analyse-Cookies</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Dies bedeutet, dass keine Daten an Dritte &uuml;bertragen werden und die Anwendung
              vollst&auml;ndig air-gapped betrieben werden kann.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Erhobene Daten</h2>
            <p className="text-muted-foreground">
              Die einzigen gespeicherten Daten sind die, die Sie explizit bereitstellen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Benutzername (zur Authentifizierung)</li>
              <li>Passwort-Hash (Argon2id, irreversibel)</li>
              <li>Erstellte Snippets (Titel, Beschreibung, Code, Tags)</li>
              <li>Session-Tokens (gehasht, automatisch ablaufend)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Wir erfassen <strong>nicht</strong>: IP-Adressen, Browser-Fingerprints,
              Nutzungsanalysen, Fehler-Tracking oder Telemetrie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Session-Cookie</h2>
            <p className="text-muted-foreground">
              Das einzige Cookie, das gesetzt wird, ist ein essentielles Session-Cookie:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><code>HttpOnly</code> &ndash; Kann nicht von JavaScript gelesen werden (XSS-Schutz)</li>
              <li><code>Secure</code> &ndash; Wird nur &uuml;ber HTTPS gesendet</li>
              <li><code>SameSite=Lax</code> &ndash; Gesch&uuml;tzt gegen CSRF</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Kein Tracking, keine Analytics, keine Drittanbieter-Cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Sichtbarkeitsstufen</h2>
            <p className="text-muted-foreground">
              Sie kontrollieren genau, wer jedes Snippet sehen kann:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Privat:</strong> Nur Sie k&ouml;nnen es sehen.</li>
              <li><strong>Geteilt:</strong> Nur jemand mit dem exakten Link kann es sehen. Keine Auflistung, keine Entdeckung.</li>
              <li><strong>&Ouml;ffentlich:</strong> Auf der &ouml;ffentlichen Seite Ihrer Instanz gelistet. Sie entscheiden, was ver&ouml;ffentlicht wird.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Keine Telemetrie</h2>
            <p className="text-muted-foreground">
              Die Anwendung:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Pr&uuml;ft nicht auf Updates</li>
              <li>Sendet keine Absturzberichte</li>
              <li>Sendet keine Nutzungsstatistiken</li>
              <li>Kommuniziert mit keinem externen Server</li>
              <li>Funktioniert vollst&auml;ndig air-gapped</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Ihre Rechte</h2>
            <p className="text-muted-foreground">
              Da Sie die Anwendung selbst hosten, haben Sie volle Kontrolle &uuml;ber alle Daten.
              Sie k&ouml;nnen jederzeit:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Ihr Konto und alle zugeh&ouml;rigen Daten l&ouml;schen</li>
              <li>Die SQLite-Datenbank exportieren oder sichern</li>
              <li>Die Anwendung vollst&auml;ndig deinstallieren</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. SSL/TLS-Verschl&uuml;sselung</h2>
            <p className="text-muted-foreground">
              Diese Anwendung &uuml;bertr&auml;gt sensible Daten (Passw&ouml;rter, Session-Tokens)
              ausschlie&szlig;lich &uuml;ber verschl&uuml;sselte Verbindungen. Wir empfehlen den
              Einsatz von Caddy als Reverse Proxy mit automatischer TLS-Verschl&uuml;sselung.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
