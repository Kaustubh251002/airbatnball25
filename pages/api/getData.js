import { getSheetRecords } from '../../lib/gsheet';

export default async function handler(req, res) {
  const scheduleSheetKey = process.env.SCHEDULE_SHEET_KEY;
  const responsesSheetKey = process.env.RESPONSES_SHEET_KEY;
  
  let scheduleRecords = [];
  let responsesRecords = [];
  try {
    scheduleRecords = await getSheetRecords(scheduleSheetKey, "Schedule for filtering!A:G");
    responsesRecords = await getSheetRecords(responsesSheetKey, "Form Responses!A:D");
  } catch (error) {
    console.error("Error fetching sheets:", error);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
  
  // Process schedule data
  const scheduleData = scheduleRecords.map(record => {
    const start_time = parseSchedule(record);
    const start_time_iso = start_time ? start_time.toISOString() : null;
    return { ...record, start_time_iso, matchId: record["Match ID"] || extractMatchId(record["Match"]) };
  });
  
  // Create a map for easier lookup by Match ID
  const scheduleMap = {};
  scheduleData.forEach(record => {
    scheduleMap[record.matchId] = record;
  });
  
  // Process responses data
  const responsesData = responsesRecords.map(record => {
    const timestamp_dt = parseResponseTimestamp(record["Timestamp"])?.toISOString() || null;
    const match = record["Which match are you predicting for?"]
    const matchId = extractMatchId(record["Which match are you predicting for?"]);
    return { ...record, timestamp_dt, "Match ID": matchId, "Match": match};
  });
  
  // Mark valid guesses
  const responsesWithValidity = responsesData.map(resp => ({
    ...resp,
    valid_guess: isValidGuess(resp, scheduleMap)
  }));
  
  // Compute leaderboard: count correct guesses for matches where Winner != "TBD"
  const leaderboard = {};
  scheduleData.forEach(match => {
    if (match["Winner"] && match["Winner"] !== "TBD") {
      const matchId = match["Match ID"];
      const winner = match["Winner"];
      responsesWithValidity.forEach(resp => {
        if (resp["Match ID"] === matchId && resp.valid_guess) {
          if (resp["Who will win the match today ? "].trim() === winner.trim()) {
            const user = resp["Submitted By"].trim();
            leaderboard[user] = (leaderboard[user] || 0) + 1;
          }
        }
      });
    }
  });
  
  // Prepare leaderboardData as sorted array (top 10)
  const leaderboardData = Object.entries(leaderboard)
    .map(([user, correctGuesses]) => ({ user, correctGuesses }))
    .sort((a, b) => b.correctGuesses - a.correctGuesses)
    .slice(0, 10);
  
  // Upcoming matches: Winner === "TBD" and start_time > now
  const now = new Date();
const upcomingMatches = scheduleData.filter(match =>
    match["Winner"] === "TBD" && 
    match.start_time_iso && 
    new Date(match.start_time_iso) > now
).map(match => {
    // Get valid responses for the match
    const matchResponses = responsesWithValidity.filter(resp =>
        resp["Match ID"] === match.matchId && resp.valid_guess
    );
    
    // Skip matches with no valid guesses
    if (matchResponses.length === 0) return null;

    // Compute team votes percentages
    const voteCounts = {};
    matchResponses.forEach(resp => {
        const team = resp["Who will win the match today ? "].trim();
        voteCounts[team] = (voteCounts[team] || 0) + 1;
    });
    const total = Object.values(voteCounts).reduce((a, b) => a + b, 0);
    const percentages = Object.fromEntries(
        Object.entries(voteCounts).map(([team, count]) => [team, ((count / total) * 100).toFixed(2)])
    );
    
    // Calculate countdown (hours left)
    const hoursLeft = Math.floor((new Date(match.start_time_iso) - now) / (1000 * 60 * 60));
    let message = "";
    if (hoursLeft > 24) message = "Plenty of time to strategize!";
    else if (hoursLeft > 12) message = "Excitement is building up!";
    else if (hoursLeft > 6) message = "The match is just around the corner!";
    else message = "The heat is on!";
    
    return { ...match, percentages, hoursLeft, message };
}).filter(match => match !== null);
  
  // Recent valid guesses: Last 10 valid responses sorted descending by timestamp
  const recentGuesses = responsesWithValidity
    .filter(resp => resp.valid_guess)
    .sort((a, b) => new Date(b.timestamp_dt) - new Date(a.timestamp_dt))
    .slice(0, 10);
  
  res.status(200).json({
    scheduleData,
    responsesData,
    leaderboardData,
    upcomingMatches,
    recentGuesses
  });
}

// Helper functions
function parseSchedule(record) {
  try {
    const dateStr = record["Date"].split(",")[0].trim();
    const timeStr = record["Time"].trim();
    const dt = new Date(`${dateStr} 2025 ${timeStr}`);
    return dt;
  } catch (e) {
    return null;
  }
}

function extractMatchId(matchStr) {
  try {
    return matchStr.split(":")[0].trim();
  } catch (e) {
    return "";
  }
}

function parseResponseTimestamp(ts) {
  try {
    return new Date(ts);
  } catch (e) {
    return null;
  }
}

function isValidGuess(response, scheduleMap) {
  const matchId = response["Match ID"];
  const sched = scheduleMap[matchId];
  if (!sched) return false;
  const teams = sched["Teams"].split(" vs ").map(team => team.trim());
  const guess = response["Who will win the match today ? "].trim();
  if (!teams.some(team => team.toLowerCase() === guess.toLowerCase())) return false;
  const startTime = sched.start_time_iso;
  const ts = response.timestamp_dt;
  if (!startTime || !ts) return false;
  return ts < startTime;
}