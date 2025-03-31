import Head from 'next/head';
import { useState, useEffect } from 'react';
import Leaderboard from '../components/Leaderboard';
import MatchPredictions from '../components/MatchPredictions';
import RecentGuesses from '../components/RecentGuesses';

export default function Home() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [data, setData] = useState({
    leaderboardData: [],
    upcomingMatches: [],
    recentGuesses: []
  });
  const [loading, setLoading] = useState(true);

useEffect(() => {
    async function fetchData() {
        try {
            const response = await fetch('/api/getData');
            const result = await response.json();
            setData(result);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 1000 * 60 * 5); // Refresh every 5 minutes
    
    return () => clearInterval(interval); // Cleanup interval on component unmount
}, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-600 to-blue-800 text-white flex items-center justify-center">
        <div className="relative text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20">
          <p className="text-2xl font-bold mt-3">Loading...</p>
          <p className="text-sm mt-2 text-blue-200">Pitching the latest cricket predictions</p>
          <div className="mt-4 flex justify-center space-x-1">
            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></span>
            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white overflow-hidden relative">
      <Head>
        <title>Air Bat N&apos; Ball 2025 | IPL Edition</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Cricket field decoration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full border-4 border-white/10"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full border-4 border-white/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-8 bg-white/10 rotate-90"></div>
        <div className="absolute top-1/4 right-10 w-8 h-16 bg-white/5 rounded-t-full"></div>
        <div className="absolute bottom-1/4 left-10 w-8 h-16 bg-white/5 rounded-t-full"></div>
      </div>
      
      <header className="text-center py-12 relative">
        <div className="relative inline-block">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 drop-shadow-lg pb-2">
            🏏 Air Bat N&apos; Ball 2025 🏏
          </h1>
          <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500"></div>
          <p className="text-xl mt-4 text-blue-200 font-semibold tracking-wider">IPL EDITION</p>
        </div>
        <div className="absolute -left-16 top-10 w-32 h-4 bg-green-600/20 transform rotate-45 animate-pulse"></div>
        <div className="absolute -right-16 top-20 w-32 h-4 bg-green-600/20 transform -rotate-45 animate-pulse"></div>
      </header>
      
      <main className="max-w-6xl mx-auto mb-5 px-4 z-10 relative">
        
        {/* Tabs with cricket bat hover effect */}
        <div className="flex flex-wrap space-x-2 md:space-x-6 mb-8 justify-center">
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 rounded-lg focus:outline-none transition-all duration-300 transform group relative overflow-hidden ${
              activeTab === 'leaderboard' 
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 font-bold shadow-lg scale-105' 
                : 'bg-white/10 hover:bg-white/20 hover:scale-105'
            }`}
          >
            <span className="relative z-10">Leaderboard</span>
            <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 transform transition-transform duration-300 ${
              activeTab === 'leaderboard' ? 'translate-x-0' : 'translate-x-full group-hover:-translate-x-0'
            }`} style={{opacity: '0.15'}}></div>
            <div className="absolute top-0 right-0 w-8 h-8 transform rotate-45 translate-x-2 -translate-y-2 bg-white/5"></div>
          </button>
          <button 
            onClick={() => setActiveTab('predictions')}
            className={`px-6 py-3 rounded-lg focus:outline-none transition-all duration-300 transform group relative overflow-hidden ${
              activeTab === 'predictions' 
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 font-bold shadow-lg scale-105' 
                : 'bg-white/10 hover:bg-white/20 hover:scale-105'
            }`}
          >
            <span className="relative z-10">Match Predictions</span>
            <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 transform transition-transform duration-300 ${
              activeTab === 'predictions' ? 'translate-x-0' : 'translate-x-full group-hover:-translate-x-0'
            }`} style={{opacity: '0.15'}}></div>
            <div className="absolute top-0 right-0 w-8 h-8 transform rotate-45 translate-x-2 -translate-y-2 bg-white/5"></div>
          </button>
        </div>
        
        {/* Content area with glass effect */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/20 transition-all duration-500">
          {/* Leaderboard and Recent Guesses */}
          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Leaderboard data={data.leaderboardData} />
              <RecentGuesses guesses={data.recentGuesses} />
            </div>
          )}
          
          {/* Match Predictions */}
          {activeTab === 'predictions' && (
            <div>
              <MatchPredictions upcomingMatches={data.upcomingMatches} />
            </div>
          )}
        </div>
      </main>
      
      {/* Cricket bat animation at bottom */}
      <div className="hidden md:block absolute bottom-4 left-4 w-32 h-6 bg-gradient-to-r from-yellow-800 to-yellow-600 rounded-t-full origin-bottom-left transform hover:rotate-45 transition-transform duration-300 shadow-lg">
        <div className="absolute bottom-0 left-0 w-6 h-20 bg-gradient-to-r from-yellow-900 to-yellow-700 rounded-t-lg"></div>
      </div>
    </div>
  );
}