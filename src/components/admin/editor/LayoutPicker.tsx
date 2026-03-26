'use client';

import { Check } from 'lucide-react';

interface LayoutPickerProps {
  selectedLayout: number;
  onChange: (layout: number) => void;
}

const LAYOUTS = [
  {
    id: 1,
    name: 'Image en haut',
    description: 'Texte en bas',
    icon: (
      <div className="w-full h-full flex flex-col gap-1 p-1">
        <div className="bg-blue-400 rounded h-1/2"></div>
        <div className="flex-1 space-y-0.5">
          <div className="bg-gray-400 rounded h-1 w-3/4"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-2/3"></div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    name: 'Image en bas',
    description: 'Texte en haut',
    icon: (
      <div className="w-full h-full flex flex-col gap-1 p-1">
        <div className="flex-1 space-y-0.5">
          <div className="bg-gray-400 rounded h-1 w-3/4"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-2/3"></div>
        </div>
        <div className="bg-blue-400 rounded h-1/2"></div>
      </div>
    ),
  },
  {
    id: 3,
    name: 'Image au milieu',
    description: 'Texte coupé',
    icon: (
      <div className="w-full h-full flex flex-col gap-0.5 p-1">
        <div className="space-y-0.5">
          <div className="bg-gray-400 rounded h-1 w-3/4"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
        </div>
        <div className="bg-blue-400 rounded h-1/3 my-0.5"></div>
        <div className="flex-1 space-y-0.5">
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-2/3"></div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    name: 'Image à gauche',
    description: 'Texte à droite',
    icon: (
      <div className="w-full h-full flex gap-1 p-1">
        <div className="bg-blue-400 rounded w-2/5 h-full"></div>
        <div className="flex-1 space-y-0.5 py-0.5">
          <div className="bg-gray-400 rounded h-1 w-3/4"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-2/3"></div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    name: 'Image à droite',
    description: 'Texte à gauche',
    icon: (
      <div className="w-full h-full flex gap-1 p-1">
        <div className="flex-1 space-y-0.5 py-0.5">
          <div className="bg-gray-400 rounded h-1 w-3/4"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-full"></div>
          <div className="bg-gray-300 rounded h-0.5 w-2/3"></div>
        </div>
        <div className="bg-blue-400 rounded w-2/5 h-full"></div>
      </div>
    ),
  },
];

export default function LayoutPicker({ selectedLayout, onChange }: LayoutPickerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">
          Choisissez la mise en page de l'article
        </h4>
        <span className="text-xs text-gray-500">
          Format sélectionné: {LAYOUTS.find(l => l.id === selectedLayout)?.name}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {LAYOUTS.map((layout) => {
          const isSelected = selectedLayout === layout.id;
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => onChange(layout.id)}
              className={`relative p-2 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#ff6b35] bg-orange-50 ring-2 ring-[#ff6b35]/20'
                  : 'border-[#2a2a36] hover:border-[#3a3a46] hover:bg-[#12121a]'
              }`}
            >
              {/* Layout preview */}
              <div className={`w-full aspect-[3/4] rounded-lg border ${
                isSelected ? 'border-[#ff6b35]/30 bg-[#1a1a24]' : 'border-[#2a2a36] bg-[#12121a]'
              }`}>
                {layout.icon}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${isSelected ? 'text-[#ff6b35]' : 'text-gray-300'}`}>
                  {layout.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {layout.description}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff6b35] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
