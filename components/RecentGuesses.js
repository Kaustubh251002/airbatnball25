// components/RecentGuesses.js
import { useMemo, useState, useEffect } from 'react';

// Cricket-themed emojis and phrases
const emojis = ["🏏", "🎯", "🔥", "💯", "👏", "🤩", "🎊", "🚀", "🌟", "💪"];
const phrases = [
  "is backing",
  "predicts a win for",
  "believes in", 
  "is supporting",
  "has faith in",
  "is cheering for",
  "is rooting for",
  "has placed bets on",
  "thinks the trophy goes to",
  "sees victory for"
];

// IPL team colors for highlighting
const teamColors = {
  'MI': '#004BA0', // Mumbai Indians
  'CSK': '#FFFF3C', // Chennai Super Kings
  'RCB': '#EC1C24', // Royal Challengers Bangalore
  'KKR': '#3A225D', // Kolkata Knight Riders
  'DC': '#00008B', // Delhi Capitals
  'RR': '#254AA5', // Rajasthan Royals
  'SRH': '#F26522', // Sunrisers Hyderabad
  'KXIP': '#ED1F27', // Kings XI Punjab
  'GT': '#1C1C1B', // Gujarat Titans
  'LSG': '#A72056', // Lucknow Super Giants
};

export default function RecentGuesses({ guesses }) {
  const [animatedGuessIndex, setAnimatedGuessIndex] = useState(null);
  const [newGuess, setNewGuess] = useState(false);

  // Get a random phrase and emoji
  const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
  const getRandomPhrase = () => phrases[Math.floor(Math.random() * phrases.length)];
  
  // Determine team color based on team name
  const getTeamColor = (teamName) => {
    for (const [team, color] of Object.entries(teamColors)) {
      if (teamName.includes(team)) {
        return color;
      }
    }
    return '#4CAF50'; // Default color if no match
  };
  // Create dynamic phrases and emoji assignments for each guess
    const enhancedGuesses = useMemo(() => {
        return guesses.map(guess => {
            const now = new Date();
            const guessTime = new Date(guess.timestamp_dt);
            const timeAgo = Math.floor((now - guessTime) / (1000 * 60)); // Calculate minutes ago

            return {
                ...guess,
                emoji: getRandomEmoji(),
                phrase: getRandomPhrase(),
                teamColor: getTeamColor(guess["Who will win the match today ? "]),
                timeAgo: timeAgo >= 0 ? timeAgo : 0 // Ensure non-negative time
            };
        }).sort((a, b) => {
            return a.timeAgo - b.timeAgo;
        });
    }, [guesses]);

  
  
  return (
    <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg relative overflow-hidden">
      {/* Cricket decoration elements */}
      <div className="absolute -left-6 -top-6 w-12 h-12 border-8 border-blue-500/20 rounded-full"></div>
      <div className="absolute right-1/2 -bottom-3 transform translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      
      {/* Heading with live indicator */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          <span className="inline-block transform hover:rotate-12 transition-transform duration-200">🎯</span> 
          <span className="ml-2">Recent Predicitons</span>
        </h2>
        <div className="hidden md:flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          <span className="text-sm text-blue-200">Live Feed</span>
        </div>
      </div>
      
      {/* Guesses feed */}
      <div className="space-y-3 max-h-[47vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {enhancedGuesses.length === 0 ? (
          <div className="text-center py-8 text-blue-200">
            <div className="inline-block mb-4 relative">
              <div className="w-16 h-16 border-4 border-dashed rounded-full border-blue-300/50 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">🎯</div>
            </div>
            <p>Waiting for the first prediction</p>
          </div>
        ) : (
          enhancedGuesses.map((guess, idx) => {
            let matchDate = "Unknown Date";
            try {
              // Assumes the Match field format includes a comma-separated date
              matchDate = guess["Match"].split(",")[1].trim();
            } catch (e) {}
            
            return (
              <div 
                key={idx} 
                className={`bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-all duration-300 transform ${
                  animatedGuessIndex === idx ? 'scale-102 bg-white/15' : ''
                } ${idx === 0 && newGuess ? 'animate-pulse border-l-4 border-green-500' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-start space-x-3">
                    {/* User profile with first letter */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
                      {guess["Submitted By"].charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex flex-col">
                      {/* User and prediction */}
                      <div>
                        <span className="font-semibold text-white">{guess["Submitted By"]}</span>
                        <span className="text-blue-200 mx-1">{guess.phrase}</span>
                        <span 
                          className="font-bold"
                          style={{ color: guess.teamColor }}
                        >
                          {guess["Who will win the match today ? "]}
                        </span>
                      </div>
                      
                      {/* Match details */}
                      <div className="text-blue-200 mx-1 mt-1">
                        <span>on {guess["Match"].split(",").pop()}</span>
                      </div>
                      
                    </div>
                  </div>
                  
                  {/* Emoji with animated effect */}
                  <div className="text-2xl transform hover:scale-125 transition-transform cursor-pointer">
                    {guess.emoji}
                  </div>
                </div>
                
                {/* Cricket field decoration */}
                <div className="absolute bottom-0 right-0 w-12 h-6 bg-white/5 rounded-tl-full pointer-events-none"></div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer element */}
      <div className="flex items-center justify-center mt-6 text-xs text-blue-300">
        <div className="w-4 h-4 rounded-full border border-blue-300/50 mr-2 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-400/70"></div>
        </div>
        <span>Predictions update in every 10 minutes</span>
      </div>
    </div>
  );
}
