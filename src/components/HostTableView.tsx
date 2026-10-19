import React, { useState } from 'react';
import { PublicGameState } from '../types/multiplayer.ts';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { NobleClaimCelebration } from './NobleClaimCelebration.tsx';
import { ActionHistoryModal } from './ActionHistoryModal.tsx';
import { RulesModal } from './RulesModal.tsx';
import { calculateBonuses } from '../game/rules.ts';
import { NobleTile } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS } from '../game/constants.ts';
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
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col justify-between p-2.5 sm:p-3 lg:p-4 select-none relative overflow-x-hidden font-sans">
      {/* Top Header: Slim, streamlined bar */}
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#121826] border border-white/8 shadow-md backdrop-blur-md z-20 max-w-[1536px] w-full mx-auto">
        {/* Left: Branding & Room Session */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
            <Tv size={16} className="stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-200 tracking-wider">
              SPLENDOR
            </span>
            <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              {publicState.sessionId}
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              • Target: <b className="text-amber-300 font-mono">{publicState.targetVP}</b> VP
            </span>
          </div>
        </div>

        {/* Center: Slim Active Player Turn Capsule */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-400/40 shadow-sm">
          <span className="text-lg filter drop-shadow">{activePlayer?.avatar || '👑'}</span>
          <span className="font-['Cinzel'] font-black text-xs text-amber-300 tracking-wider">
            {activePlayer?.name?.toUpperCase()}'S TURN
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-mono">
            {publicState.status === 'final_round' ? '⚠️ Final Round' : `R${publicState.turnCount}`}
          </span>
        </div>

        {/* Right: Sleek mini utility controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Splendor Rules"
          >
            <BookOpen size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Move History"
          >
            <History size={14} />
          </button>
          <button
            type="button"
            onClick={onRestartMatch}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Restart Match"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* Subheader: Horizontal Gem Bank Strip - Centered */}
      <section
        className="w-full max-w-[1536px] mx-auto mt-2 px-4 py-2 rounded-xl bg-[#121826]/90 border border-white/8 backdrop-blur-md flex items-center justify-center gap-3 sm:gap-6 flex-wrap shadow-md z-20"
        aria-label="Gem Bank Tokens"
      >
        <div className="flex items-center gap-1.5 shrink-0 pr-3 sm:pr-5 border-r border-white/10">
          <Sparkles size={14} className="text-amber-400" />
          <span className="font-['Cinzel'] font-black text-xs sm:text-sm uppercase tracking-wider text-amber-200">
            GEM BANK
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
          {ALL_TOKENS.map(t => {
            const count = publicState.bank[t] || 0;
            return (
              <div
                key={t}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                  count > 0
                    ? 'bg-[#0B0F1A] border-white/10 text-white shadow-xs'
                    : 'bg-white/5 border-transparent text-slate-500 opacity-25'
                }`}
                title={`${t}: ${count} available in gem bank`}
              >
                <GemIcon
                  type={t}
                  size="sm"
                  variant={t === 'gold' ? 'chip' : 'gem'}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="font-mono font-black text-xs sm:text-sm text-slate-100">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Playing Arena: 3 Columns (Left: Nobles Dais | Center: Cards Arena | Right: Scoreboard) */}
      <main className="relative flex-1 max-w-[1536px] w-full mx-auto py-2.5 sm:py-3.5 flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-3 lg:gap-4 z-10 overflow-y-auto">
        {/* Left Column: Noble Patrons Dais (Reduced width, zero scroll, sleek cameo tiles) */}
        <aside
          className="relative flex flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-[#121826]/90 border border-white/8 shadow-xl backdrop-blur-md shrink-0 z-10 w-full lg:w-44 xl:w-48"
          aria-label="Noble Patrons Dais"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2 pb-2 border-b border-white/10 w-full px-1">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-amber-200">
                Nobles
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
              {publicState.nobles.length} left
            </span>
          </div>

          {publicState.nobles.length === 0 ? (
            <div className="text-xs text-slate-500 font-['Cinzel'] p-6 text-center">
              All Nobles Claimed!
            </div>
          ) : (
            <div
              className={`w-full gap-2.5 ${
                publicState.nobles.length > 3
                  ? 'grid grid-cols-2'
                  : 'flex flex-col'
              }`}
            >
              {publicState.nobles.map(noble => (
                <NobleTileView
                  key={noble.id}
                  noble={noble}
                  compact={true}
                  className="w-full"
                />
              ))}
            </div>
          )}
        </aside>

        {/* Center Column: Three Horizontal Rows of Development Cards (Tier 3 -> Tier 2 -> Tier 1) */}
        <section
          className="flex-1 flex flex-col gap-2 sm:gap-2.5 w-full max-w-4xl mx-auto overflow-x-auto pb-1"
          aria-label="Development Cards Arena"
        >
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
              <div key={tier} className="flex items-center justify-start gap-2 sm:gap-2.5 min-w-[580px] sm:min-w-0 w-full">
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
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5 flex-1">
                  {faceUp.map(card => (
                    <div key={card.id} className="relative flex justify-center">
                      <DevelopmentCardView
                        card={card}
                        disabled={false}
                        canReserve={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Right Column: Player Game Details Scoreboard */}
        <aside
          className="relative flex flex-col gap-2 w-full lg:w-72 xl:w-80 shrink-0 z-10"
          aria-label="Players Scoreboard"
        >
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#121826]/80 border border-white/8">
            <div className="flex items-center gap-1.5">
              <Crown size={14} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-amber-200">
                Scoreboard
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Target: <b className="text-amber-300 font-mono">{publicState.targetVP}</b> VP
            </span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-none lg:max-h-[calc(100vh-140px)] pr-0.5">
            {publicState.players.map((p, idx) => {
              const isActive = idx === publicState.activePlayerIndex;
              const bonuses = calculateBonuses(p.cards);
              const totalBonuses = Object.values(bonuses).reduce((a, b) => a + b, 0);
              const totalTokens = Object.values(p.tokens).reduce((acc, c) => acc + c, 0);

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#151e33] border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-[#121826] border-white/8 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Row 1: Avatar, Name, VP score */}
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <span className="text-2xl filter drop-shadow">{p.avatar}</span>
                        {isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#151e33] animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-['Cinzel'] font-bold text-xs sm:text-sm text-slate-100 truncate flex items-center gap-1.5">
                          <span className={isActive ? 'text-amber-300 font-black' : 'text-slate-100'}>
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black font-sans uppercase">
                              TURN
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <span>{p.cards.length} cards</span>
                          {p.reservedCardsCount > 0 && (
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-1 rounded border border-amber-500/20">
                              {p.reservedCardsCount} res
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prestige Points */}
                    <div className="flex items-center gap-1 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 px-2.5 py-1 rounded-xl shrink-0 shadow-sm">
                      <Crown size={13} className="text-amber-400" />
                      <span className="font-['Cinzel'] font-black text-amber-300 text-sm leading-none">
                        {p.prestigePoints}
                      </span>
                      <span className="text-[9px] text-amber-400/70 font-mono leading-none">/{publicState.targetVP}</span>
                    </div>
                  </div>

                  {/* Row 2: Tokens in Hand (6 tokens) */}
                  <div className="bg-[#0B0F1A]/80 rounded-xl p-1.5 mb-1.5 border border-white/5">
                    <div className="flex items-center justify-between text-[10px] mb-1 px-0.5">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider font-['Cinzel']">
                        Tokens
                      </span>
                      <span className="font-mono text-slate-400 font-bold text-[10px]">
                        {totalTokens}/10
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {ALL_TOKENS.map(t => {
                        const count = p.tokens[t] || 0;
                        return (
                          <div
                            key={t}
                            className={`flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded-lg border transition-opacity ${
                              count > 0
                                ? 'bg-white/5 border-white/15 text-white'
                                : 'bg-transparent border-transparent text-slate-600 opacity-25'
                            }`}
                            title={`${t}: ${count}`}
                          >
                            <GemIcon
                              type={t}
                              size="xs"
                              variant={t === 'gold' ? 'chip' : 'gem'}
                              className="w-3.5 h-3.5"
                            />
                            <span className="font-mono text-xs font-black">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 3: Engine Discounts (5 gems) */}
                  <div className="bg-[#0B0F1A]/60 rounded-xl p-1.5 border border-white/5">
                    <div className="flex items-center justify-between text-[10px] mb-1 px-0.5">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider font-['Cinzel']">
                        Discounts
                      </span>
                      <span className="font-mono text-amber-400 font-bold text-[10px]">
                        +{totalBonuses}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {ALL_GEMS.map(g => {
                        const bonus = bonuses[g] || 0;
                        return (
                          <div
                            key={g}
                            className={`flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded-lg border transition-opacity ${
                              bonus > 0
                                ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                                : 'bg-transparent border-transparent text-slate-600 opacity-25'
                            }`}
                            title={`+${bonus} ${g} bonus`}
                          >
                            <GemIcon
                              type={g}
                              size="xs"
                              variant="gem"
                              className="w-3.5 h-3.5"
                            />
                            <span className="font-mono text-xs font-black">+{bonus}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </main>

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
