import React from 'react';
import { X, Trophy, Coins, BookmarkCheck, Shield, Sparkles } from 'lucide-react';
import { ALL_GEMS, GEM_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 shadow-2xl p-6 text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            <h2 className="font-['Cinzel'] font-bold text-amber-200 text-xl tracking-wider uppercase">
              Splendor Rules & Codex
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Rules"
          >
            <X size={20} />
          </button>
        </div>

        {/* Goal */}
        <div className="mb-6 p-3 rounded-xl bg-amber-950/30 border border-amber-500/40">
          <h3 className="font-['Cinzel'] font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
            <Trophy size={16} />
            Objective
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are a wealthy merchant of the Renaissance. Use your gem chips to acquire mines, trade routes, caravans, and artisans. The first player to reach{' '}
            <strong className="text-amber-300 font-bold">15 Prestige Points (VP)</strong> triggers the final round. After all players have had an equal number of turns, the player with the most prestige points wins! Tie-breaker goes to whoever purchased fewer cards.
          </p>
        </div>

        {/* 4 Available Actions */}
        <div className="space-y-4 mb-6">
          <h3 className="font-['Cinzel'] font-bold text-amber-200 text-sm tracking-wide uppercase border-b border-slate-800 pb-1">
            Every turn, choose ONE of 4 actions:
          </h3>

          {/* Action 1 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 h-fit">
              <Coins size={20} />
            </div>
            <div>
              <h4 className="font-['Cinzel'] font-bold text-slate-100 text-xs">
                1. Take 3 Different Gem Tokens
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Take 3 tokens of different colors from the bank (Ruby, Sapphire, Emerald, Diamond, Onyx). If fewer than 3 types remain, take 1 or 2 distinct tokens.
              </p>
            </div>
          </div>

          {/* Action 2 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 h-fit">
              <Coins size={20} />
            </div>
            <div>
              <h4 className="font-['Cinzel'] font-bold text-slate-100 text-xs">
                2. Take 2 Gem Tokens of the Same Color
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                You may only take 2 of the same gem color if there are <strong className="text-amber-300">at least 4 tokens</strong> of that color currently in the bank.
              </p>
            </div>
          </div>

          {/* Action 3 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 h-fit">
              <BookmarkCheck size={20} />
            </div>
            <div>
              <h4 className="font-['Cinzel'] font-bold text-slate-100 text-xs">
                3. Reserve 1 Development Card (+1 Gold Token)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Reserve any face-up card or draw blindly from the top of any Tier deck into your private hand (maximum 3 reserved cards). If gold is available in the bank, you immediately receive 1 Gold wildcard token!
              </p>
            </div>
          </div>

          {/* Action 4 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 h-fit">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-['Cinzel'] font-bold text-slate-100 text-xs">
                4. Purchase 1 Development Card
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Buy a card from the 12 face-up cards or from your reserved hand. Pay the required cost minus your permanent card gem bonuses. Any missing gems can be paid with Gold tokens! Purchased cards grant permanent discounts and Prestige Points.
              </p>
            </div>
          </div>
        </div>

        {/* Noble Patrons */}
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 mb-4">
          <h3 className="font-['Cinzel'] font-bold text-indigo-300 text-xs mb-1 flex items-center gap-1.5">
            <Shield size={16} />
            Noble Patrons
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            At the end of your turn, if you have accumulated enough development card bonuses to meet a Noble's requirements, that Noble visits you automatically, adding <strong className="text-amber-300">+3 Prestige Points</strong> to your score!
          </p>
        </div>

        {/* Token Limit */}
        <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-slate-400">
          ⚠️ <strong>Token Limit:</strong> You may not end your turn with more than 10 total tokens. If you exceed 10, you must choose which excess tokens to return to the bank.
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
