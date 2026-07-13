import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import CurrencyConverter from '@/components/CurrencyConverter';

export const revalidate = 3600;

async function getRates(): Promise<Record<string, number>> {
  const rows = await prisma.exchangeRate.findMany({ orderBy: { fetchedAt: 'desc' } }).catch(() => []);
  const rates: Record<string, number> = {};
  for (const r of rows) {
    if (r.targetCurrency && !rates[r.targetCurrency]) rates[r.targetCurrency] = r.rate;
  }
  // Fallback indicatif si base vide
  if (!rates.EUR) rates.EUR = 5000;
  if (!rates.USD) rates.USD = 4600;
  return rates;
}

const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v));

export async function generateMetadata(): Promise<Metadata> {
  const rates = await getRates();
  const title = `Taux de change Ariary (MGA) : Euro & Dollar — Madagascar | Mada Spot`;
  const description = `Cours de l'ariary malgache : 1 € = ${fmt(rates.EUR)} Ar · 1 $ = ${fmt(rates.USD)} Ar. Taux de change à Madagascar, convertisseur et conseils pour changer votre argent.`;
  return { title, description, alternates: { canonical: `${SITE_URL}/taux-de-change` }, openGraph: { title, description, url: `${SITE_URL}/taux-de-change`, type: 'website' } };
}

export default async function ExchangeRatePage() {
  const rates = await getRates();
  const amounts = [1, 5, 10, 20, 50, 100, 200, 500];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Combien vaut 1 euro en ariary ?', acceptedAnswer: { '@type': 'Answer', text: `1 euro (€) vaut environ ${fmt(rates.EUR)} ariary (Ar) à Madagascar.` } },
      { '@type': 'Question', name: 'Combien vaut 1 dollar en ariary ?', acceptedAnswer: { '@type': 'Answer', text: `1 dollar ($) vaut environ ${fmt(rates.USD)} ariary (Ar) à Madagascar.` } },
      { '@type': 'Question', name: 'Où changer de l\'argent à Madagascar ?', acceptedAnswer: { '@type': 'Answer', text: 'Dans les banques, bureaux de change agréés et à l\'aéroport. Évitez le change de rue. Les grandes villes (Antananarivo, Nosy Be) offrent les meilleurs taux.' } },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs text-gray-500 mb-4"><Link href="/" className="hover:text-orange-600">Accueil</Link> · <span className="text-gray-700">Taux de change</span></nav>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Taux de change à Madagascar — Ariary (MGA)</h1>
      <p className="text-gray-600 leading-relaxed mb-6">
        Cours de l&apos;<strong>ariary malgache (Ar / MGA)</strong> : <strong>1 € = {fmt(rates.EUR)} Ar</strong> et <strong>1 $ = {fmt(rates.USD)} Ar</strong>.
        Utilisez le convertisseur ci-dessous et préparez votre budget voyage à Madagascar.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <CurrencyConverter rates={rates} />
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Repères rapides</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100"><th className="py-1.5">Euro</th><th>Ariary</th><th>Dollar</th></tr></thead>
            <tbody>
              {amounts.map((a) => (
                <tr key={a} className="border-b border-gray-50">
                  <td className="py-1.5">{a} €</td>
                  <td className="font-medium text-gray-900">{fmt(a * rates.EUR)} Ar</td>
                  <td className="text-gray-500">{fmt((a * rates.EUR) / rates.USD)} $</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Changer de l&apos;argent à Madagascar : nos conseils</h2>
        <p>La monnaie officielle est l&apos;<strong>ariary (Ar, code MGA)</strong>. Les paiements en espèces dominent : prévoyez du liquide, surtout hors des grandes villes. Les cartes bancaires sont acceptées dans les hôtels et restaurants des zones touristiques (Antananarivo, Nosy Be, Diego Suarez).</p>
        <p>Changez de préférence dans les <strong>banques et bureaux de change agréés</strong> ou à l&apos;aéroport d&apos;Antananarivo à l&apos;arrivée. Évitez le change de rue. Gardez de petites coupures pour les taxis, marchés et pourboires.</p>
        <p>Pour estimer votre budget sur place, consultez notre guide <Link href="/blog" className="text-orange-600 hover:underline">Budget voyage Madagascar</Link>, ou trouvez directement un <Link href="/hotels" className="text-orange-600 hover:underline">hôtel</Link> et des <Link href="/restaurants" className="text-orange-600 hover:underline">restaurants</Link> pour préparer votre séjour.</p>
        <p className="text-xs text-gray-400">Taux indicatifs, mis à jour régulièrement. Le taux réel appliqué varie selon l&apos;organisme de change.</p>
      </section>
    </div>
  );
}
