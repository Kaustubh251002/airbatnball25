import { useEffect } from 'react';

export default function UserMatchModal({ isOpen, onClose, user, matches, rank, score }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-stroke rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stroke flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center text-sm font-bold text-brand select-none">
              {user.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">{user}</p>
              <p className="text-[10px] text-slate-500">Rank #{rank} · {score} pts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-raised flex items-center justify-center text-slate-500 hover:text-slate-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Matches */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No correct predictions yet</p>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 pb-1">
                Correct Predictions — {matches.length}
              </p>
              {matches.map((match, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 py-2 px-3 bg-leaf/5 border border-leaf/15 rounded-lg"
                >
                  <span className="text-leaf text-xs flex-shrink-0">✓</span>
                  <span className="text-sm text-slate-300">{match}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
