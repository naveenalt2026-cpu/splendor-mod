import React from 'react';

interface NoblePortraitProps {
  nobleId: string;
  name: string;
  className?: string;
}

export const NoblePortrait: React.FC<NoblePortraitProps> = ({
  nobleId,
  name,
  className = '',
}) => {
  const renderArt = () => {
    switch (nobleId) {
      case 'noble_suleiman':
        // Suleiman the Magnificent: Grand Ottoman Turban with Golden Plume & Ruby Aigrette
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="sul_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#064e3b" />
                <stop offset="50%" stopColor="#047857" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
              <linearGradient id="turban_grad" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#sul_bg)" />
            {/* Background Halo */}
            <circle cx="50" cy="52" r="38" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            {/* Robes */}
            <path d="M 18 100 C 22 76, 32 70, 50 72 C 68 70, 78 76, 82 100 Z" fill="#065f46" stroke="#fbbf24" strokeWidth="1.5" />
            <path d="M 44 72 L 50 100 L 56 72 Z" fill="url(#gold_grad)" />
            {/* Face & Beard */}
            <ellipse cx="50" cy="56" rx="13" ry="15" fill="#fcd34d" />
            <path d="M 40 58 C 40 68, 60 68, 60 58 C 58 72, 42 72, 40 58 Z" fill="#475569" />
            <path d="M 44 56 Q 50 59 56 56" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
            {/* Eyes & Eyebrows */}
            <circle cx="45" cy="52" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="52" r="1.5" fill="#1e293b" />
            <path d="M 42 49 Q 46 47 48 49" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 52 49 Q 54 47 58 49" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            {/* Grand Turban */}
            <ellipse cx="50" cy="38" rx="24" ry="18" fill="url(#turban_grad)" />
            <ellipse cx="50" cy="41" rx="21" ry="13" fill="#f1f5f9" />
            {/* Turban Folds */}
            <path d="M 28 42 C 34 32, 66 32, 72 42" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 32 36 C 42 27, 58 27, 68 36" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Golden Aigrette & Plume */}
            <path d="M 50 26 C 46 16, 52 10, 50 4 C 54 10, 56 16, 50 26 Z" fill="#fef08a" opacity="0.9" />
            <circle cx="50" cy="27" r="4" fill="url(#gold_grad)" />
            <circle cx="50" cy="27" r="2" fill="#ef4444" />
          </svg>
        );

      case 'noble_francis':
        // Francis I of France: Velvet Renaissance Cap with Feather & Royal Doublet
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="fran_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="50%" stopColor="#7f1d1d" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="fran_gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#fran_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            {/* Robe with Ermine / Fleur-de-lis trim */}
            <path d="M 16 100 C 20 74, 32 68, 50 70 C 68 68, 80 74, 84 100 Z" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M 30 72 C 40 82, 60 82, 70 72 C 60 90, 40 90, 30 72 Z" fill="url(#fran_gold)" />
            {/* Face & Trim Beard */}
            <ellipse cx="50" cy="54" rx="14" ry="16" fill="#fed7aa" />
            <path d="M 40 56 C 40 69, 60 69, 60 56 C 56 68, 44 68, 40 56 Z" fill="#78350f" />
            <path d="M 43 55 Q 50 58 57 55" fill="none" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="45" cy="50" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="50" r="1.5" fill="#1e293b" />
            {/* French Renaissance Slanted Velvet Beret */}
            <ellipse cx="50" cy="38" rx="22" ry="11" fill="#991b1b" stroke="#f59e0b" strokeWidth="1.2" transform="rotate(-6 50 38)" />
            <ellipse cx="48" cy="36" rx="18" ry="8" fill="#7f1d1d" transform="rotate(-6 48 36)" />
            {/* White Feather Plume */}
            <path d="M 64 36 C 74 24, 82 22, 86 16 C 78 22, 68 28, 62 34 Z" fill="#ffffff" />
            <circle cx="62" cy="35" r="3" fill="url(#fran_gold)" />
            <circle cx="62" cy="35" r="1.5" fill="#3b82f6" />
          </svg>
        );

      case 'noble_ferdinand':
        // Ferdinand I of Austria: Imperial Habsburg Crown & Golden Fleece Order
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="ferd_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="50%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="ferd_gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#ferd_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            {/* Imperial Velvet Mantle */}
            <path d="M 16 100 C 22 74, 32 68, 50 70 C 68 68, 78 74, 84 100 Z" fill="#831843" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Golden Fleece Collar */}
            <path d="M 32 72 Q 50 88 68 72" fill="none" stroke="url(#ferd_gold)" strokeWidth="2.5" />
            <circle cx="50" cy="82" r="3" fill="#f59e0b" />
            {/* Face */}
            <ellipse cx="50" cy="54" rx="13" ry="15" fill="#fde68a" />
            <path d="M 42 56 C 42 67, 58 67, 58 56 C 55 64, 45 64, 42 56 Z" fill="#52525b" />
            <circle cx="45" cy="50" r="1.5" fill="#18181b" />
            <circle cx="55" cy="50" r="1.5" fill="#18181b" />
            {/* Imperial Habsburg Crown */}
            <path d="M 32 38 L 34 26 L 42 32 L 50 20 L 58 32 L 66 26 L 68 38 Z" fill="url(#ferd_gold)" stroke="#78350f" strokeWidth="1" />
            <circle cx="50" cy="18" r="2" fill="#ef4444" />
            <circle cx="34" cy="24" r="1.5" fill="#3b82f6" />
            <circle cx="66" cy="24" r="1.5" fill="#10b981" />
            <rect x="32" y="36" width="36" height="4" rx="1" fill="#78350f" />
          </svg>
        );

      case 'noble_catherine':
        // Catherine de Medici: French Hood with Pearls & Royal Velvet
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="cat_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b0764" />
                <stop offset="50%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#cat_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#c084fc" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            {/* Velvet Dress & Ruff */}
            <path d="M 18 100 C 24 76, 34 72, 50 74 C 66 72, 76 76, 82 100 Z" fill="#2e1065" stroke="#e9d5ff" strokeWidth="1.2" />
            <path d="M 32 73 C 40 68, 60 68, 68 73 Z" fill="#f8fafc" />
            {/* Face */}
            <ellipse cx="50" cy="54" rx="13" ry="15" fill="#fed7aa" />
            <circle cx="45" cy="52" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="52" r="1.5" fill="#1e293b" />
            <path d="M 46 60 Q 50 62 54 60" fill="none" stroke="#e11d48" strokeWidth="1.2" strokeLinecap="round" />
            {/* French Hood with Pearl Border */}
            <path d="M 28 50 C 28 30, 72 30, 72 50 C 66 34, 34 34, 28 50 Z" fill="#0f172a" />
            <path d="M 30 46 C 32 32, 68 32, 70 46" fill="none" stroke="#fef08a" strokeWidth="2.5" />
            {/* Pearl dots */}
            {[34, 40, 46, 50, 54, 60, 66].map((x, i) => (
              <circle key={i} cx={x} cy={34 - Math.abs(50 - x) * 0.3} r="1.5" fill="#ffffff" />
            ))}
          </svg>
        );

      case 'noble_isabella':
        // Isabella I of Castile: Spanish Crown & Oceanic Pearl Mantle
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="isa_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#isa_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 18 100 C 24 76, 34 72, 50 74 C 66 72, 76 76, 82 100 Z" fill="#172554" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M 32 74 Q 50 86 68 74" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="50" cy="80" r="2.5" fill="#3b82f6" />
            <ellipse cx="50" cy="54" rx="13" ry="15" fill="#fed7aa" />
            <circle cx="45" cy="52" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="52" r="1.5" fill="#1e293b" />
            {/* Crown with Sapphire Gem */}
            <path d="M 32 38 L 36 26 L 43 32 L 50 22 L 57 32 L 64 26 L 68 38 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            <circle cx="50" cy="20" r="2" fill="#3b82f6" />
            {/* Veil */}
            <path d="M 30 40 C 26 58, 28 72, 28 82" fill="none" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="2 2" />
            <path d="M 70 40 C 74 58, 72 72, 72 82" fill="none" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="2 2" />
          </svg>
        );

      case 'noble_henry':
        // Henry VIII of England: Iconic Tudor Cap & Broad Fur Mantle
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="hen_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="50%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#450a0a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#hen_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            {/* Broad Shoulders & Heavy Golden Chain */}
            <path d="M 12 100 C 18 70, 30 66, 50 68 C 70 66, 82 70, 88 100 Z" fill="#450a0a" stroke="#d97706" strokeWidth="2" />
            <path d="M 28 72 Q 50 94 72 72" fill="none" stroke="#f59e0b" strokeWidth="3" />
            {/* Round Tudor Face & Beard */}
            <ellipse cx="50" cy="55" rx="16" ry="16" fill="#fed7aa" />
            <path d="M 38 56 C 38 72, 62 72, 62 56 C 58 70, 42 70, 38 56 Z" fill="#9a3412" />
            <path d="M 42 56 Q 50 58 58 56" fill="none" stroke="#7c2d12" strokeWidth="1.5" />
            <circle cx="44" cy="50" r="1.5" fill="#1e293b" />
            <circle cx="56" cy="50" r="1.5" fill="#1e293b" />
            {/* Flat Tudor Cap */}
            <ellipse cx="50" cy="38" rx="22" ry="7" fill="#0f172a" />
            <path d="M 32 38 C 36 28, 64 28, 68 38 Z" fill="#18181b" stroke="#f59e0b" strokeWidth="1" />
            <path d="M 66 34 C 76 26, 82 24, 86 20 C 80 26, 72 30, 66 34 Z" fill="#ffffff" />
          </svg>
        );

      case 'noble_charles':
        // Charles V, Holy Roman Emperor: Silver Knight Armor & Imperial Cape
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="cha_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#cha_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            {/* Steel Knight Cuirass */}
            <path d="M 18 100 C 24 74, 34 70, 50 72 C 66 70, 76 74, 82 100 Z" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 46 72 L 50 100 L 54 72 Z" fill="#f59e0b" />
            <ellipse cx="50" cy="54" rx="13" ry="15" fill="#fed7aa" />
            <circle cx="45" cy="50" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="50" r="1.5" fill="#1e293b" />
            <path d="M 42 56 C 42 66, 58 66, 58 56 Z" fill="#52525b" />
            {/* Imperial Crown */}
            <path d="M 34 38 L 38 28 L 44 32 L 50 22 L 56 32 L 62 28 L 66 38 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            <circle cx="50" cy="20" r="2" fill="#ef4444" />
          </svg>
        );

      case 'noble_mary':
        // Mary Stuart of Scotland: Delicate Pearl Tiara & High Lace Ruff
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="mar_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4c1d95" />
                <stop offset="50%" stopColor="#2e1065" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#mar_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#c084fc" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 18 100 C 24 76, 34 72, 50 74 C 66 72, 76 76, 82 100 Z" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1.2" />
            <path d="M 32 72 Q 50 64 68 72 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="50" cy="52" rx="13" ry="14" fill="#fed7aa" />
            <circle cx="45" cy="50" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="50" r="1.5" fill="#1e293b" />
            <path d="M 46 58 Q 50 60 54 58" fill="none" stroke="#e11d48" strokeWidth="1.2" />
            {/* Scottish Tiara */}
            <path d="M 34 38 C 38 28, 62 28, 66 38 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
            <circle cx="50" cy="28" r="2" fill="#3b82f6" />
            <circle cx="42" cy="32" r="1.5" fill="#ffffff" />
            <circle cx="58" cy="32" r="1.5" fill="#ffffff" />
          </svg>
        );

      case 'noble_philip':
        // Philip II of Spain: Dark Court Robes, Crisp Ruff & Golden Order
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="phi_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="50%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#phi_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 18 100 C 24 76, 34 72, 50 74 C 66 72, 76 76, 82 100 Z" fill="#09090b" stroke="#e4e4e7" strokeWidth="1" />
            {/* Crisp Pleated Ruff */}
            <ellipse cx="50" cy="68" rx="18" ry="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="50" cy="52" rx="13" ry="14" fill="#fed7aa" />
            <circle cx="45" cy="48" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="48" r="1.5" fill="#1e293b" />
            <path d="M 44 54 C 44 62, 56 62, 56 54 Z" fill="#71717a" />
            {/* Black Court Cap with Ruby */}
            <path d="M 34 38 C 38 28, 62 28, 66 38 Z" fill="#18181b" stroke="#f59e0b" strokeWidth="1" />
            <circle cx="50" cy="33" r="2" fill="#ef4444" />
          </svg>
        );

      case 'noble_anne':
        // Anne of Brittany: Breton Jeweled Coronet & Royal Ermine
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="ann_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#064e3b" />
                <stop offset="50%" stopColor="#047857" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="16" fill="url(#ann_bg)" />
            <circle cx="50" cy="52" r="38" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 18 100 C 24 76, 34 72, 50 74 C 66 72, 76 76, 82 100 Z" fill="#065f46" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M 32 74 Q 50 86 68 74" fill="none" stroke="#fde047" strokeWidth="1.5" />
            <ellipse cx="50" cy="53" rx="13" ry="14" fill="#fed7aa" />
            <circle cx="45" cy="50" r="1.5" fill="#1e293b" />
            <circle cx="55" cy="50" r="1.5" fill="#1e293b" />
            <path d="M 46 58 Q 50 60 54 58" fill="none" stroke="#e11d48" strokeWidth="1.2" />
            {/* Breton Coronet */}
            <path d="M 34 38 L 38 30 L 44 34 L 50 26 L 56 34 L 62 30 L 66 38 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            <circle cx="50" cy="24" r="2" fill="#10b981" />
          </svg>
        );

      default:
        // Generic Royal Noble Cameo fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <rect width="100" height="100" rx="16" fill="#1e1b4b" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M 30 78 C 36 62, 64 62, 70 78 Z" fill="#312e81" stroke="#f59e0b" strokeWidth="1" />
            <circle cx="50" cy="46" r="14" fill="#fed7aa" />
            <path d="M 38 36 L 42 28 L 50 24 L 58 28 L 62 36 Z" fill="#f59e0b" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative w-full flex items-center justify-center overflow-hidden rounded-xl border border-amber-500/30 bg-[#0B0F1A]/80 shadow-inner ${className}`}
      title={name}
    >
      {renderArt()}
      {/* Subtle inner vignette */}
      <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]" />
    </div>
  );
};
