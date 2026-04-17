import { useState, useEffect, useRef, useMemo } from 'react';

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
  const [searchQuery, setSearchQuery] = useState('');

  const allGuesses = useMemo(() => guesses.slice(0, 200), [guesses]);

  const list = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allGuesses.slice(0, 40);
    return allGuesses.filter(g =>
      g["Submitted By"].toLowerCase().includes(q)
    );
  }, [allGuesses, searchQuery]);

  // Flash items that are new since the last refresh
  const prevNewestRef   = useRef(null);
  const [flashThreshold, setFlashThreshold] = useState(null);

  useEffect(() => {
    const currentNewest = allGuesses[0]?.timestamp_dt ?? null;
    if (prevNewestRef.current !== null && currentNewest && currentNewest !== prevNewestRef.current) {
      setFlashThreshold(prevNewestRef.current);
      const t = setTimeout(() => setFlashThreshold(null), 2500);
      prevNewestRef.current = currentNewest;
      return () => clearTimeout(t);
    }
    prevNewestRef.current = currentNewest;
  }, [allGuesses]);

  const isFiltering = searchQuery.trim().length > 0;

  return (
    <div className="bg-surface border border-stroke rounded-2xl overflow-hidden flex flex-col h-[680px]">

      {/* Header */}
      <div className="px-5 py-4 border-b border-stroke flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold">Recent Guesses</h2>
          <p className="text-[10px] text-muted mt-0.5">
            {isFiltering ? `${list.length} guess${list.length !== 1 ? 'es' : ''} by "${searchQuery.trim()}"` : 'Open matches · latest predictions'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-stroke flex-shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter by player name…"
          className="w-full bg-raised border border-stroke rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/50 transition-colors"
        />
      </div>

      {/* Feed */}
      <div className="divide-y divide-stroke overflow-y-auto flex-1">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            {isFiltering ? 'No guesses found for this player' : 'No predictions yet'}
          </p>
        ) : (
          list.map((guess, idx) => {
            const team  = guess["Who will win the match today ? "].trim();
            const color = teamColor(team);
            const label = matchLabel(guess["Match"] || '');
            const time  = formatTime(guess.timestamp_dt);
            const isNew = flashThreshold && guess.timestamp_dt > flashThreshold;

            return (
              <div
                key={idx}
                className={`px-5 py-3 flex items-center gap-3 hover:bg-raised transition-colors ${isNew ? 'animate-flashNew' : ''}`}
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap leading-snug">
                    <span className="text-sm font-bold text-slate-200">{guess["Submitted By"]}</span>
                    <span className="text-xs text-faint">picked</span>
                    <span
                      className="text-[10px] font-bold w-10 py-0.5 rounded text-center inline-block"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      {team}
                    </span>
                    <span className="text-xs text-faint">for</span>
                    <span className="text-xs text-muted">{label}</span>
                  </div>
                </div>
                <span className="text-[10px] text-faint flex-shrink-0 whitespace-nowrap">{time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
