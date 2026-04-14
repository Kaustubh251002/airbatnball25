import { useState, useEffect, useMemo } from 'react';
import UserMatchModal from './UserMatchModal';

const RANK_META = {
  0: { color: '#F5C542', textColor: 'text-gold',   badgeBg: 'bg-gold',   badgeText: 'text-app', sublabel: 'Champion',    glow: 'rgba(245,197,66,0.08)'  },
  1: { color: '#9EB2C8', textColor: 'text-silver', badgeBg: 'bg-silver', badgeText: 'text-app', sublabel: 'Runner-up',   glow: 'rgba(158,178,200,0.07)' },
  2: { color: '#C87941', textColor: 'text-bronze', badgeBg: 'bg-bronze', badgeText: 'text-app', sublabel: 'Third Place', glow: 'rgba(200,121,65,0.07)'  },
};

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

  const topScore = data[0]?.correctGuesses || 1;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return data
      .map((item, i) => ({ ...item, rank: i }))
      .filter(item => item.user.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, data]);

  const top3 = data.slice(0, 3).map((item, i) => ({ ...item, rank: i }));
  const rest = data.slice(3, 10).map((item, i) => ({ ...item, rank: i + 3 }));

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
          <p className="text-[10px] text-slate-500 mt-0.5">{data.length} players · top 10 shown</p>
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
            <p className="py-10 text-center text-sm text-slate-600">No players found</p>
          ) : (
            <div className="divide-y divide-stroke">
              {searchResults.map(entry => (
                <ListRow key={entry.user} entry={entry} topScore={topScore} onSelect={setSelected} />
              ))}
            </div>
          )
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-600">No results yet</p>
        ) : (
          <>
            <div className="divide-y divide-stroke border-b border-stroke">
              {top3.map(entry => (
                <PodiumRow key={entry.user} entry={entry} onSelect={setSelected} />
              ))}
            </div>
            {rest.length > 0 && (
              <div className="divide-y divide-stroke">
                {rest.map(entry => (
                  <ListRow key={entry.user} entry={entry} topScore={topScore} onSelect={setSelected} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <UserMatchModal
          isOpen
          onClose={() => setSelected(null)}
          user={selected.user}
          matches={selected.matches}
          rank={selected.rank + 1}
          score={selected.correctGuesses}
        />
      )}
    </div>
  );
}

/* ── Podium row — top 3 ── */
function PodiumRow({ entry, onSelect }) {
  const meta        = RANK_META[entry.rank];
  const isChampion  = entry.rank === 0;
  const avatarColor = nameToColor(entry.user);
  const accuracy    = entry.totalGuesses > 0
    ? Math.round(((entry.correctCount ?? entry.correctGuesses) / (entry.decidedGuesses ?? entry.totalGuesses)) * 100)
    : 0;
  const animScore   = useCountUp(entry.correctGuesses);

  return (
    <button
      onClick={() => onSelect(entry)}
      className={`w-full text-left flex items-center gap-3 hover:brightness-110 transition-all border-l-2 animate-slideInRow ${
        isChampion ? 'px-5 py-4' : 'px-5 py-3'
      }`}
      style={{
        borderLeftColor: meta.color,
        background: `linear-gradient(90deg, ${meta.glow} 0%, transparent 55%)`,
        animationDelay: `${entry.rank * 40}ms`,
      }}
    >
      {/* Rank badge */}
      <div
        className={`rounded-xl ${meta.badgeBg} ${meta.badgeText} flex items-center justify-center font-bold flex-shrink-0 ${
          isChampion ? 'w-9 h-9 text-base' : 'w-7 h-7 text-sm'
        }`}
      >
        {entry.rank + 1}
      </div>

      {/* Avatar */}
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none ${
          isChampion ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
        }`}
        style={{ backgroundColor: avatarColor }}
      >
        {entry.user.charAt(0).toUpperCase()}
      </div>

      {/* Name + sublabel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`font-bold truncate ${meta.textColor} ${isChampion ? 'text-base' : 'text-sm'}`}>
            {entry.user}
          </p>
          {entry.streak >= 3 && (
            <span className="text-[10px] font-semibold text-brand bg-brand/10 border border-brand/20 rounded-full px-1.5 py-0.5 flex-shrink-0">
              🔥 {entry.streak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px] text-slate-500">{meta.sublabel}</p>
          {accuracy > 0 && (
            <span className="text-[10px] text-slate-600">· {accuracy}% acc</span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p className={`font-bold tabular-nums leading-none ${meta.textColor} ${isChampion ? 'text-2xl' : 'text-lg'}`}>
          {animScore}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">pts</p>
      </div>
    </button>
  );
}

/* ── Compact list row (#4–10 / search results) ── */
function ListRow({ entry, topScore, onSelect }) {
  const avatarColor = nameToColor(entry.user);
  const accuracy    = entry.totalGuesses > 0
    ? Math.round(((entry.correctCount ?? entry.correctGuesses) / (entry.decidedGuesses ?? entry.totalGuesses)) * 100)
    : 0;
  const animBar     = useCountUp(topScore > 0 ? (entry.correctGuesses / topScore) * 100 : 0);
  const animScore   = useCountUp(entry.correctGuesses);

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left px-5 py-2.5 flex items-center gap-3 hover:bg-raised transition-colors animate-slideInRow"
      style={{ animationDelay: `${entry.rank * 40}ms` }}
    >
      <span className="w-5 text-xs text-slate-600 font-medium text-right flex-shrink-0 tabular-nums">
        {entry.rank + 1}
      </span>

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 select-none"
        style={{ backgroundColor: avatarColor }}
      >
        {entry.user.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm text-slate-300 truncate leading-none">{entry.user}</p>
          {entry.streak >= 3 && (
            <span className="text-[10px] text-brand flex-shrink-0">🔥{entry.streak}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-stroke rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-none"
              style={{ width: `${animBar}%`, background: 'rgba(255,107,53,0.45)' }}
            />
          </div>
          {accuracy > 0 && (
            <span className="text-[10px] text-slate-600 flex-shrink-0">{accuracy}%</span>
          )}
        </div>
      </div>

      <span className="text-sm font-bold text-slate-300 tabular-nums flex-shrink-0">{animScore}</span>
    </button>
  );
}
