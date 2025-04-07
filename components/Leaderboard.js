// components/Leaderboard.js
import { useState, useEffect, useMemo } from 'react';
import UserMatchModal from './UserMatchModal';

import Fuse from 'fuse.js';

export default function Leaderboard({ data }) {
  const [highlightedUser, setHighlightedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const openModal = (entry) => {
    setSelectedUser(entry);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setShowModal(false);
  };

  // Configure Fuse.js with options for fuzzy matching
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys: ['user'],
      threshold: 0.3, // Adjust sensitivity as needed
    });
  }, [data]);

  // Filtered results based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    const result = fuse.search(searchQuery);
    return result.map(res => res.item);
  }, [searchQuery, data, fuse]);

  // Add animation effect to highlight top performers
  useEffect(() => {
    if (data.length > 0) {
      const interval = setInterval(() => {
        const randomTopUser = Math.floor(Math.random() * Math.min(3, data.length));
        setHighlightedUser(randomTopUser);
        setTimeout(() => setHighlightedUser(null), 1000);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [data]);

  // Background gradient for top 3
  const getGradient = (position) => {
    switch(position) {
      case 0: return 'from-yellow-300 to-yellow-600'; // Gold
      case 1: return 'from-gray-300 to-gray-500'; // Silver
      case 2: return 'from-amber-600 to-amber-800'; // Bronze
      default: return '';
    }
  };

  return (
    <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg relative overflow-hidden">
      {/* Cricket decoration elements */}
      <div className="absolute -right-6 -top-6 w-12 h-12 border-8 border-yellow-500/20 rounded-full"></div>
      <div className="absolute left-1/2 -bottom-3 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      
      {/* Trophy and title with animate-on-appear effect */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          <span className="inline-block transform hover:scale-110 transition-transform duration-200">🏆</span> 
          <span className="ml-2">IPL Prediction Masters</span>
        </h2>
        <div className="hidden md:flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          <span className="text-sm text-blue-200">Live Rankings</span>
        </div>
      </div>
      
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full p-2 rounded-lg bg-white/10 text-white placeholder-blue-200 border border-white/20 focus:outline-none focus:border-blue-300"
        />
      </div>

      {/* Scrollable leaderboard with enhanced styling */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-blue-200">
            <div className="inline-block mb-4 relative">
              <div className="w-16 h-16 border-4 border-dashed rounded-full border-blue-300/50 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">🏏</div>
            </div>
            <p>Match Results yet to be declared!</p>
          </div>
        ) : (
          filteredData.map((entry, idx) => (
            <div 
              key={entry.user}
              onClick={() => openModal(entry)} 
              className={`cursor-pointer hover:scale-102 hover:shadow-md transform flex justify-between items-center p-4 rounded-lg transition-all duration-300 relative overflow-hidden ${
                idx < 3 
                  ? 'hover:scale-102 transform' 
                  : 'bg-white/5 hover:bg-white/10'
              } ${highlightedUser === idx ? 'animate-pulse' : ''}`}
              style={{
                backgroundImage: idx < 3 ? `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` : '',
                borderLeft: idx < 3 ? '3px solid' : '',
                borderLeftColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'transparent'
              }}
            >
              {/* Position indicator with medal for top 3 */}
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  idx < 3 
                    ? `bg-gradient-to-br ${getGradient(idx)} text-white font-bold shadow-lg` 
                    : 'bg-white/10 text-blue-100'
                }`}>
                  {idx < 3 ? (
                    <span className="text-lg">{["🥇", "🥈", "🥉"][idx]}</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                
                {/* Username with special styling for top performers */}
                <div className="flex flex-col">
                  <span className={`font-semibold ${
                    idx === 0 ? 'text-yellow-300' : 
                    idx === 1 ? 'text-gray-300' : 
                    idx === 2 ? 'text-amber-600' : 'text-white'
                  }`}>
                    {entry.user}
                  </span>
                  
                  {idx < 3 && (
                    <span className="text-xs text-blue-300">
                      {idx === 0 ? "Prediction Genius" : idx === 1 ? "Cricket Oracle" : "IPL Expert"}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Score with cricket ball icon */}
              <div className="flex items-center space-x-2">
                <div className={`py-1 px-3 rounded-full ${
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-300' : 
                  idx === 1 ? 'bg-gray-400/20 text-white-200' : 
                  idx === 2 ? 'bg-amber-500/20 text-amber-300' : 
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-700 mr-2"></span>
                    <span>{entry.correctGuesses} {entry.correctGuesses === 1 ? 'Prediction' : 'Predictions'}</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative cricket bat for top 3 */}
              {idx < 3 && (
                <div className="absolute -right-3 -bottom-6 w-10 h-16 rotate-45 opacity-10">
                  <div className="w-full h-3/4 bg-yellow-600 rounded-t-sm"></div>
                  <div className="w-1/2 h-1/4 mx-auto bg-yellow-800 rounded-b-sm"></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedUser && (
        <UserMatchModal 
          isOpen={showModal}
          onClose={closeModal}
          user={selectedUser.user}
          matches={selectedUser.matches}
        />
      )}
      
      {/* Bottom decoration element */}
      <div className="flex items-center justify-center mt-6 text-xs text-blue-300">
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 border-t-2 border-l-2 border-blue-400/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            🏏
          </div>
        </div>
        <span className="ml-2">Updated every 10 minutes</span>
      </div>
    </div>
  );
}
