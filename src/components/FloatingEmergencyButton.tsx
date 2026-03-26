'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Pill, Shield, Flame } from 'lucide-react';
import Link from 'next/link';

export default function FloatingEmergencyButton() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: Pill,
      label: 'Pharmacies de garde',
      href: '/pharmacies',
      color: 'bg-green-500',
      description: 'Trouver une pharmacie ouverte'
    },
    {
      icon: Shield,
      label: 'Police / Gendarmerie',
      href: '/urgences',
      color: 'bg-blue-600',
      description: 'Contacts des forces de l\'ordre'
    },
    {
      icon: Flame,
      label: 'Pompiers / SAMU',
      href: '/urgences?type=pompiers',
      color: 'bg-red-500',
      description: 'Services de secours'
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 right-4 z-50 space-y-3">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 bg-[#1a1a24] rounded-full pl-4 pr-2 py-2 shadow-xl hover:shadow-2xl transition-all group"
                >
                  <div className="flex-1 text-right">
                    <div className="font-medium text-white group-hover:text-[#ff6b35] transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-gray-800 rotate-45'
            : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
        }`}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Phone className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </motion.button>

      {/* Tooltip when closed */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-8 right-20 z-50 bg-[#1a1a24] rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-gray-300 hidden sm:block"
        >
          Urgences
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-[#1a1a24] rotate-45"></div>
        </motion.div>
      )}
    </>
  );
}
