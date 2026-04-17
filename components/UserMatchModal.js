import { useEffect } from 'react';

const TEAM_COLORS = {
  MI:   '#1375BB', CSK: '#F0C30F', RCB: '#D41E26', KKR: '#8A63B4',
  DC:   '#4B7BC3', RR:  '#FF2D8B', SRH: '#F26522', PBKS: '#E03A3E',
  GT:   '#B5975A', LSG: '#BE3250',
};
function teamColor(name) {
  const key = Object.keys(TEAM_COLORS).find(k => name?.includes(k));
  return key ? TEAM_COLORS[key] : '#6366F1';
}

function matchLabel(matchStr) {
  if (!matchStr) return '';
  if (matchStr.includes(' - ')) {
    const [date, teams] = matchStr.split(' - ');
    return { date: date.trim(), teams: teams.trim() };
  }
  const after = matchStr.split(':')[1] || matchStr;
  return { date: null, teams: after.split(',')[0].trim() };
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export default function UserMatchModal({ isOpen, onClose, user, allGuesses, rank, score }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  // Only show guesses for decided matches
  const decidedGuesses = allGuesses.filter(g => g.result !== 'pending');
  const correct = decidedGuesses.filter(g => g.result === 'correct').length;
  const wrong   = decidedGuesses.filter(g => g.result === 'wrong').length;

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
          <div>
            <p className="text-sm font-semibold text-slate-50">{user}</p>
            <p className="text-[10px] text-muted mt-0.5">Rank #{rank} · {score} pts</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-raised flex items-center justify-center text-muted hover:text-slate-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Summary pills */}
        <div className="px-5 py-3 border-b border-stroke flex items-center gap-2">
          <span className="text-[10px] font-semibold text-leaf bg-leaf/10 border border-leaf/20 rounded-full px-2 py-0.5">
            ✓ {correct} correct
          </span>
          {wrong > 0 && (
            <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5">
              ✗ {wrong} wrong
            </span>
          )}
        </div>

        {/* Guess list — decided matches only */}
        <div className="max-h-80 overflow-y-auto">
          {decidedGuesses.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No results in yet</p>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {decidedGuesses.map((guess, idx) => {
                  const { teams } = matchLabel(guess.match);
                  const color = teamColor(guess.team);
                  const isLast = idx === decidedGuesses.length - 1;
                  const borderCls = isLast ? '' : 'border-b border-stroke';
                  return (
                    <tr key={idx}>
                      <td className={`pl-5 pr-1 py-2.5 text-xs text-muted whitespace-nowrap ${borderCls}`}>
                        Guessed
                      </td>
                      <td className={`px-1 py-2.5 whitespace-nowrap ${borderCls}`}>
                        <span
                          className="text-[10px] font-bold w-10 py-0.5 rounded text-center inline-block"
                          style={{ backgroundColor: `${color}22`, color }}
                        >
                          {guess.team}
                        </span>
                      </td>
                      <td className={`px-1 py-2.5 text-xs text-muted whitespace-nowrap ${borderCls}`}>
                        for
                      </td>
                      <td className={`px-1 py-2.5 text-sm font-medium text-slate-200 whitespace-nowrap ${borderCls}`}>
                        {teams}
                      </td>
                      <td className={borderCls} style={{ width: '100%' }} />
                      <td className={`pl-2 pr-5 py-2.5 text-right whitespace-nowrap ${borderCls}`}>
                        {guess.result === 'correct' && <span className="text-leaf text-sm font-bold">✓</span>}
                        {guess.result === 'wrong'   && <span className="text-red-400 text-sm font-bold">✗</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
