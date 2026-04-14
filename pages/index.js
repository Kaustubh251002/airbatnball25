import Head from 'next/head';
import { useState, useEffect, useRef, useMemo } from 'react';
import Leaderboard from '../components/Leaderboard';
import MatchPredictions from '../components/MatchPredictions';
import RecentGuesses from '../components/RecentGuesses';

/** Counts up from 0 → target over `duration` ms */
function useCountUp(target, duration = 700) {
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

export default function Home() {
  const [data, setData] = useState({
    leaderboardData: [],
    upcomingMatches: [],
    recentGuesses: [],
    scheduleData: [],
  });
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lightMode, setLightMode]     = useState(false);
  const [activeTab, setActiveTab]     = useState('rankings');

  const rankingsRef = useRef(null);
  const feedRef     = useRef(null);
  const matchesRef  = useRef(null);

  // Persist light mode
  useEffect(() => {
    const stored = localStorage.getItem('lightMode');
    if (stored === 'true') {
      setLightMode(true);
      document.documentElement.classList.add('light');
    }
  }, []);

  function toggleLight() {
    setLightMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('light');
        localStorage.setItem('lightMode', 'true');
      } else {
        document.documentElement.classList.remove('light');
        localStorage.setItem('lightMode', 'false');
      }
      return next;
    });
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/getData');
        const result = await res.json();
        setData(result);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  const totalPlayers  = data.leaderboardData.length;
  const totalGuesses  = data.recentGuesses.length;
  const totalMatches  = data.scheduleData?.length ?? 0;
  const matchesDone   = data.scheduleData?.filter(m => m.Winner && m.Winner !== 'TBD').length ?? 0;
  const seasonPct     = totalMatches > 0 ? Math.round((matchesDone / totalMatches) * 100) : 0;

  // Next upcoming match (soonest)
  const nextMatch = useMemo(() => {
    if (!data.upcomingMatches.length) return null;
    return [...data.upcomingMatches].sort(
      (a, b) => new Date(a.start_time_iso) - new Date(b.start_time_iso)
    )[0];
  }, [data.upcomingMatches]);

  const nextMatchHours = nextMatch
    ? Math.max(0, Math.floor((new Date(nextMatch.start_time_iso) - Date.now()) / 3600000))
    : 0;

  function scrollToTab(tab) {
    setActiveTab(tab);
    const refMap = { rankings: rankingsRef, feed: feedRef, matches: matchesRef };
    refMap[tab]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading predictions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-slate-50 pb-20 lg:pb-0">
      <Head>
        <title>Air Bat N&apos; Ball | IPL Predictions</title>
        <meta name="description" content="IPL 2026 match prediction leaderboard" />
      </Head>

      {/* ── Ambient top glow ─────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 120% 35% at 50% -5%, var(--c-glow) 0%, transparent 70%)' }}
      />

      {/* ── Top accent line ───────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />

      {/* ── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-app/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-base select-none">
              🏏
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold tracking-tight">Air Bat N&apos; Ball</p>
              <p className="text-[10px] text-slate-500 mt-0.5">IPL 2026 · Prediction League</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Light mode toggle */}
            <button
              onClick={toggleLight}
              className="w-8 h-8 rounded-lg bg-surface border border-stroke flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors text-sm"
              title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {lightMode ? '🌙' : '☀️'}
            </button>
            <div className="flex items-center gap-1.5 bg-leaf/10 border border-leaf/20 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
              <span className="text-[10px] font-semibold text-leaf tracking-wide">LIVE</span>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-stroke to-transparent" />
      </header>

      {/* ── Next match banner ────────────────────────── */}
      {nextMatch && (
        <div className="sticky top-14 z-30 bg-app/95 backdrop-blur-sm border-b border-stroke">
          <div className="max-w-5xl mx-auto px-4 h-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] uppercase tracking-widest text-slate-600">Next Up</span>
              <span className="text-xs font-semibold text-slate-200">{nextMatch.Teams}</span>
            </div>
            <span className={`text-[10px] font-medium ${nextMatchHours < 2 ? 'text-brand' : 'text-slate-500'}`}>
              {nextMatchHours < 1 ? 'Starting soon' : `${nextMatchHours}h away`}
            </span>
          </div>
        </div>
      )}

      <main className="relative max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stats strip ─────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={totalPlayers} label="Players"     numColor="text-brand"     topColor="#FF6B35" />
          <StatCard value={totalGuesses} label="Predictions" numColor="text-indigo-400" topColor="#818CF8" />
          <StatCard value={matchesDone}  label="Results In"  numColor="text-leaf"      topColor="#22C55E" />
        </div>

        {/* ── Season progress bar ─────────────────────── */}
        {totalMatches > 0 && (
          <div className="bg-surface border border-stroke rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Season Progress</span>
              <span className="text-[10px] font-semibold text-slate-400">{matchesDone} / {totalMatches} matches</span>
            </div>
            <div className="h-1.5 bg-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${seasonPct}%`,
                  background: 'linear-gradient(90deg, #FF6B35 0%, #F5C542 100%)',
                }}
              />
            </div>
            <p className="text-[10px] text-slate-600 text-right">{seasonPct}% complete</p>
          </div>
        )}

        {/* ── Leaderboard + Feed ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div ref={rankingsRef} id="tab-rankings">
            <Leaderboard data={data.leaderboardData} />
          </div>
          <div ref={feedRef} id="tab-feed">
            <RecentGuesses guesses={data.recentGuesses} />
          </div>
        </div>

        {/* ── Upcoming Matches ────────────────────────── */}
        <section ref={matchesRef} id="tab-matches">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Upcoming Matches</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Community vote split</p>
          </div>
          <MatchPredictions upcomingMatches={data.upcomingMatches} />
        </section>

      </main>

      <footer className="relative border-t border-stroke mt-8 py-5 text-center">
        <p className="text-xs text-slate-600">
          Refreshes every 5 min
          {lastUpdated && ` · Last updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </footer>

      {/* ── Mobile bottom tab bar ─────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-stroke">
        <div className="grid grid-cols-3 h-14">
          {[
            { id: 'rankings', icon: '🏆', label: 'Rankings' },
            { id: 'feed',     icon: '📋', label: 'Feed'     },
            { id: 'matches',  icon: '🏏', label: 'Matches'  },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollToTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                activeTab === tab.id ? 'text-brand' : 'text-slate-500'
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function StatCard({ value, label, numColor = 'text-slate-50', topColor }) {
  const animValue = useCountUp(value);
  return (
    <div
      className="bg-surface border border-stroke rounded-xl px-4 py-3 text-center relative overflow-hidden"
      style={topColor ? { borderTop: `2px solid ${topColor}40` } : {}}
    >
      {topColor && (
        <div
          className="absolute inset-x-0 top-0 h-10 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 100% at 50% -20%, ${topColor}14 0%, transparent 70%)` }}
        />
      )}
      <p className={`text-xl font-bold relative ${numColor}`}>{animValue}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5 relative">{label}</p>
    </div>
  );
}
