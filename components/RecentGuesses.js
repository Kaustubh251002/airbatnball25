import { useMemo } from 'react';

// Primary jersey colors — sourced from official IPL 2026 team cards
const TEAM_COLORS = {
  MI:   '#1375BB',
  CSK:  '#F0C30F',
  RCB:  '#D41E26',
  KKR:  '#8A63B4',
  DC:   '#4B7BC3',
  RR:   '#FF2D8B',
  SRH:  '#F26522',
  PBKS: '#E03A3E',
  GT:   '#B5975A',
  LSG:  '#BE3250',
};

function teamColor(team) {
  const key = Object.keys(TEAM_COLORS).find(k => team.includes(k));
  return key ? TEAM_COLORS[key] : '#64748B';
}

/** djb2-style hash → consistent HSL color per name */
function nameToColor(name) {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) + name.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 48)    return `${h}h ago`;
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function matchLabel(matchStr) {
  if (!matchStr) return '';
  const afterColon = matchStr.split(':')[1];
  if (!afterColon) return matchStr.split(':')[0].trim();
  return afterColon.split(',')[0].trim();
}

export default function RecentGuesses({ guesses }) {
  const list = useMemo(() => guesses.slice(0, 40), [guesses]);

  return (
    <div className="bg-surface border border-stroke rounded-2xl overflow-hidden flex flex-col h-[680px]">

      {/* Header */}
      <div className="px-5 py-4 border-b border-stroke flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold">Recent Guesses</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Latest valid predictions</p>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-stroke overflow-y-auto flex-1">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-600">No predictions yet</p>
        ) : (
          list.map((guess, idx) => {
            const team        = guess["Who will win the match today ? "].trim();
            const color       = teamColor(team);
            const label       = matchLabel(guess["Match"] || '');
            const time        = formatTime(guess.timestamp_dt);
            const avatarColor = nameToColor(guess["Submitted By"]);
            const result      = guess.result; // 'correct' | 'wrong' | 'pending'

            return (
              <div key={idx} className="px-5 py-3 flex items-center gap-3 hover:bg-raised transition-colors">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 select-none"
                  style={{ backgroundColor: avatarColor }}
                >
                  {guess["Submitted By"].charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap leading-snug">
                    <span className="text-sm font-medium text-slate-200">{guess["Submitted By"]}</span>
                    <span className="text-xs text-slate-600">picked</span>
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      {team}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                    {label} · {time}
                  </p>
                </div>

                {/* Result indicator */}
                {result === 'correct' && (
                  <span className="text-leaf text-sm font-bold flex-shrink-0" title="Correct">✓</span>
                )}
                {result === 'wrong' && (
                  <span className="text-red-400 text-sm font-bold flex-shrink-0" title="Wrong">✗</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
