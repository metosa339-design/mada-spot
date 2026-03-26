'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface CursorState {
  isHovering: boolean;
  isClicking: boolean;
  hoverText: string;
  cursorType: 'default' | 'button' | 'link' | 'card' | 'drag';
}

interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

export default function CustomCursor() {
  const [cursor, setCursor] = useState<CursorState>({
    isHovering: false,
    isClicking: false,
    hoverText: '',
    cursorType: 'default',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Configuration ultra-rapide et réactive
  const springConfig = { damping: 40, stiffness: 3000, mass: 0.05 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Désactiver sur mobile/tablette
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);

      // Ajouter un point de traînée
      trailIdRef.current += 1;
      setTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: trailIdRef.current }];
        // Garder seulement les 8 derniers points
        return newTrail.slice(-8);
      });
    };

    const handleMouseDown = () => setCursor((prev) => ({ ...prev, isClicking: true }));
    const handleMouseUp = () => setCursor((prev) => ({ ...prev, isClicking: false }));

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Vérifier les boutons
      if (target.closest('button') || target.closest('[role="button"]')) {
        setCursor({
          isHovering: true,
          isClicking: false,
          hoverText: target.closest('button')?.getAttribute('data-cursor-text') || '',
          cursorType: 'button',
        });
        return;
      }

      // Vérifier les liens
      if (target.closest('a')) {
        const link = target.closest('a');
        setCursor({
          isHovering: true,
          isClicking: false,
          hoverText: link?.getAttribute('data-cursor-text') || '',
          cursorType: 'link',
        });
        return;
      }

      // Vérifier les cartes interactives
      if (target.closest('[data-cursor="card"]')) {
        setCursor({
          isHovering: true,
          isClicking: false,
          hoverText: 'Explorer',
          cursorType: 'card',
        });
        return;
      }

      // Vérifier les éléments draggables
      if (target.closest('[data-cursor="drag"]')) {
        setCursor({
          isHovering: true,
          isClicking: false,
          hoverText: 'Glisser',
          cursorType: 'drag',
        });
        return;
      }

      // Reset
      setCursor({
        isHovering: false,
        isClicking: false,
        hoverText: '',
        cursorType: 'default',
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      setTrail([]);
    };

    // Nettoyer la traînée périodiquement
    const cleanupInterval = setInterval(() => {
      setTrail(prev => prev.slice(-4));
    }, 100);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(cleanupInterval);
    };
  }, [cursorX, cursorY]);

  // Couleurs néon selon le type
  const getCursorColors = () => {
    switch (cursor.cursorType) {
      case 'button':
        return {
          bg: 'bg-[#00f5ff]/20',
          border: 'border-[#00f5ff]',
          glow: '0 0 20px rgba(0, 245, 255, 0.5)',
        };
      case 'link':
        return {
          bg: 'bg-[#00ff88]/20',
          border: 'border-[#00ff88]',
          glow: '0 0 20px rgba(0, 255, 136, 0.5)',
        };
      case 'card':
        return {
          bg: 'bg-[#f0ff00]/20',
          border: 'border-[#f0ff00]',
          glow: '0 0 20px rgba(240, 255, 0, 0.5)',
        };
      case 'drag':
        return {
          bg: 'bg-[#bf00ff]/20',
          border: 'border-[#bf00ff]',
          glow: '0 0 20px rgba(191, 0, 255, 0.5)',
        };
      default:
        return {
          bg: 'bg-white/10',
          border: 'border-white/50',
          glow: 'none',
        };
    }
  };

  // Taille selon l'état
  const getSize = () => {
    if (cursor.isClicking) return 24;
    if (cursor.isHovering) return 50;
    return 16;
  };

  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
    return null;
  }

  const colors = getCursorColors();

  return (
    <>
      {/* Trail Effect */}
      {trail.map((point, index) => (
        <motion.div
          key={point.id}
          className="fixed pointer-events-none z-[9998] rounded-full"
          style={{
            left: point.x,
            top: point.y,
            translateX: '-50%',
            translateY: '-50%',
            width: 4 + index * 0.5,
            height: 4 + index * 0.5,
            background: cursor.isHovering
              ? `rgba(0, 245, 255, ${0.1 + index * 0.05})`
              : `rgba(255, 255, 255, ${0.05 + index * 0.03})`,
            filter: 'blur(1px)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.4 + index * 0.05, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.1 }}
        />
      ))}

      {/* Cercle principal */}
      <motion.div
        className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border-2 ${colors.bg} ${colors.border}`}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: colors.glow,
        }}
        animate={{
          width: getSize(),
          height: getSize(),
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.1 }}
      >
        {/* Texte au centre si hovering */}
        {cursor.isHovering && cursor.hoverText && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white"
          >
            {cursor.hoverText}
          </motion.span>
        )}
      </motion.div>

      {/* Point central néon */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          background: cursor.isHovering ? '#00f5ff' : '#fff',
          boxShadow: cursor.isHovering
            ? '0 0 10px #00f5ff, 0 0 20px rgba(0, 245, 255, 0.5)'
            : '0 0 5px rgba(255,255,255,0.5)',
        }}
        animate={{
          width: cursor.isHovering ? 4 : 6,
          height: cursor.isHovering ? 4 : 6,
          opacity: isVisible ? 1 : 0,
          scale: cursor.isClicking ? 0.5 : 1,
        }}
      />

      {/* Style global pour cacher le curseur natif */}
      <style jsx global>{`
        @media (hover: hover) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
}
