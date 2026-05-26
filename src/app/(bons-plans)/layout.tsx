import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TopAdBanner from '@/components/TopAdBanner';
import WeatherAlertBanner from '@/components/bons-plans/WeatherAlertBanner';

export default function BonsPlansGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <TopAdBanner />
      <WeatherAlertBanner />
      <main id="main-content" className="min-h-screen bg-[#F8FAFC]">
        {children}
      </main>
      <Footer />
    </>
  );
}
