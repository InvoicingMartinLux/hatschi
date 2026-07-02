import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Impressum – Allergy Radar',
  description: 'Impressum und rechtliche Hinweise gemäß § 5 DDG.',
};

// The Impressum is a German legal notice and is intentionally not translated.
export default function ImpressumPage() {
  return (
    <div className="min-h-screen" lang="de">
      <header className="sticky top-0 z-10 border-b border-[var(--hairline)] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--ink-primary)]"
          >
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-xl bg-[var(--brand-tint)] text-base"
            >
              🌿
            </span>
            Allergy Radar
          </Link>
          <Link
            href="/"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--brand-deep)] transition-colors hover:bg-[var(--brand-tint)]"
          >
            ← Zurück zur App
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <article className="mt-8 rounded-3xl border border-[var(--hairline)] bg-white p-6 shadow-[0_1px_2px_rgba(11,11,11,0.04)] sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)] sm:text-3xl">
            Impressum
          </h1>

          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)
          </p>

          <address className="mt-3 text-[15px] not-italic leading-relaxed text-[var(--ink-secondary)]">
            Martin Lux
            <br />
            Büchlweg 16
            <br />
            82041 Oberhaching
            <br />
            Deutschland
          </address>

          <h2 className="mt-8 text-base font-semibold tracking-tight text-[var(--ink-primary)]">
            Kontakt
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            E-Mail:{' '}
            <a
              href="mailto:martin.lux0102@gmail.com"
              className="font-medium text-[var(--brand-deep)] underline decoration-[var(--hairline)] underline-offset-2 transition-colors hover:text-[var(--brand)]"
            >
              martin.lux0102@gmail.com
            </a>
          </p>

          <h2 className="mt-8 text-base font-semibold tracking-tight text-[var(--ink-primary)]">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <address className="mt-2 text-[15px] not-italic leading-relaxed text-[var(--ink-secondary)]">
            Martin Lux
            <br />
            Büchlweg 16
            <br />
            82041 Oberhaching
          </address>

          <h2 className="mt-8 text-base font-semibold tracking-tight text-[var(--ink-primary)]">
            Haftungsausschluss
          </h2>

          <h3 className="mt-5 text-sm font-semibold text-[var(--ink-primary)]">
            Haftung für Inhalte
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG bin
            ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
            gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
            forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
            Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
            Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
            Bei Bekanntwerden von entsprechenden Rechtsverletzungen werde ich diese
            Inhalte umgehend entfernen.
          </p>

          <h3 className="mt-5 text-sm font-semibold text-[var(--ink-primary)]">
            Haftung für Links
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            Mein Angebot enthält gegebenenfalls Links zu externen Websites Dritter, auf
            deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden
            Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten
            ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
            Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
            Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der
            verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
            Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
            werde ich derartige Links umgehend entfernen.
          </p>

          <h3 className="mt-5 text-sm font-semibold text-[var(--ink-primary)]">
            Urheberrecht
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
            Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
            Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
            bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
            nicht kommerziellen Gebrauch gestattet.
          </p>
        </article>
      </main>
    </div>
  );
}
