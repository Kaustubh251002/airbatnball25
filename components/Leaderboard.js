import { useState, useEffect, useMemo } from 'react';
import UserMatchModal from './UserMatchModal';

const RANK_META = {
  0: { color: '#F5C542', textColor: 'text-gold',   badgeBg: 'bg-gold',   badgeText: 'text-app', glow: 'rgba(245,197,66,0.07)'  },
  1: { color: '#9EB2C8', textColor: 'text-silver', badgeBg: 'bg-silver', badgeText: 'text-app', glow: 'rgba(158,178,200,0.06)' },
  2: { color: '#C87941', textColor: 'text-bronze', badgeBg: 'bg-bronze', badgeText: 'text-app', glow: 'rgba(200,121,65,0.06)'  },
};

/** Counts up from 0 → target over `duration` ms */
function useCountUp(target, duration = 600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = null;
    let rafId;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.round(p * target));
      if (p < 1) rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

export default function Leaderboard({ data }) {
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return data
      .map((item, i) => ({ ...item, rank: i }))
      .filter(item => item.user.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, data]);

  const top3 = data.slice(0, 3).map((item, i) => ({ ...item, rank: i }));
  const rest = data.slice(3).map((item, i) => ({ ...item, rank: i + 3 }));

  // Find the player with the highest active streak
  const topStreaker = data.length > 0
    ? data.reduce((best, e) => (e.streak || 0) > (best?.streak || 0) ? e : best, data[0])
    : null;
  const showStreakBanner = topStreaker && (topStreaker.streak || 0) >= 3;

  return (
    <div className="bg-surface border border-stroke rounded-2xl overflow-hidden flex flex-col h-[680px]">

      {/* Header */}
      <div className="px-5 py-4 border-b border-stroke flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold">Leaderboard</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{data.length} players</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-stroke flex-shrink-0">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search any player to see their rank…"
          className="w-full bg-raised border border-stroke rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/50 transition-colors"
        />
      </div>

      {/* Hot streak banner */}
      {showStreakBanner && !query && (
        <div className="px-5 py-2 border-b border-stroke bg-brand/5 flex items-center gap-2 flex-shrink-0">
          <span className="text-sm leading-none">🔥</span>
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-brand">{topStreaker.user.split(' ')[0]}</span>
            {' '}is on a{' '}
            <span className="font-semibold text-brand">{topStreaker.streak}-match</span>
            {' '}hot streak
          </p>
        </div>
      )}

      {/* Content */}
      <div className="overflow-y-auto flex-1">
        {searchResults !== null ? (
          searchResults.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No players found</p>
          ) : (
            <div className="divide-y divide-stroke">
              {searchResults.map(entry => (
                <LeaderboardRow key={entry.user} entry={entry} onSelect={setSelected} />
              ))}
            </div>
          )
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No results yet</p>
        ) : (
          <div className="divide-y divide-stroke">
            {[...top3, ...rest].map(entry => (
              <LeaderboardRow key={entry.user} entry={entry} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <UserMatchModal
          isOpen
          onClose={() => setSelected(null)}
          user={selected.user}
          allGuesses={selected.allGuesses || []}
          rank={selected.rank + 1}
          score={selected.correctGuesses}
        />
      )}
    </div>
  );
}

/* ── Shared row — used for all 10 entries ── */
function LeaderboardRow({ entry, onSelect }) {
  const meta     = RANK_META[entry.rank] ?? null;
  const accuracy = entry.decidedGuesses > 0
    ? Math.round(((entry.correctCount ?? entry.correctGuesses) / entry.decidedGuesses) * 100)
    : 0;
  const animScore = useCountUp(entry.correctGuesses);

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left px-5 py-2.5 flex items-center gap-3 hover:bg-raised transition-colors animate-slideInRow border-l-2"
      style={{
        borderLeftColor: meta ? meta.color : 'transparent',
        background: meta ? `linear-gradient(90deg, ${meta.glow} 0%, transparent 55%)` : undefined,
        animationDelay: `${entry.rank * 40}ms`,
      }}
    >
      {/* Rank badge — colored for top 3, plain number for rest */}
      {meta ? (
        <div className={`w-7 h-7 rounded-xl ${meta.badgeBg} ${meta.badgeText} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
          {entry.rank + 1}
        </div>
      ) : (
        <span className="w-7 text-xs text-slate-400 font-medium text-center flex-shrink-0 tabular-nums">
          {entry.rank + 1}
        </span>
      )}

      {/* Name + accuracy */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`text-sm font-bold truncate leading-none ${meta ? meta.textColor : 'text-slate-200'}`}>
            {entry.user}
          </p>
          {entry.streak >= 3 && (
            <span className="text-[10px] text-brand flex-shrink-0">🔥 {entry.streak}</span>
          )}
        </div>
        {accuracy > 0 && (
          <p className="text-[10px] mt-0.5" style={{ color: `hsl(${Math.round(accuracy * 1.2)}, 75%, 58%)` }}>{accuracy}% accuracy</p>
        )}
      </div>

      {/* Score + pts */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold tabular-nums leading-none ${meta ? meta.textColor : 'text-slate-300'}`}>
          {animScore}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">pts</p>
      </div>
    </button>
  );
}
