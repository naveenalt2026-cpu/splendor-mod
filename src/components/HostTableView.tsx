import React, { useState } from 'react';
import { PublicGameState } from '../types/multiplayer.ts';
import { GemChipRack } from './GemChipRack.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { NobleClaimCelebration } from './NobleClaimCelebration.tsx';
import { ActionHistoryModal } from './ActionHistoryModal.tsx';
import { RulesModal } from './RulesModal.tsx';
import { calculateBonuses } from '../game/rules.ts';
import { GemType, NobleTile } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS, GEM_COLORS, TOKEN_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { Crown, Shield, Tv, History, BookOpen, Volume2, VolumeX, RotateCcw, Trophy } from 'lucide-react';
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

  // Listen to noble claim events for room-wide fanfare
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
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-2 sm:p-3 lg:p-4 select-none relative overflow-x-hidden font-sans">
      {/* Background ambient texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Banner: Host Table Status & Current Turn */}
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/30 shadow-2xl backdrop-blur-md z-20">
        {/* Host branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            <Tv size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="font-['Cinzel'] font-black text-sm sm:text-base text-amber-200 tracking-wider flex items-center gap-1.5">
              <span>SPLENDOR: TABLE VIEW</span>
              <span className="text-[10px] bg-amber-950/80 border border-amber-400 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                {publicState.sessionId}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Shared Central Board • Target: {publicState.targetVP} VP
            </div>
          </div>
        </div>

        {/* Turn Spotlight Banner */}
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
          <span className="text-xl">{activePlayer?.avatar || '👑'}</span>
          <div className="flex flex-col items-center">
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-300 tracking-wider">
              {activePlayer?.name?.toUpperCase()}'S TURN
            </span>
            <span className="text-[9px] text-slate-400">
              {publicState.status === 'final_round'
                ? '⚠️ FINAL ROUND IN PROGRESS!'
                : `Round ${publicState.turnCount}`}
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors shadow cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors shadow cursor-pointer"
            title="Splendor Rules"
          >
            <BookOpen size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors shadow cursor-pointer"
            title="Move History"
          >
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={onRestartMatch}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors shadow cursor-pointer"
            title="Restart Match"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Playing Arena: Bank + Card Market Grid + Nobles Dais */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-2 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 z-10 overflow-y-auto">
        {/* Left Side: 3D Gem Bank Chip Stacks */}
        <div className="flex lg:flex-col items-center justify-center shrink-0 w-full lg:w-auto">
          <GemChipRack
            bank={publicState.bank}
            stagedGems={[]}
            onToggleStagedGem={() => {}}
            onClearStaged={() => {}}
            onConfirmTake={() => {}}
            disabled={true}
          />
        </div>

        {/* Center: 3 Tiers of Development Cards */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full max-w-4xl mx-auto overflow-x-auto pb-1">
          {([3, 2, 1] as const).map(tier => {
            const faceUp = publicState.faceUpCards[tier] || [];
            const deckRemaining = publicState.decks[tier] || 0;

            return (
              <div key={tier} className="relative flex items-center justify-center gap-2 sm:gap-3 min-w-[580px] sm:min-w-0 w-full">
                {/* Tier Deck Stack */}
                <div
                  className={`relative shrink-0 rounded-xl border-2 flex flex-col items-center justify-center select-none shadow-xl ${
                    tier === 3
                      ? 'w-16 sm:w-20 md:w-22 h-36 sm:h-40 md:h-44 border-amber-400/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900'
                      : tier === 2
                      ? 'w-16 sm:w-20 md:w-22 h-36 sm:h-40 md:h-44 border-sky-400/70 bg-gradient-to-br from-cyan-950 via-slate-900 to-sky-900'
                      : 'w-16 sm:w-20 md:w-22 h-36 sm:h-40 md:h-44 border-emerald-400/70 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900'
                  }`}
                >
                  <div className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base">
                    T{tier}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-200 mt-1">
                    {deckRemaining}
                  </div>
                  <div className="text-[9px] text-amber-200/70 uppercase font-['Cinzel'] mt-0.5">
                    Cards
                  </div>
                </div>

                {/* 4 Face-Up Cards per Tier */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 flex-1">
                  {faceUp.map(card => (
                    <div key={card.id} className="relative flex justify-center">
                      <DevelopmentCardView
                        card={card}
                        disabled={true}
                        canReserve={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Nobles Dais */}
        <aside
          className="relative flex lg:flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/95 border-2 border-slate-800 shadow-2xl backdrop-blur-md shrink-0 z-10 w-full lg:w-auto overflow-x-auto lg:overflow-y-auto max-h-none lg:max-h-[500px]"
          aria-label="Noble Patrons Dais"
        >
          <div className="flex lg:flex-col items-center gap-1.5 mb-2 shrink-0 pr-3 lg:pr-0 border-r lg:border-r-0 border-slate-800">
            <div className="font-['Cinzel'] font-bold text-amber-200/90 text-xs tracking-wider uppercase flex items-center gap-1">
              <Shield size={14} className="text-amber-400" />
              <span>Nobles</span>
            </div>
            <div className="text-[10px] text-slate-400 text-center hidden lg:block max-w-[100px]">
              +3 VP on bonus match
            </div>
          </div>

          <div className="flex lg:flex-col gap-2 sm:gap-2.5 items-center shrink-0">
            {publicState.nobles.length === 0 ? (
              <div className="text-[11px] text-slate-500 font-['Cinzel'] p-3 text-center">
                All Claimed!
              </div>
            ) : (
              publicState.nobles.map(noble => (
                <NobleTileView
                  key={noble.id}
                  noble={noble}
                  playerBonuses={activePlayer ? calculateBonuses(activePlayer.cards) : { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 }}
                />
              ))
            )}
          </div>
        </aside>
      </main>

      {/* Bottom Leaderboard: All Players' Public State Overview */}
      <footer className="w-full max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/80 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {publicState.players.map((p, idx) => {
            const isActive = idx === publicState.activePlayerIndex;
            const bonuses = calculateBonuses(p.cards);
            const totalTokens = Object.values(p.tokens).reduce((acc, c) => acc + c, 0);

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : 'bg-slate-950/80 border-slate-800/90 opacity-90'
                }`}
              >
                {/* Header: Avatar, Name, VP */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{p.avatar}</span>
                    <div className="min-w-0">
                      <div className="font-['Cinzel'] font-bold text-xs sm:text-sm text-slate-100 truncate flex items-center gap-1">
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

                  <div className="flex items-center gap-1 bg-amber-950/90 border border-amber-400 px-2 py-0.5 rounded-full shadow shrink-0">
                    <Crown size={12} className="text-amber-400" />
                    <span className="font-['Cinzel'] font-black text-amber-200 text-xs sm:text-sm">
                      {p.prestigePoints}
                    </span>
                    <span className="text-[9px] text-amber-400/80">/ {publicState.targetVP}</span>
                  </div>
                </div>

                {/* Tokens count */}
                <div className="flex items-center justify-between text-[11px] bg-slate-900/90 rounded-lg p-1.5 mb-1.5 border border-slate-800">
                  <span className="text-slate-400 font-semibold text-[10px]">Tokens ({totalTokens}/10):</span>
                  <div className="flex items-center gap-1.5">
                    {ALL_TOKENS.map(t => (
                      <div key={t} className="flex items-center gap-0.5" title={`${t}: ${p.tokens[t]}`}>
                        <GemIcon type={t} size="xs" variant={t === 'gold' ? 'token' : 'gem'} />
                        <span className="font-bold text-[10px]">{p.tokens[t]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engine Bonuses */}
                <div className="flex items-center justify-between text-[10px] bg-black/40 rounded-lg p-1 border border-slate-900">
                  <span className="text-slate-400 font-medium">Discounts:</span>
                  <div className="flex items-center gap-1.5">
                    {ALL_GEMS.map(g => (
                      <div key={g} className="flex items-center gap-0.5" title={`Permanent ${g} bonus: +${bonuses[g]}`}>
                        <GemIcon type={g} size="xs" variant="gem" />
                        <span className="font-bold text-amber-300">+{bonuses[g]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </footer>

      {/* Modals & Fanfares */}
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

      {/* Game Over Banner for Host */}
      {publicState.status === 'game_over' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-2xl flex flex-col items-center">
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
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-['Cinzel'] font-black text-base uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Start New Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
