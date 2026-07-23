'use client';

import { createElement, useCallback, useState } from 'react';
import type { ElementType, ReactNode, CSSProperties } from 'react';

interface RevealProps {
  /** Balise rendue (div par défaut). Garde la sémantique : 'h2', 'p', 'section'… */
  as?: ElementType;
  /** Décalage d'apparition en ms (pour un effet d'escalier sur une grille). */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Reveal — apparition au scroll, en CSS pur + IntersectionObserver.
 *
 * Remplace `motion.*` + `useInView` de framer-motion : même effet « fade-up »
 * quand l'élément entre dans le viewport, mais sans embarquer la librairie
 * (~40 Ko de JS en moins sur les pages qui l'utilisaient).
 *
 * L'élément démarre en `opacity:0 / translateY` (classe .reveal) et reçoit
 * .reveal-in une fois visible. `prefers-reduced-motion` neutralise l'animation.
 */
export default function Reveal({
  as,
  delay = 0,
  className = '',
  style,
  children,
}: RevealProps) {
  const Tag = (as || 'div') as ElementType;
  const [shown, setShown] = useState(false);

  // Callback ref : on observe l'élément dès qu'il est monté. React 19 gère la
  // fonction de nettoyage retournée par un callback ref.
  const setRef = useCallback((el: HTMLElement | null) => {
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (el) setShown(true); // pas d'IO (SSR/vieux navigateur) → on affiche
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -80px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // createElement plutôt que <Tag> : évite l'inférence de props en `never`
  // sur un tag polymorphe (ElementType) tout en gardant la sémantique.
  return createElement(
    Tag,
    {
      ref: setRef,
      className: `reveal${shown ? ' reveal-in' : ''}${className ? ' ' + className : ''}`,
      style: delay ? { transitionDelay: `${delay}ms`, ...style } : style,
    },
    children,
  );
}
