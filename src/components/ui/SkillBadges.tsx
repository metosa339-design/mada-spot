'use client';

interface Skill {
  name: string;
  level?: string;
  years?: number;
}

interface SkillBadgesProps {
  skills: Skill[];
  maxDisplay?: number;
}

const levelColors: Record<string, string> = {
  'Expert': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Avancé': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Confirmé': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Intermédiaire': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'Débutant': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function SkillBadges({ skills, maxDisplay = 6 }: SkillBadgesProps) {
  if (!skills || skills.length === 0) return null;

  const displayed = skills.slice(0, maxDisplay);
  const remaining = skills.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-2">
      {displayed.map((skill, i) => {
        const colorClass = levelColors[skill.level || ''] || levelColors['Intermédiaire'];
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${colorClass}`}
            title={skill.years ? `${skill.years} ans d'expérience` : undefined}
          >
            {skill.name}
            {skill.level && (
              <span className="opacity-60 text-[10px]">
                {skill.level === 'Expert' ? '★★★' : skill.level === 'Avancé' ? '★★' : '★'}
              </span>
            )}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-500/20 text-xs text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}
