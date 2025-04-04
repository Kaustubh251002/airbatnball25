// components/MatchPredictions.js
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { useState } from 'react';
Chart.register(ArcElement, Tooltip, Legend);

export default function MatchPredictions({ upcomingMatches }) {
  const [hoveredMatch, setHoveredMatch] = useState(null);
  
  if (upcomingMatches.length === 0) {
    return (
      <div className="p-8 bg-white/10 backdrop-blur-sm rounded-xl text-center border border-white/20 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-l-red-500 border-b-transparent border-r-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-b-orange-400 border-r-orange-400 border-t-transparent border-l-transparent animate-spin animate-pulse"></div>
          </div>
        </div>
        <p className="text-xl font-semibold text-blue-200">No upcoming match predictions available</p>
        <p className="text-sm mt-2 text-blue-300">Check back during the IPL season!</p>
      </div>
    );
  }
  upcomingMatches.map(match => {
    const hoursLeft = Math.floor((new Date(match.start_time_iso) - new Date()) / (1000 * 60 * 60));
    let message = "";
    if (hoursLeft > 24) message = "Plenty of time to strategize!";
    else if (hoursLeft > 12) message = "Excitement is building up!";
    else if (hoursLeft > 6) message = "The match is just around the corner!";
    else message = "The heat is on!";
    match.hoursLeft = hoursLeft;
    match.message = message;
  });
  
  // IPL team colors
  const teamColors = {
    'MI': ['#004BA0', '#D1A128'], // Mumbai Indians (Blue, Gold)
    'CSK': ['#FFFF3C', '#1A5276'], // Chennai Super Kings (Yellow, Blue Camo)
    'RCB': ['#000000', '#EC1C24'], // Royal Challengers Bangalore (Black, Red)
    'KKR': ['#3A225D', '#FDB913'], // Kolkata Knight Riders (Purple, Yellow)
    'DC': ['#17449B', '#EF1B23'], // Delhi Capitals (Blue, Red)
    'RR': ['#FF1493', '#254AA5'], // Rajasthan Royals (Pink, Purple)
    'SRH': ['#F26522', '#000000'], // Sunrisers Hyderabad (Dark Orange, Black)
    'PBKS': ['#ED1F27', '#002147'], // Punjab Kings (Dark Orange, Dark Blue)
    'GT': ['#1C1C1B', '#B4975A'], // Gujarat Titans (Dark Navy, Gold)
    'LSG': ['#004AAD', '#FF5722'], // Lucknow Super Giants (Blue, Orange)
    'default': ['#FFD700', '#4CAF50', '#2196F3', '#FF5733']
  };
  
  // Function to determine team colors based on team names
  const getTeamColors = (teamName) => {
    for (const [team, colors] of Object.entries(teamColors)) {
      if (teamName== team) {
        return colors;
      }
    }
    return teamColors.default;
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
        IPL Match Predictions
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        
        {upcomingMatches.map((match, idx) => {
          const labels = Object.keys(match.percentages);
          const dataValues = Object.values(match.percentages).map(Number);
          
          // Determine colors based on team names
          const teamNames = match.Teams.split(' vs ');
          const matchColors = [
            ...getTeamColors(teamNames[0]),
            ...getTeamColors(teamNames[1])
          ];
          
          const data = {
            labels,
            datasets: [{
              data: dataValues,
              backgroundColor: matchColors,
              borderColor: 'rgba(255,255,255,0.2)',
              borderWidth: 2,
              hoverBackgroundColor: matchColors.map(color => color.replace(')', ', 0.8)').replace('rgb', 'rgba')),
              hoverBorderColor: 'white',
              hoverBorderWidth: 3,
              hoverOffset: 6
            }]
          };
          
          // Determine how soon the match is
          const isImminent = match.hoursLeft < 24;
          
          return (
            <div 
              key={idx} 
              className="relative bg-white/10 backdrop-blur-sm p-6 rounded-xl hover:scale-105 transition-all duration-300 transform shadow-lg border border-white/20 overflow-hidden group"
              onMouseEnter={() => setHoveredMatch(idx)}
              onMouseLeave={() => setHoveredMatch(null)}
            >
              {/* Stadium overlay decoration */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/30 transform -translate-y-1/2"></div>
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/30 transform -translate-x-1/2"></div>
                <div className="absolute inset-0 border-2 border-white/20 rounded-full transform scale-75"></div>
              </div>
              
              {/* Match name with team emphasis */}
              <div className="text-center mb-4 relative">
                <h3 className="font-bold text-xl">
                  <span className={`text-${matchColors[0].replace('#', '')}`}>{teamNames[0]}</span>
                  <span className="px-2 text-blue-200">vs</span>
                  <span className={`text-${matchColors[2].replace('#', '')}`}>{teamNames[1]}</span>
                </h3>
                
                {/* Animated cricket bat for imminent matches */}
                {isImminent && (
                  <div className="absolute -right-1 -top-1 transform rotate-45 animate-pulse">
                    <div className="w-6 h-1 bg-yellow-500 rounded-full"></div>
                    <div className="w-1 h-4 bg-yellow-700 rounded-full ml-1"></div>
                  </div>
                )}
              </div>
              
              {/* Chart with enhanced styling */}
              <div className="relative h-48 group-hover:scale-105 transition-transform duration-300">
                <Pie data={data} options={{
                  plugins: {
                    legend: { 
                      labels: { 
                        color: 'rgb(226, 232, 240)',
                        font: {
                          weight: 'bold'
                        }
                      },
                      position: 'bottom'
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 50, 0.8)',
                      titleFont: {
                        size: 16,
                        weight: 'bold'
                      },
                      bodyFont: {
                        size: 14
                      },
                      padding: 12,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1
                    }
                  },
                  animation: {
                    animateRotate: true,
                    animateScale: hoveredMatch === idx
                  },
                  maintainAspectRatio: false
                }} />
              </div>
              
              {/* Match timing with countdown effect */}
              <div className="text-center mt-4">
                <p className={`${
                  match.hoursLeft < 6 
                    ? 'text-orange-400 animate-pulse font-bold' 
                    : match.hoursLeft < 24 
                      ? 'text-yellow-300 font-medium' 
                      : 'text-blue-200'
                }`}>
                  {match.hoursLeft < 1 
                    ? 'Starting now!' 
                    : match.hoursLeft < 6 
                      ? `Starting soon: ${match.hoursLeft} ${match.hoursLeft === 1 ? 'hour' : 'hours'} left` 
                      : `Starts in ${match.hoursLeft} hours`
                  }
                </p>
                
                <p className="mt-2 text-sm text-blue-300 italic">{match.message}</p>
              </div>
              
              {/* Ball animation for hovered items */}
              <div className={`absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-red-600 transform transition-all duration-500 opacity-0 ${
                hoveredMatch === idx ? 'translate-x-0 translate-y-0 opacity-100' : 'translate-x-4 translate-y-4'
              }`}></div>
            </div>
          );
        })}
      </div>
      
      {/* Cricket themed footer */}
      <div className="text-center mt-8 text-sm text-blue-300 flex items-center justify-center">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent mr-3"></div>
        <p>Predictions based on team performance and player statistics</p>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent ml-3"></div>
      </div>
    </div>
  );
}