import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown,
  Coins,
  ShoppingBag,
  Shield,
  Zap,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Bookmark,
  GraduationCap,
} from 'lucide-react';
import { GemType } from '../types/game.ts';
import { ALL_GEMS } from '../game/constants.ts';
import { canTakeTokens } from '../game/rules.ts';
import { GemIcon } from './GemIcon.tsx';
import { NoblePortrait } from './NoblePortrait.tsx';
import { sound } from '../game/sound.ts';
import { markInteractiveTutorialSeen } from '../utils/tutorialStorage.ts';

export type TutorialTargetId =
  | 'overview'
  | 'gem-bank'
  | 'development-cards'
  | 'nobles-dais'
  | 'buying-power';

interface InteractiveTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStepTargetChange?: (targetId: TutorialTargetId) => void;
  variant?: 'desktop' | 'mobile';
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialStepConfig {
  id: TutorialTargetId;
  stepNumber: string;
  shortLabel: string;
  title: string;
  subtitle: string;
}

const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: 'overview',
    stepNumber: '01',
    shortLabel: 'Goal',
    title: 'Welcome to Splendor',
    subtitle: 'Master the Renaissance Gem Trade & Reach 15 Prestige Points',
  },
  {
    id: 'gem-bank',
    stepNumber: '02',
    shortLabel: 'Gems',
    title: 'Collecting Gem Tokens',
    subtitle: 'Take 3 Different Gems or 2 Identical Gems from the Bank',
  },
  {
    id: 'development-cards',
    stepNumber: '03',
    shortLabel: 'Cards',
    title: 'Purchasing & Reserving Cards',
    subtitle: 'Build Permanent Gem Discounts & Earn Prestige Points',
  },
  {
    id: 'nobles-dais',
    stepNumber: '04',
    shortLabel: 'Nobles',
    title: 'Attracting Noble Patrons',
    subtitle: 'Earn Automatic +3 VP Visits Through Card Bonuses Alone',
  },
  {
    id: 'buying-power',
    stepNumber: '05',
    shortLabel: 'Power',
    title: 'Reading Your Buying Power',
    subtitle: 'Tokens + Permanent Card Discounts Combine Automatically',
  },
];

export const InteractiveTutorialOverlay: React.FC<InteractiveTutorialOverlayProps> = ({
  isOpen,
  onClose,
  onStepTargetChange,
  variant = 'desktop',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  // Interactive Sandbox State — Step 2: Gem Collecting Practice
  const [practiceBank] = useState<Record<GemType | 'gold', number>>({
    emerald: 4,
    sapphire: 4,
    ruby: 4,
    diamond: 3, // Intentionally 3 so player can test the <4 rule for taking 2 identical
    onyx: 4,
    gold: 5,
  });
  const [practiceStagedGems, setPracticeStagedGems] = useState<GemType[]>(['emerald', 'sapphire', 'ruby']);
  const [gemPracticeSuccess, setGemPracticeSuccess] = useState(false);

  // Interactive Sandbox State — Step 3: Card Purchasing & Discount Simulator
  const [simDiscounts, setSimDiscounts] = useState(1);
  const [simUseGold, setSimUseGold] = useState(false);
  const [simCardPurchased, setSimCardPurchased] = useState(false);

  // Interactive Sandbox State — Step 4: Noble Patron Interaction
  const [simNobleBonuses, setSimNobleBonuses] = useState<{
    emerald: number;
    sapphire: number;
    ruby: number;
  }>({
    emerald: 2,
    sapphire: 3,
    ruby: 3,
  });

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Notify parent when target changes (e.g. so MobilePlayerView can switch between 'personal' and 'table' tabs)
  useEffect(() => {
    if (!isOpen) return;
    onStepTargetChange?.(currentStep.id);
  }, [isOpen, currentStep.id, onStepTargetChange]);

  // Measure target element on screen for spotlight cutout
  const updateSpotlight = useCallback(() => {
    if (!isOpen || currentStep.id === 'overview') {
      setSpotlightRect(null);
      return;
    }

    const el = document.querySelector(`[data-tutorial-target="${currentStep.id}"]`);
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setSpotlightRect(null);
      return;
    }

    const pad = 8;
    setSpotlightRect({
      top: Math.max(4, rect.top - pad),
      left: Math.max(4, rect.left - pad),
      width: Math.min(window.innerWidth - 8, rect.width + pad * 2),
      height: Math.min(window.innerHeight - 8, rect.height + pad * 2),
    });
  }, [isOpen, currentStep.id]);

  useEffect(() => {
    if (!isOpen) return;
    // Small timeout to allow tab transitions on mobile before measuring
    const timer = setTimeout(updateSpotlight, 80);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [isOpen, currentStepIndex, updateSpotlight]);

  const handleFinishTutorial = useCallback(() => {
    markInteractiveTutorialSeen();
    sound.playTurnChime();
    onClose();
  }, [onClose]);

  const handleNextStep = useCallback(() => {
    sound.playTokenPickup();
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinishTutorial();
    }
  }, [currentStepIndex, handleFinishTutorial]);

  const handlePrevStep = useCallback(() => {
    sound.playTokenPickup();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinishTutorial();
      } else if (e.key === 'ArrowRight') {
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleFinishTutorial, handleNextStep, handlePrevStep]);

  if (!isOpen) return null;

  // Step 2 Gem Validation
  const practiceValidation = canTakeTokens(practiceStagedGems, practiceBank);

  const handleTogglePracticeGem = (gem: GemType) => {
    sound.playTokenPickup();
    setGemPracticeSuccess(false);
    setPracticeStagedGems((prev) => {
      const count = prev.filter((g) => g === gem).length;
      if (count === 1 && prev.length === 1) {
        return [gem, gem];
      }
      if (count > 0) {
        return prev.filter((g) => g !== gem);
      }
      if (prev.length >= 3) {
        return [gem];
      }
      return [...prev, gem];
    });
  };

  // Step 3 Card Purchase Calculation
  // Sample Card: "Royal Sapphire Artisan" — Cost: 3 Sapphire, 1 Diamond | Bonus: +1 Sapphire | +2 VP
  const baseSapphireCost = 3;
  const baseDiamondCost = 1;
  const effectiveSapphireCost = Math.max(0, baseSapphireCost - simDiscounts);
  const goldReduction = simUseGold ? 1 : 0;
  const totalTokensNeeded = Math.max(0, effectiveSapphireCost + baseDiamondCost - goldReduction);

  // Step 4 Noble Eligibility
  const isNobleMet =
    simNobleBonuses.emerald >= 3 &&
    simNobleBonuses.sapphire >= 3 &&
    simNobleBonuses.ruby >= 3;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 select-none font-sans animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
    >
      {/* SVG Backdrop with Spotlight Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        onClick={handleFinishTutorial}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(6, 9, 16, 0.84)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Highlighted Target Reticle Frame */}
      {spotlightRect && (
        <div
          className="fixed pointer-events-none z-50 rounded-2xl border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.55)] transition-all duration-200"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        >
          <div className="absolute -top-6 left-3 px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-['Cinzel'] font-black text-[10px] tracking-wider uppercase shadow">
            Live Board Highlight: {currentStep.shortLabel}
          </div>
        </div>
      )}

      {/* Main Interactive Tutorial Card */}
      <div
        className={`relative z-50 w-full max-w-xl rounded-2xl bg-[#121826] border border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-slate-100 flex flex-col overflow-hidden transition-all duration-200 ${
          currentStep.id === 'development-cards'
            ? 'my-auto lg:ml-auto lg:mr-6'
            : spotlightRect && spotlightRect.top < window.innerHeight * 0.42
            ? 'mt-auto mb-2 sm:mb-4'
            : spotlightRect && spotlightRect.top >= window.innerHeight * 0.42
            ? 'mb-auto mt-2 sm:mt-6'
            : 'my-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar: Step Navigation Tabs & Skip Button */}
        <div className="px-4 sm:px-5 pt-3.5 pb-2.5 bg-[#0B0F1A] border-b border-white/8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <GraduationCap size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-amber-300/90 font-['Cinzel'] font-bold tracking-wider">
                Interactive Guide · Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishTutorial}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="Skip or close tutorial"
          >
            <span>Skip Guide</span>
            <X size={13} />
          </button>
        </div>

        {/* Interactive Step Selector Bar */}
        <div className="grid grid-cols-5 gap-1 px-4 sm:px-5 py-2 bg-[#0D121F] border-b border-white/5">
          {TUTORIAL_STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isPast = idx < currentStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  sound.playTokenPickup();
                  setCurrentStepIndex(idx);
                }}
                className={`py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-['Cinzel'] font-bold transition-all cursor-pointer truncate ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : isPast
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                {step.stepNumber}. {step.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Step Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[65vh] space-y-4">
          <div>
            <h2
              id="tutorial-modal-title"
              className="font-['Cinzel'] font-black text-lg sm:text-xl text-amber-200 tracking-wide"
            >
              {currentStep.stepNumber}. {currentStep.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{currentStep.subtitle}</p>
          </div>

          {/* =============================================================== */}
          {/* STEP 1: OVERVIEW & OBJECTIVE                                    */}
          {/* =============================================================== */}
          {currentStep.id === 'overview' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                In <strong className="text-amber-200">Splendor</strong>, you lead a Renaissance merchant guild. On each turn, you perform <strong className="text-white">exactly one action</strong> to build your gem engine:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#0B0F1A] border border-white/8 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-['Cinzel'] font-bold text-xs">
                    <Coins size={15} />
                    <span>1. Collect Gems</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Take <strong className="text-slate-200">3 different</strong> colored gems, or <strong className="text-slate-200">2 identical</strong> gems (when ≥4 are in the bank).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0F1A] border border-white/8 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-['Cinzel'] font-bold text-xs">
                    <ShoppingBag size={15} />
                    <span>2. Buy or Reserve</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Spend tokens to buy cards that grant <strong className="text-slate-200">permanent gem discounts</strong> & Prestige Points (VP).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0F1A] border border-white/8 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-purple-300 font-['Cinzel'] font-bold text-xs">
                    <Shield size={15} />
                    <span>3. Noble Patrons</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Accumulate enough permanent card bonuses to earn automatic <strong className="text-slate-200">+3 VP Noble visits</strong>!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Crown size={20} className="text-amber-400 shrink-0" />
                  <div className="text-xs text-slate-200">
                    <strong className="text-amber-300 font-['Cinzel']">Winning Condition:</strong> Reaching <strong className="text-amber-300">15 Prestige Points</strong> triggers the final round so every player gets an equal number of turns.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 2: GEM COLLECTING (WITH INTERACTIVE PRACTICE WIDGET)       */}
          {/* =============================================================== */}
          {currentStep.id === 'gem-bank' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0B0F1A] border border-white/8">
                  <div className="font-['Cinzel'] font-bold text-amber-300 mb-0.5">
                    Option A: 3 Different Gems
                  </div>
                  <p className="text-slate-400">
                    Click 3 distinct gem colors in the bank to take 1 of each.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0F1A] border border-white/8">
                  <div className="font-['Cinzel'] font-bold text-amber-300 mb-0.5">
                    Option B: 2 Same-Color Gems
                  </div>
                  <p className="text-slate-400">
                    Click the same gem twice—only legal if the bank has <strong className="text-white">at least 4 tokens</strong> of that color!
                  </p>
                </div>
              </div>

              {/* Hands-On Interactive Gem Practice */}
              <div className="p-3.5 rounded-xl bg-[#0B0F1A] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-['Cinzel'] font-bold text-xs text-amber-200">
                    Try It: Click Gems Below to Test Collection Rules
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPracticeStagedGems([]);
                      setGemPracticeSuccess(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {ALL_GEMS.map((gem) => {
                    const countInBank = practiceBank[gem];
                    const stagedCount = practiceStagedGems.filter((g) => g === gem).length;
                    return (
                      <button
                        key={gem}
                        type="button"
                        onClick={() => handleTogglePracticeGem(gem)}
                        className={`relative p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                          stagedCount > 0
                            ? 'bg-amber-400/20 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-[#121826] border-white/10 hover:border-amber-400/50'
                        }`}
                      >
                        <GemIcon type={gem} size="sm" variant="gem" />
                        <span className="text-[10px] font-mono text-slate-300 capitalize">
                          {gem} ({countInBank})
                        </span>
                        {stagedCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[10px]">
                            +{stagedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-xs">
                    {gemPracticeSuccess ? (
                      <span className="text-emerald-400 font-semibold">
                        ✓ Great job! Those tokens would be added to your hand (max 10 tokens total).
                      </span>
                    ) : practiceValidation.valid ? (
                      <span className="text-emerald-300">
                        ✓ Valid selection ({practiceStagedGems.length} tokens staged).
                      </span>
                    ) : (
                      <span className="text-amber-300/90">
                        {practiceValidation.error || 'Select 3 different gems or 2 of the same color (if 4+ in bank).'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!practiceValidation.valid}
                    onClick={() => {
                      sound.playTokenDrop();
                      setGemPracticeSuccess(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-['Cinzel'] font-bold text-xs shrink-0 transition-all ${
                      practiceValidation.valid
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                        : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    Test Take ({practiceStagedGems.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 3: CARD PURCHASING & PERMANENT BONUSES                     */}
          {/* =============================================================== */}
          {currentStep.id === 'development-cards' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p className="text-xs text-slate-300 leading-relaxed">
                Development cards are arranged in 3 tiers (<strong className="text-emerald-300">Tier 1</strong>, <strong className="text-sky-300">Tier 2</strong>, <strong className="text-amber-300">Tier 3</strong>). Every card you buy provides a <strong className="text-amber-300">Permanent Gem Bonus (+1 Discount)</strong> in its top-right corner that reduces the cost of future cards!
              </p>

              {/* Interactive Card Discount Simulator */}
              <div className="p-3.5 rounded-xl bg-[#0B0F1A] border border-amber-500/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Sample Card Visual */}
                <div className="sm:col-span-5 p-3 rounded-xl bg-gradient-to-b from-[#1A2538] to-[#0E1522] border border-emerald-500/60 shadow-md flex flex-col justify-between h-36">
                  <div className="flex items-center justify-between">
                    <span className="font-['Cinzel'] font-black text-lg text-amber-300 leading-none">
                      2 <span className="text-[9px] font-sans text-slate-400">VP</span>
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/10 border border-white/15">
                      <span className="text-[9px] text-amber-300 font-bold">+1</span>
                      <GemIcon type="sapphire" size="xs" variant="gem" />
                    </div>
                  </div>

                  <div className="text-center my-1">
                    <div className="font-['Cinzel'] font-bold text-xs text-amber-100">
                      Royal Sapphire Artisan
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Permanent +1 Sapphire Discount
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                    <span className="text-[10px] text-slate-400">Base Cost:</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 font-mono font-bold text-xs text-white">
                        <GemIcon type="sapphire" size="xs" variant="gem" /> 3
                      </span>
                      <span className="flex items-center gap-0.5 font-mono font-bold text-xs text-white">
                        <GemIcon type="diamond" size="xs" variant="gem" /> 1
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Controls for Discounts & Gold */}
                <div className="sm:col-span-7 flex flex-col justify-between gap-2.5 text-xs">
                  <div className="font-['Cinzel'] font-bold text-amber-200">
                    Interactive Cost Calculator:
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#121826] border border-white/8">
                    <span>Your Sapphire Card Discounts:</span>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            sound.playTokenPickup();
                            setSimDiscounts(d);
                            setSimCardPurchased(false);
                          }}
                          className={`w-6 h-6 rounded font-mono font-bold text-xs cursor-pointer transition-colors ${
                            simDiscounts === d
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          +{d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#121826] border border-white/8">
                    <span className="flex items-center gap-1.5">
                      <Bookmark size={13} className="text-amber-400" />
                      <span>Use Reserved Gold Joker (+1 Wild):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTokenPickup();
                        setSimUseGold(!simUseGold);
                        setSimCardPurchased(false);
                      }}
                      className={`px-2.5 py-1 rounded font-['Cinzel'] font-bold text-[11px] cursor-pointer transition-colors ${
                        simUseGold
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {simUseGold ? 'Gold Applied (-1)' : 'Apply Gold'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-slate-400">Tokens You Pay: </span>
                      <strong className="text-emerald-300 font-mono text-sm">
                        {totalTokensNeeded} token{totalTokensNeeded === 1 ? '' : 's'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playBuyCard();
                        setSimCardPurchased(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-['Cinzel'] font-bold text-xs cursor-pointer active:scale-95 transition-all"
                    >
                      {simCardPurchased ? '✓ Card Purchased (+2 VP!)' : 'Simulate Buy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 4: NOBLE PATRONS & AUTOMATIC VISITS                        */}
          {/* =============================================================== */}
          {currentStep.id === 'nobles-dais' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p className="text-xs text-slate-300 leading-relaxed">
                Noble Patrons sit on the Noble Dais and are worth <strong className="text-amber-300">+3 Prestige Points</strong> each. Unlike cards, <strong className="text-white">Nobles are never bought with tokens</strong>—they automatically visit you at the end of your turn as soon as your <strong className="text-amber-200">Permanent Card Bonuses</strong> match their requirement chips!
              </p>

              {/* Interactive Noble Patron Demo */}
              <div className="p-3.5 rounded-xl bg-[#0B0F1A] border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
                {/* Sample Noble Tile */}
                <div
                  className={`w-44 p-2.5 rounded-2xl border transition-all flex flex-col justify-between shrink-0 ${
                    isNobleMet
                      ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                      : 'bg-[#121826] border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-['Cinzel'] font-black text-sm text-amber-300 shrink-0">
                      +3 VP
                    </span>
                    <span className="text-[9px] font-['Cinzel'] text-amber-200/90 truncate">
                      Catherine de' Medici
                    </span>
                  </div>

                  <div className="w-14 h-14 mx-auto my-1 rounded-xl overflow-hidden border border-amber-500/30 bg-[#0B0F1A] flex items-center justify-center">
                    <NoblePortrait id="noble_1" className="w-full h-full" />
                  </div>

                  {/* Requirement Chips */}
                  <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-white/10 mt-1">
                    {(['emerald', 'sapphire', 'ruby'] as const).map((gem) => {
                      const met = simNobleBonuses[gem] >= 3;
                      return (
                        <div
                          key={gem}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-xs font-mono font-black ${
                            met
                              ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300'
                              : 'bg-[#0B0F1A] border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <GemIcon type={gem} size="xs" variant="gem" className="w-3.5 h-3.5" />
                          <span>3</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Bonus Trigger */}
                <div className="flex-1 space-y-2.5 text-xs w-full">
                  <div className="font-['Cinzel'] font-bold text-amber-200">
                    Test Automatic Noble Visit:
                  </div>
                  <p className="text-slate-400">
                    Catherine requires <strong className="text-slate-200">3 Emerald, 3 Sapphire, and 3 Ruby</strong> card bonuses. You currently have <strong className="text-amber-300">{simNobleBonuses.emerald}/3 Emerald</strong> bonuses:
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (simNobleBonuses.emerald < 3) {
                          sound.playNobleVisit();
                          setSimNobleBonuses((prev) => ({ ...prev, emerald: 3 }));
                        } else {
                          sound.playTokenPickup();
                          setSimNobleBonuses((prev) => ({ ...prev, emerald: 2 }));
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl font-['Cinzel'] font-bold text-xs transition-all cursor-pointer ${
                        isNobleMet
                          ? 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                      }`}
                    >
                      {isNobleMet
                        ? 'Reset Emerald Bonus (2/3)'
                        : '+ Acquire 3rd Emerald Card Bonus'}
                    </button>
                  </div>

                  {isNobleMet && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold animate-fade-in">
                      👑 Noble Patron Claimed! Catherine de' Medici visits your estate automatically and grants +3 Prestige Points!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STEP 5: READING YOUR BUYING POWER & SCOREBOARD                  */}
          {/* =============================================================== */}
          {currentStep.id === 'buying-power' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p className="text-xs text-slate-300 leading-relaxed">
                Your player panel combines your <strong className="text-white">Gem Tokens</strong> and <strong className="text-amber-300">Permanent Card Discounts</strong> into a single glanceable <strong className="text-amber-200">Buying Power</strong> badge for each color:
              </p>

              <div className="p-3.5 rounded-xl bg-[#0B0F1A] border border-white/10 flex flex-col sm:flex-row items-center justify-around gap-4">
                {/* Visual Diagram of Unified Badge */}
                <div className="flex items-center gap-4">
                  <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-[#151c2d] border border-amber-500/40 w-20">
                    <div className="relative flex items-center justify-center">
                      <GemIcon type="emerald" size="md" variant="gem" />
                      <span className="absolute -top-2 -right-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-full border border-amber-200">
                        +2
                      </span>
                    </div>
                    <span className="font-mono font-black text-lg text-amber-200 mt-2 leading-none">
                      5
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[10px]">
                        +2
                      </span>
                      <span className="text-slate-300">
                        <strong className="text-white">Top-Right Badge:</strong> Permanent card discounts (+2 Emerald)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200 font-mono font-black text-xs">
                        5
                      </span>
                      <span className="text-slate-300">
                        <strong className="text-white">Bottom Number:</strong> Total Buying Power (3 Tokens + 2 Discounts = 5)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                💡 <strong className="text-emerald-300">Pro Tip:</strong> Cards you can currently afford are automatically highlighted with a <strong className="text-emerald-300">green border</strong> on the board!{variant === 'mobile' ? ' You can reopen this guide anytime from the top bar.' : ' You can reopen this interactive guide anytime using the tutorial cap button in the top bar.'}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Footer */}
        <div className="px-4 sm:px-5 py-3 bg-[#0B0F1A] border-t border-white/8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`py-2 px-3.5 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center gap-1.5 transition-all ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 cursor-pointer'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-amber-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-400/60'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNextStep}
            className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-black text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
          >
            {currentStepIndex === TUTORIAL_STEPS.length - 1 ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span>Start Playing</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
