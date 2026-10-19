import React, { useState } from 'react';
import { PublicGameState } from '../types/multiplayer.ts';
import { GemChipRack } from './GemChipRack.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { NobleClaimCelebration } from './NobleClaimCelebration.tsx';
import { ActionHistoryModal } from './ActionHistoryModal.tsx';
import { RulesModal } from './RulesModal.tsx';
import { calculateBonuses, checkCardAffordability } from '../game/rules.ts';
import { GemType, NobleTile } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS, GEM_COLORS, TOKEN_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { Crown, Shield, Tv, History, BookOpen, Volume2, VolumeX, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { sound } from '../game/sound.ts';

interface HostTableViewProps {
  publicState: PublicGameState;
  onRestartMatch: () => void;
  onExitHost: () => void;
}

export const HostTableView: React.FC<HostTableViewProps> = ({
  publicState,
  onRestartMatch,
  onExitHost,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [celebratingNoble, setCelebratingNoble] = useState<{
    noble: NobleTile;
    playerName: string;
    isHuman: boolean;
  } | null>(null);

  const activePlayer = publicState.players[publicState.activePlayerIndex] || publicState.players[0];
  const activeBonuses = activePlayer
    ? calculateBonuses(activePlayer.cards)
    : { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 };

  // Listen to noble claim events for fanfare
  React.useEffect(() => {
    if (publicState.claimedNobleEvent) {
      setCelebratingNoble({
        noble: publicState.claimedNobleEvent.noble,
        playerName: publicState.claimedNobleEvent.playerName,
        isHuman: true,
      });
    }
  }, [publicState.claimedNobleEvent]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setMuted(!next);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col justify-between p-3 sm:p-4 lg:p-6 select-none relative overflow-x-hidden font-sans">
      {/* Top Header: Host Table Status & Current Player Spotlight */}
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#121826] border border-white/8 shadow-xl backdrop-blur-md z-20 max-w-7xl w-full mx-auto">
        {/* Host branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Tv size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="font-['Cinzel'] font-black text-sm sm:text-base text-amber-200 tracking-wider flex items-center gap-2">
              <span>SPLENDOR: SHARED TABLE</span>
              <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {publicState.sessionId}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Target: {publicState.targetVP} Prestige Points
            </div>
          </div>
        </div>

        {/* Current Player Spotlight Name Plate */}
        <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30">
          <div className="relative">
            <span className="text-2xl sm:text-3xl filter drop-shadow">{activePlayer?.avatar || '👑'}</span>
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F1A] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-300 tracking-wider">
              {activePlayer?.name?.toUpperCase()}'S TURN
            </span>
            <span className="text-[10px] text-slate-400">
              {publicState.status === 'final_round'
                ? '⚠️ Final Round in Progress'
                : `Round ${publicState.turnCount}`}
            </span>
          </div>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Splendor Rules"
          >
            <BookOpen size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Move History"
          >
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={onRestartMatch}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Restart Match"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Playing Arena: Clean Horizontal Layout (Left: Bank | Center: Cards | Right: Nobles) */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto py-4 sm:py-6 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 lg:gap-6 z-10 overflow-y-auto">
        {/* Left Side: Compact Vertical Gem Bank */}
        <div className="flex lg:flex-col items-center justify-center shrink-0 w-full lg:w-auto">
          <GemChipRack
            bank={publicState.bank}
            disabled={true}
          />
        </div>

        {/* Center: Three Horizontal Rows of Development Cards (Tier 3 -> Tier 2 -> Tier 1) */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 w-full max-w-4xl mx-auto overflow-x-auto pb-2">
          {([3, 2, 1] as const).map(tier => {
            const faceUp = publicState.faceUpCards[tier] || [];
            const deckRemaining = publicState.decks[tier] || 0;

            const tierStyle =
              tier === 3
                ? {
                    border: 'border-amber-500/30',
                    bg: 'bg-[#121826]',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    label: 'T3',
                  }
                : tier === 2
                ? {
                    border: 'border-sky-500/30',
                    bg: 'bg-[#121826]',
                    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                    label: 'T2',
                  }
                : {
                    border: 'border-emerald-500/30',
                    bg: 'bg-[#121826]',
                    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    label: 'T1',
                  };

            return (
              <div key={tier} className="flex items-center justify-start gap-2.5 sm:gap-3.5 min-w-[620px] sm:min-w-0 w-full">
                {/* Tier Deck Card Stack */}
                <div
                  className={`relative shrink-0 rounded-2xl border ${tierStyle.border} ${tierStyle.bg} w-16 sm:w-20 md:w-22 h-44 sm:h-48 md:h-52 flex flex-col items-center justify-center select-none shadow-md`}
                >
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${tierStyle.badge}`}>
                    {tierStyle.label}
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-2">
                    {deckRemaining}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-['Cinzel'] tracking-wider">
                    Cards
                  </div>
                </div>

                {/* 4 Face-Up Cards per Tier */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3 flex-1">
                  {faceUp.map(card => {
                    // Check active player affordability for subtle green highlight glow
                    const affordability = activePlayer
                      ? checkCardAffordability(card, activePlayer.tokens, activeBonuses)
                      : undefined;

                    return (
                      <div key={card.id} className="relative flex justify-center">
                        <DevelopmentCardView
                          card={card}
                          affordability={affordability}
                          disabled={true}
                          canReserve={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Noble Patrons Dais */}
        <aside
          className="relative flex lg:flex-col items-center justify-start p-3 sm:p-4 rounded-2xl bg-[#121826] border border-white/8 shadow-xl backdrop-blur-md shrink-0 z-10 w-full lg:w-36 overflow-x-auto lg:overflow-y-auto max-h-none lg:max-h-[calc(100vh-200px)]"
          aria-label="Noble Patrons Dais"
        >
          <div className="flex lg:flex-col items-center gap-1.5 mb-2.5 pb-2 border-b border-white/10 w-full justify-center">
            <Shield size={14} className="text-amber-400" />
            <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-amber-200 text-center">
              Nobles
            </span>
          </div>

          <div className="flex lg:flex-col gap-2.5 sm:gap-3 items-center shrink-0 w-full">
            {publicState.nobles.length === 0 ? (
              <div className="text-xs text-slate-500 font-['Cinzel'] p-3 text-center">
                All Claimed!
              </div>
            ) : (
              publicState.nobles.map(noble => (
                <NobleTileView
                  key={noble.id}
                  noble={noble}
                  playerBonuses={activeBonuses}
                />
              ))
            )}
          </div>
        </aside>
      </main>

      {/* Bottom Status Chips: All Players' Public State Overview */}
      <footer className="w-full max-w-7xl mx-auto mt-2 pt-3 border-t border-white/8 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {publicState.players.map((p, idx) => {
            const isActive = idx === publicState.activePlayerIndex;
            const bonuses = calculateBonuses(p.cards);
            const totalTokens = Object.values(p.tokens).reduce((acc, c) => acc + c, 0);

            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-[#121826] border-amber-400/80 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : 'bg-[#121826]/70 border-white/5 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Header: Avatar, Name, VP */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{p.avatar}</span>
                    <div className="min-w-0">
                      <div className="font-['Cinzel'] font-bold text-xs sm:text-sm text-slate-100 truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.cards.length} cards • {p.reservedCardsCount} reserved
                      </div>
                    </div>
                  </div>

                  {/* VP Badge */}
                  <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                    <Crown size={12} className="text-amber-400" />
                    <span className="font-['Cinzel'] font-black text-amber-300 text-xs sm:text-sm">
                      {p.prestigePoints}
                    </span>
                    <span className="text-[9px] text-amber-400/70">/ {publicState.targetVP}</span>
                  </div>
                </div>

                {/* Tokens count */}
                <div className="flex items-center justify-between text-[11px] bg-[#0B0F1A]/80 rounded-xl px-2 py-1 mb-1.5 border border-white/5">
                  <span className="text-slate-400 text-[10px] font-medium">Tokens ({totalTokens}/10):</span>
                  <div className="flex items-center gap-1.5">
                    {ALL_TOKENS.map(t => (
                      <div key={t} className="flex items-center gap-0.5" title={`${t}: ${p.tokens[t]}`}>
                        <GemIcon type={t} size="xs" variant="gem" />
                        <span className="font-mono text-[10px] font-bold text-white">{p.tokens[t]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engine Discounts */}
                <div className="flex items-center justify-between text-[10px] bg-[#0B0F1A]/60 rounded-xl px-2 py-1 border border-white/5">
                  <span className="text-slate-400 text-[10px] font-medium">Discounts:</span>
                  <div className="flex items-center gap-1.5">
                    {ALL_GEMS.map(g => (
                      <div key={g} className="flex items-center gap-0.5" title={`Permanent ${g} bonus: +${bonuses[g]}`}>
                        <GemIcon type={g} size="xs" variant="gem" />
                        <span className="font-mono text-[10px] font-bold text-amber-300">+{bonuses[g]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </footer>

      {/* Modals & Celebrations */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <ActionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={publicState.log}
      />

      {celebratingNoble && (
        <NobleClaimCelebration
          noble={celebratingNoble.noble}
          playerName={celebratingNoble.playerName}
          isHuman={celebratingNoble.isHuman}
          onComplete={() => setCelebratingNoble(null)}
        />
      )}

      {/* Game Over Banner */}
      {publicState.status === 'game_over' && (
        <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#121826] border border-amber-400/60 shadow-2xl flex flex-col items-center">
            <Trophy size={48} className="text-amber-400 animate-bounce mb-3" />
            <h2 className="font-['Cinzel'] font-black text-2xl sm:text-3xl text-amber-200 tracking-wider">
              VICTORY ACHIEVED!
            </h2>
            <p className="text-sm text-slate-300 mt-2 mb-6">
              A Renaissance Gem Master has accumulated the required prestige!
            </p>

            <button
              type="button"
              onClick={onRestartMatch}
              className="w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-black text-base uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Start New Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
