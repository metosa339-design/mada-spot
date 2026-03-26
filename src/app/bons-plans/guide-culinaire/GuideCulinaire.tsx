'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ChefHat, UtensilsCrossed, MapPin, Clock, Star, Wheat, Apple, Flame, Fish, ExternalLink, Facebook, Users, Map, ChevronRight } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { getImageUrl } from '@/lib/image-url';
import AnimatedGradientText from '@/components/ui/AnimatedGradientText';
import {
  tableOfContents,
  traditionalDishes,
  productCategories,
  malagasyMarkets,
  culinaryExperiences,
} from '@/data/guide-culinaire';

const iconMap: Record<string, typeof Wheat> = {
  Wheat,
  Apple,
  Flame,
  Fish,
};

const difficultyColors: Record<string, string> = {
  facile: 'text-green-400 bg-green-500/15 border-green-500/30',
  moyen: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  difficile: 'text-red-400 bg-red-500/15 border-red-500/30',
};

export default function GuideCulinaire() {
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
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ==================== SECTION 1: HERO ==================== */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80"
            alt="Cuisine malgache"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.4) 0%, rgba(255,20,147,0.25) 50%, rgba(148,0,211,0.35) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 backdrop-blur-sm rounded-full border border-orange-500/30 text-orange-400 text-sm font-medium mb-6">
              <ChefHat className="w-4 h-4" />
              Aventure Culinaire
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
              <AnimatedGradientText className="text-4xl sm:text-5xl lg:text-6xl font-black">
                Saveurs de Madagascar
              </AnimatedGradientText>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              Plongez dans l&apos;univers gastronomique de la Grande Île : plats traditionnels,
              marchés colorés, épices rares et expériences culinaires inoubliables.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {[
                { label: '6 Plats Iconiques', icon: UtensilsCrossed },
                { label: '8 Marchés', icon: MapPin },
                { label: '4 Expériences', icon: Star },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                >
                  <stat.icon className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== SECTION 2: TABLE DES MATIERES ==================== */}
      <nav className="sticky top-16 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#2a2a36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === item.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-[#1a1a24] text-slate-400 hover:text-white hover:bg-[#2a2a36] border border-[#2a2a36]'
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Une fusion de saveurs
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                La cuisine malgache, un{' '}
                <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  voyage sensoriel
                </span>
              </h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  La gastronomie de Madagascar est le reflet de son histoire unique. Carrefour de
                  l&apos;océan Indien, la Grande Île a hérité d&apos;influences <strong className="text-white">austronésiennes</strong> (le riz
                  omniprésent), <strong className="text-white">africaines</strong> (les brèdes et ragoûts), <strong className="text-white">arabes</strong> (les
                  épices et méthodes de conservation) et <strong className="text-white">françaises</strong> (les techniques culinaires modernes).
                </p>
                <p>
                  Le résultat ? Une cuisine à la fois simple et sophistiquée, où le riz est roi
                  et les &quot;laoka&quot; (accompagnements) racontent chacun une histoire régionale.
                  Du romazava des Hauts Plateaux au poisson coco de la côte, chaque bouchée est
                  une invitation au voyage.
                </p>
                <p>
                  Avec plus de <strong className="text-orange-400">130 kg de riz consommés par personne par an</strong>,
                  les Malgaches détiennent l&apos;un des records mondiaux. Le mot &quot;manger&quot; se dit
                  d&apos;ailleurs &quot;mihinam-bary&quot; — littéralement &quot;manger du riz&quot;.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fadeRight" delay={0.2}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2a2a36]">
                <Image
                  src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"
                  alt="Ingrédients cuisine malgache"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm text-slate-300 italic">
                    &quot;Ny fihinanana no mampihavana&quot; — C&apos;est le repas qui rapproche les gens
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
                <UtensilsCrossed className="w-4 h-4" />
                6 plats iconiques
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Plats{' '}
                <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  Traditionnels
                </span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Les incontournables de la cuisine malgache, des Hauts Plateaux à la côte
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
                  <div
                    className={`group bg-[#1a1a24] rounded-2xl border border-[#2a2a36] overflow-hidden hover:border-orange-500/50 transition-all h-full flex flex-col`}
                  >
                    {/* Image */}
                    <div className={`relative ${isFeatured ? 'aspect-[4/3]' : 'aspect-[16/9]'} overflow-hidden`}>
                      <Image
                        src={getImageUrl(dish.image)}
                        alt={dish.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] via-transparent to-transparent opacity-60" />

                      {/* Difficulty badge */}
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium border ${difficultyColors[dish.difficulty]}`}>
                        {dish.difficulty}
                      </div>

                      {/* Category badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500/20 backdrop-blur-sm text-orange-400 rounded-lg text-xs font-medium border border-orange-500/30">
                        {dish.category}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-1">{dish.name}</h3>
                      <p className="text-sm text-orange-400/80 italic mb-3">{dish.nameMg}</p>

                      <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                        {isFeatured ? dish.longDescription : dish.description}
                      </p>

                      {/* Key ingredients */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {dish.keyIngredients.map((ingredient) => (
                          <span
                            key={ingredient}
                            className="px-2 py-0.5 bg-[#0d1520] text-slate-300 rounded text-xs border border-[#2a2a36]"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>

                      {/* Restaurant links */}
                      {dish.restaurantSlugs.length > 0 && (
                        <div className="pt-3 border-t border-[#2a2a36]">
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Où déguster ?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dish.restaurantSlugs.map((resto) => (
                              <Link
                                key={resto.slug}
                                href={`/bons-plans/restaurants/${resto.slug}`}
                                className="text-xs text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
                              >
                                {resto.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                <Apple className="w-4 h-4" />
                Terroir unique
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Produits{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                  Locaux
                </span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Des rizières en terrasse aux plantations de vanille, découvrez les trésors du terroir malgache
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {productCategories.map((category) => {
              const IconComponent = iconMap[category.icon] || Wheat;
              return (
                <StaggerItem key={category.id}>
                  <div className={`bg-gradient-to-br ${category.gradient} rounded-2xl p-[1px]`}>
                    <div className="bg-[#1a1a24] rounded-2xl p-5 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#0d1520] rounded-xl flex items-center justify-center border border-[#2a2a36]">
                          <IconComponent className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{category.name}</h3>
                      </div>

                      <div className="space-y-4">
                        {category.products.map((product) => (
                          <div key={product.name} className="group/product">
                            <h4 className="font-semibold text-white text-sm mb-1">{product.name}</h4>
                            <p className="text-xs text-slate-400 mb-1.5">{product.description}</p>
                            <p className="text-xs text-orange-400/80 italic leading-relaxed">
                              💡 {product.funFact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
                <MapPin className="w-4 h-4" />
                8 marchés à découvrir
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Marchés de{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Madagascar
                </span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Des labyrinthes colorés d&apos;Analakely aux marchés de brousse, une aventure pour les sens
              </p>
            </div>
          </ScrollReveal>

          {/* Desktop: Table */}
          <ScrollReveal>
            <div className="hidden md:block bg-[#1a1a24] rounded-2xl border border-[#2a2a36] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">Marché</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">Localisation</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">Spécialités</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Meilleur moment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {malagasyMarkets.map((market, index) => (
                    <tr
                      key={market.name}
                      className={`border-t border-[#2a2a36] hover:bg-white/[0.02] transition-colors ${
                        index % 2 === 0 ? 'bg-[#1a1a24]' : 'bg-[#15151f]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{market.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{market.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          {market.location}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {market.specialties.map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-xs font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{market.bestTime}</td>
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
                <div className="bg-[#1a1a24] rounded-2xl border border-[#2a2a36] p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white">{market.name}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {market.location}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{market.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {market.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-xs font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                4 expériences uniques
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Expériences{' '}
                <span className="bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
                  Culinaires
                </span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Vivez la gastronomie malgache de l&apos;intérieur avec ces expériences immersives
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-5">
            {culinaryExperiences.map((exp, index) => (
              <ScrollReveal key={exp.id} delay={index * 0.1}>
                <div className="group relative rounded-2xl overflow-hidden border border-[#2a2a36] hover:border-orange-500/50 transition-all h-full">
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <Image
                      src={getImageUrl(exp.image)}
                      alt={exp.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]/40" />
                  </div>

                  {/* Content overlay */}
                  <div className="relative p-6 flex flex-col min-h-[280px] justify-end">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {exp.title}
                    </h3>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                      {exp.description}
                    </p>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2">
                      {exp.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-xs font-medium border border-white/10"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
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
            <div
              className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.2) 50%, rgba(29,78,216,0.15) 100%)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600" />
              <div className="absolute top-4 right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <Facebook className="w-8 h-8 text-blue-400" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Foodies Madagascar
                </h2>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                  Rejoignez la communauté des passionnés de gastronomie à Tana !
                  Partagez vos découvertes, recommandations de restaurants et bons plans culinaires
                  avec d&apos;autres foodies.
                </p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    Communauté active
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4" />
                    Antananarivo
                  </div>
                </div>

                <a
                  href="https://www.facebook.com/groups/1786623354790081/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <Facebook className="w-5 h-5" />
                  Rejoindre le groupe
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* CTA Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/bons-plans/restaurants"
                className="group block bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-orange-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Voir tous les restaurants</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Découvrez les meilleurs restaurants de Madagascar avec les vrais prix
                </p>
                <span className="flex items-center text-sm font-medium text-orange-400">
                  Explorer
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                href="/bons-plans/carte"
                className="group block bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-purple-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Voir sur la carte</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Visualisez tous les établissements sur la carte interactive
                </p>
                <span className="flex items-center text-sm font-medium text-purple-400">
                  Ouvrir la carte
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}
