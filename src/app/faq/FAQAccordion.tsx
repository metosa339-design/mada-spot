'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

export default function FAQAccordion({ sections }: { sections: FAQSection[] }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-10">
      {sections.map((section, sIdx) => (
        <div key={section.title}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Catégorie</p>
          <h2 className="text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-4">{section.title}</h2>
          <div className="space-y-2.5">
            {section.items.map((item, iIdx) => {
              const key = `${sIdx}-${iIdx}`;
              const isOpen = openItems.has(key);
              return (
                <div
                  key={key}
                  className="bg-[#111114] rounded-xl border border-[#27272A] hover:border-[#3F3F46] transition-colors overflow-hidden"
                >
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1A1A1F] transition-colors"
                  >
                    <span className="font-medium text-[#FAFAFA] text-[14px] pr-4">{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#A1A1AA] flex-shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-[#D4D4D8] text-[13px] leading-relaxed border-t border-[#27272A] pt-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
