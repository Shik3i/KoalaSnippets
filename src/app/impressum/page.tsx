import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProtectedEmail } from "@/components/ui/protected-email";

export default function ImpressumPage() {
  const email = process.env.CONTACT_EMAIL || "";
  const encodedEmail = Buffer.from(email).toString("base64");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={14} suppressHydrationWarning />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Angaben gem&auml;&szlig; &sect; 5 TMG</h2>
            <p className="text-muted-foreground">
              KoalaSnippets ist ein selbstgehostetes Snippet-Management-Tool, das von privaten Entwicklern
              betrieben wird. Die Software wird lokal auf eigener Infrastruktur ausgef&uuml;hrt. Die Anwendung speichert
              verschl&uuml;sselte Zugangsdaten und pers&ouml;nliche Design-Einstellungen (im JSON-Format) ausschlie&szlig;lich
              in einer lokalen, privaten SQLite-Datenbankinstanz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
            <p className="text-muted-foreground">
              Bei Fragen oder Anliegen k&ouml;nnen Sie uns &uuml;ber die folgende E-Mail-Adresse erreichen:
            </p>
            <p className="text-muted-foreground">
              <ProtectedEmail encodedEmail={encodedEmail} />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Verantwortlich f&uuml;r den Inhalt</h2>
            <p className="text-muted-foreground">
              Da KoalaSnippets als selbstgehostete Anwendung betrieben wird, liegt die
              Verantwortung f&uuml;r den Inhalt der gespeicherten Snippets beim jeweiligen
              Betreiber der Instanz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftungsausschluss</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Haftung f&uuml;r Inhalte</h3>
            <p className="text-muted-foreground">
              Die Inhalte unserer Anwendung wurden mit gr&ouml;&szlig;tmöglicher Sorgfalt erstellt.
              F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der Inhalte k&ouml;nnen
              wir jedoch keine Gew&auml;hr &uuml;bernehmen. Als Diensteanbieter sind wir gem&auml;&szlig;
              &sect;&sect; 7 bis 10 TMG f&uuml;r eigene Inhalte auf diesen Seiten nach den allgemeinen
              Gesetzen verantwortlich.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Haftung f&uuml;r Links</h3>
            <p className="text-muted-foreground">
              Unser Angebot enth&auml;lt Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb k&ouml;nnen wir f&uuml;r diese fremden Inhalte auch keine Gew&auml;hr
              &uuml;bernehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Urheberrecht</h2>
            <p className="text-muted-foreground">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
              dem deutschen Urheberrecht. Die Vervielf&auml;ltigung, Bearbeitung, Verbreitung und jede
              Art der Verwertung au&szlig;erhalb der Grenzen des Urheberrechtes erfordern die schriftliche
              Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Streitschlichtung</h2>
            <p className="text-muted-foreground">
              Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                https://ec.europa.eu/consumers/odr
              </a>
              . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
