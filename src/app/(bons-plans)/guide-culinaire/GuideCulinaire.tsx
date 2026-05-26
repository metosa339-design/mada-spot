'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ChefHat, UtensilsCrossed, MapPin, Clock, Star, Wheat, Apple, Flame, Fish, ExternalLink, Facebook, Users, Map, ChevronRight } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { getImageUrl } from '@/lib/image-url';
import {
  tableOfContents,
  traditionalDishes,
  productCategories,
  malagasyMarkets,
  culinaryExperiences,
} from '@/data/guide-culinaire';
import { useTrans } from '@/i18n';

const iconMap: Record<string, typeof Wheat> = {
  Wheat,
  Apple,
  Flame,
  Fish,
};

const difficultyColors: Record<string, string> = {
  facile: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  moyen: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  difficile: 'text-red-400 bg-red-500/10 border-red-500/25',
};

export default function GuideCulinaire() {
  const t = useTrans('guideCulinaire');
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    const handleScroll = () => {
      const sections = tableOfContents.map((item) => document.getElementById(item.id));
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(tableOfContents[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ==================== SECTION 1: HERO ==================== */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80"
            alt="Cuisine malgache"
            fill
            className="object-cover opacity-15"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] backdrop-blur-sm border border-[#FF6B35]/30 text-[#FF6B35] text-[11px] font-semibold uppercase tracking-[0.15em] rounded-md mb-6">
              <ChefHat className="w-3.5 h-3.5" />
              {t.heroBadge}
            </div>

            <h1 className="text-[32px] sm:text-[44px] lg:text-[56px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4">
              {t.heroMainTitle}
            </h1>

            <p className="text-[15px] text-[#334155] max-w-2xl mx-auto mb-8 leading-relaxed">
              {t.heroDescription}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: t.statIconicDishes, icon: UtensilsCrossed },
                { label: t.statMarkets, icon: MapPin },
                { label: t.statExperiences, icon: Star },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-lg"
                >
                  <stat.icon className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span className="text-[#0F172A] text-[13px] font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: TABLE DES MATIERES ==================== */}
      <nav className="sticky top-16 z-40 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap border transition-colors ${
                  activeSection === item.id
                    ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ==================== SECTION 3: INTRODUCTION ==================== */}
      <section id="introduction" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fadeUp">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                {t.introBadge}
              </p>
              <h2 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-6">
                {t.introTitlePart1} <span className="text-[#FF6B35]">{t.introTitleHighlight}</span>
              </h2>
              <div className="space-y-4 text-[#334155] leading-relaxed text-[15px] max-w-[65ch]">
                <p>
                  {t.introPara1Part1} <strong className="text-[#0F172A] font-semibold">{t.introPara1Austronesian}</strong> {t.introPara1AustronesianDesc} <strong className="text-[#0F172A] font-semibold">{t.introPara1African}</strong> {t.introPara1AfricanDesc} <strong className="text-[#0F172A] font-semibold">{t.introPara1Arab}</strong> {t.introPara1ArabDesc} <strong className="text-[#0F172A] font-semibold">{t.introPara1French}</strong> {t.introPara1FrenchDesc}
                </p>
                <p>
                  {t.introPara2}
                </p>
                <p>
                  {t.introPara3Part1} <strong className="text-[#FF6B35] font-semibold">{t.introPara3Highlight}</strong>{t.introPara3Part2}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fadeRight" delay={0.2}>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#E2E8F0]">
                <Image
                  src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"
                  alt="Ingrédients cuisine malgache"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[13px] text-[#334155] italic leading-relaxed">
                    {t.introQuote}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 4: PLATS TRADITIONNELS ==================== */}
      <section id="plats" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3 flex items-center justify-center gap-2">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {t.dishesIconicBadge}
              </p>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4">
                {t.dishesTitlePart1} <span className="text-[#FF6B35]">{t.dishesTitleHighlight}</span>
              </h2>
              <p className="text-[#64748B] text-[15px] max-w-2xl mx-auto leading-relaxed">
                {t.dishesSubtitle}
              </p>
            </div>
          </ScrollReveal>

          {/* Bento grid: 2 featured large + 4 regular */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {traditionalDishes.map((dish, index) => {
              const isFeatured = dish.isFeatured;
              return (
                <ScrollReveal
                  key={dish.id}
                  delay={index * 0.1}
                  className={isFeatured ? 'md:col-span-1 lg:row-span-2' : ''}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] overflow-hidden transition-colors h-full flex flex-col"
                  >
                    {/* Image */}
                    <div className={`relative ${isFeatured ? 'aspect-[4/3]' : 'aspect-[16/9]'} overflow-hidden bg-white`}>
                      <Image
                        src={getImageUrl(dish.image)}
                        alt={dish.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                      {/* Difficulty badge */}
                      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] border backdrop-blur-md ${difficultyColors[dish.difficulty]}`}>
                        {dish.difficulty}
                      </div>

                      {/* Category badge */}
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#FFF7ED] backdrop-blur-md text-[#FF6B35] rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] border border-[#FF6B35]/30">
                        {dish.category}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-[18px] font-semibold text-[#0F172A] mb-1">{dish.name}</h3>
                      <p className="text-[12px] text-[#FF6B35] italic mb-3 font-mono">{dish.nameMg}</p>

                      <p className="text-[#64748B] text-[13px] leading-relaxed mb-4 flex-1">
                        {isFeatured ? dish.longDescription : dish.description}
                      </p>

                      {/* Key ingredients */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {dish.keyIngredients.map((ingredient) => (
                          <span
                            key={ingredient}
                            className="px-2 py-0.5 bg-white text-[#334155] rounded text-[11px] border border-[#E2E8F0]"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>

                      {/* Restaurant links */}
                      {dish.restaurantSlugs.length > 0 && (
                        <div className="pt-3 border-t border-[#E2E8F0]">
                          <p className="text-[11px] uppercase tracking-[0.15em] text-[#94A3B8] mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {t.whereToEat}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dish.restaurantSlugs.map((resto) => (
                              <Link
                                key={resto.slug}
                                href={`/restaurants/${resto.slug}`}
                                className="text-[12px] text-[#FF6B35] hover:underline transition-colors"
                              >
                                {resto.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 5: PRODUITS LOCAUX ==================== */}
      <section id="produits" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3 flex items-center justify-center gap-2">
                <Apple className="w-3.5 h-3.5" />
                {t.productsBadge}
              </p>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4">
                {t.productsTitlePart1} <span className="text-[#FF6B35]">{t.productsTitleHighlight}</span>
              </h2>
              <p className="text-[#64748B] text-[15px] max-w-2xl mx-auto leading-relaxed">
                {t.productsSubtitle}
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {productCategories.map((category) => {
              const IconComponent = iconMap[category.icon] || Wheat;
              return (
                <StaggerItem key={category.id}>
                  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="h-full">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors p-5 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#FFF7ED] border border-[#FF6B35]/20 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-[#FF6B35]" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#0F172A]">{category.name}</h3>
                      </div>

                      <div className="space-y-4">
                        {category.products.map((product) => (
                          <div key={product.name}>
                            <h4 className="font-semibold text-[#0F172A] text-[13px] mb-1">{product.name}</h4>
                            <p className="text-[12px] text-[#64748B] mb-1.5 leading-relaxed">{product.description}</p>
                            <p className="text-[11px] text-[#FF6B35] italic leading-relaxed">
                              {product.funFact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ==================== SECTION 6: MARCHES ==================== */}
      <section id="marches" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3 flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                {t.marketsBadge}
              </p>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4">
                {t.marketsTitlePart1} <span className="text-[#FF6B35]">{t.marketsTitleHighlight}</span>
              </h2>
              <p className="text-[#64748B] text-[15px] max-w-2xl mx-auto leading-relaxed">
                {t.marketsSubtitle}
              </p>
            </div>
          </ScrollReveal>

          {/* Desktop: Table */}
          <ScrollReveal>
            <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-[#64748B]">{t.marketColumnName}</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-[#64748B]">{t.marketColumnLocation}</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-[#64748B]">{t.marketColumnSpecialties}</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-[#64748B]">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      {t.marketColumnBestTime}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {malagasyMarkets.map((market, index) => (
                    <tr
                      key={market.name}
                      className={`border-t border-[#E2E8F0] hover:bg-white/60 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#0F0F14]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#0F172A] text-[14px]">{market.name}</p>
                        <p className="text-[12px] text-[#64748B] mt-0.5 max-w-xs leading-relaxed">{market.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[13px] text-[#334155]">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                          {market.location}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {market.specialties.map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 bg-white text-[#334155] border border-[#E2E8F0] rounded text-[11px] font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-mono text-[#334155]">{market.bestTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Mobile: Cards */}
          <StaggerContainer className="md:hidden grid gap-4">
            {malagasyMarkets.map((market) => (
              <StaggerItem key={market.name}>
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <h3 className="font-semibold text-[#0F172A] text-[14px]">{market.name}</h3>
                    <span className="text-[11px] text-[#64748B] flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3" />
                      {market.location}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#64748B] mb-3 leading-relaxed">{market.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {market.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 bg-white text-[#334155] border border-[#E2E8F0] rounded text-[11px] font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B]">
                    <Clock className="w-3 h-3" />
                    {market.bestTime}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ==================== SECTION 7: EXPERIENCES CULINAIRES ==================== */}
      <section id="experiences" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3 flex items-center justify-center gap-2">
                <Star className="w-3.5 h-3.5" />
                {t.expBadge}
              </p>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4">
                {t.expTitlePart1} <span className="text-[#FF6B35]">{t.expTitleHighlight}</span>
              </h2>
              <p className="text-[#64748B] text-[15px] max-w-2xl mx-auto leading-relaxed">
                {t.expSubtitle}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-5">
            {culinaryExperiences.map((exp, index) => (
              <ScrollReveal key={exp.id} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="group relative rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors h-full"
                >
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <Image
                      src={getImageUrl(exp.image)}
                      alt={exp.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>

                  {/* Content overlay */}
                  <div className="relative p-6 flex flex-col min-h-[280px] justify-end">
                    <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2 group-hover:text-[#FF6B35] transition-colors">
                      {exp.title}
                    </h3>
                    <p className="text-[13px] text-[#334155] mb-4 leading-relaxed">
                      {exp.description}
                    </p>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2">
                      {exp.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="px-2.5 py-1 bg-white/80 backdrop-blur-md text-[#334155] rounded-md text-[11px] font-medium border border-[#E2E8F0]"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 8: COMMUNAUTE + CTA ==================== */}
      <section id="communaute" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            {/* Facebook Community Card */}
            <div className="rounded-xl p-8 md:p-10 text-center relative overflow-hidden mb-8 bg-white border border-[#E2E8F0]">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#FFF7ED] border border-[#FF6B35]/25 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Facebook className="w-6 h-6 text-[#FF6B35]" />
                </div>

                <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-2">
                  {t.communityTitle}
                </h2>
                <p className="text-[#64748B] text-[14px] mb-6 max-w-lg mx-auto leading-relaxed">
                  {t.communityDesc}
                </p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                    <Users className="w-3.5 h-3.5" />
                    {t.communityActive}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                  <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                    <MapPin className="w-3.5 h-3.5" />
                    Antananarivo
                  </div>
                </div>

                <a
                  href="https://www.facebook.com/groups/1786623354790081/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
                >
                  <Facebook className="w-4 h-4" />
                  {t.communityJoinBtn}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* CTA Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link
                  href="/restaurants"
                  className="group block bg-white rounded-xl p-6 border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors h-full"
                >
                  <div className="w-11 h-11 bg-[#FFF7ED] border border-[#FF6B35]/20 rounded-lg flex items-center justify-center mb-4">
                    <UtensilsCrossed className="w-5 h-5 text-[#FF6B35]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">{t.ctaAllRestaurants}</h3>
                  <p className="text-[12px] text-[#64748B] mb-3 leading-relaxed">
                    {t.ctaAllRestaurantsDesc}
                  </p>
                  <span className="flex items-center text-[13px] font-medium text-[#FF6B35]">
                    {t.ctaExplore}
                    <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link
                  href="/carte"
                  className="group block bg-white rounded-xl p-6 border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors h-full"
                >
                  <div className="w-11 h-11 bg-[#FFF7ED] border border-[#FF6B35]/20 rounded-lg flex items-center justify-center mb-4">
                    <Map className="w-5 h-5 text-[#FF6B35]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">{t.ctaSeeMap}</h3>
                  <p className="text-[12px] text-[#64748B] mb-3 leading-relaxed">
                    {t.ctaSeeMapDesc}
                  </p>
                  <span className="flex items-center text-[13px] font-medium text-[#FF6B35]">
                    {t.ctaOpenMap}
                    <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}
