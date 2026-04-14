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
    const match = record["Which match are you predicting for?"];
    const matchId = extractMatchId(match, scheduleData);
    record["Who will win the match today ? "] = record["Who will win the match today ? "].toUpperCase();
    // Strip placeholder last-name dashes (e.g. "Ishan -----" → "Ishan")
    record["Submitted By"] = record["Submitted By"].replace(/\s*-+\s*$/, '').trim();
    return { ...record, timestamp_dt, "Match ID": matchId, "Match": match };
  });

  // Filter valid responses
  const validResponses = responsesData.filter(resp => isValidGuess(resp, scheduleMap));

  // Sort by timestamp ascending (so latest overwrites previous)
  validResponses.sort((a, b) => new Date(a.timestamp_dt) - new Date(b.timestamp_dt));

  // Retain only the latest valid guess per (user, match)
  const latestValidGuessMap = new Map();
  validResponses.forEach(resp => {
    const user = resp["Submitted By"];
    const key = `${user}_${resp["Match ID"]}`;
    latestValidGuessMap.set(key, resp);
  });

  // Mark validity in full dataset
  const responsesWithValidity = responsesData.map(resp => {
    const user = resp["Submitted By"];
    const key = `${user}_${resp["Match ID"]}`;
    const isLatestValid = latestValidGuessMap.get(key) === resp;
    return { ...resp, valid_guess: isLatestValid };
  });

  // ── Per-user stats from latest valid guesses ──────────────────────────────
  const userStats = {};
  for (const resp of latestValidGuessMap.values()) {
    const user = resp["Submitted By"].trim();
    if (!userStats[user]) {
      userStats[user] = { totalGuesses: 0, lastPrediction: null, guessMap: {} };
    }
    userStats[user].totalGuesses += 1;
    const ts = resp.timestamp_dt;
    if (!userStats[user].lastPrediction || ts > userStats[user].lastPrediction) {
      userStats[user].lastPrediction = ts;
    }
    userStats[user].guessMap[resp["Match ID"]] = resp["Who will win the match today ? "].trim();
  }

  // ── Streak computation ────────────────────────────────────────────────────
  // Sort completed matches reverse-chronologically (most recent first)
  const completedMatchesSorted = scheduleData
    .filter(m => m.Winner && m.Winner !== 'TBD')
    .sort((a, b) => new Date(b.start_time_iso) - new Date(a.start_time_iso));

  function computeStreak(user) {
    const stats = userStats[user];
    if (!stats) return 0;
    let streak = 0;
    for (const match of completedMatchesSorted) {
      const guessed = stats.guessMap[match.matchId];
      if (!guessed) continue; // no prediction → skip, don't break streak
      if (guessed === match.Winner.trim()) {
        streak++;
      } else {
        break; // wrong prediction → streak ends
      }
    }
    return streak;
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  // Track how many valid guesses each user made for decided matches (for accurate accuracy%)
  const decidedGuessesMap = {};
  const leaderboard = {};
  scheduleData.forEach(match => {
    if (match["Winner"] && match["Winner"] !== "TBD") {
      const matchId = match["Match ID"];
      const winner = match["Winner"];
      responsesWithValidity.forEach(resp => {
        if (resp["Match ID"] === matchId && resp.valid_guess) {
          const user = resp["Submitted By"].trim();
          decidedGuessesMap[user] = (decidedGuessesMap[user] || 0) + 1;
          if (resp["Who will win the match today ? "].trim() === winner.trim()) {
            if (!leaderboard[user]) {
              leaderboard[user] = { matches: [], correctGuesses: 0, correctCount: 0, lastCorrectTs: null };
            }
            leaderboard[user]["correctCount"] += 1;
            leaderboard[user]["correctGuesses"] += 1;
            if (matchId.includes("Qualifier") || matchId.includes("Eliminator"))
              leaderboard[user]["correctGuesses"] += 1;
            if (matchId.includes("Final"))
              leaderboard[user]["correctGuesses"] += 2;
            leaderboard[user]["matches"].push(resp["Match"]);
            // Track when the user last scored for tiebreaking
            if (!leaderboard[user]["lastCorrectTs"] || resp.timestamp_dt > leaderboard[user]["lastCorrectTs"])
              leaderboard[user]["lastCorrectTs"] = resp.timestamp_dt;
          }
        }
      });
    }
  });

  const leaderboardData = Object.entries(leaderboard)
    .map(([user, data]) => ({
      user,
      correctGuesses: data.correctGuesses,
      correctCount: data.correctCount,
      decidedGuesses: decidedGuessesMap[user] || data.correctCount,
      matches: data.matches,
      totalGuesses: userStats[user]?.totalGuesses || data.matches.length,
      lastPrediction: userStats[user]?.lastPrediction || null,
      lastCorrectTs: data.lastCorrectTs,
      streak: computeStreak(user),
    }))
    .sort((a, b) => {
      if (b.correctGuesses !== a.correctGuesses) return b.correctGuesses - a.correctGuesses;
      // Tiebreak: whoever reached their current score earlier ranks higher
      if (a.lastCorrectTs && b.lastCorrectTs) return new Date(a.lastCorrectTs) - new Date(b.lastCorrectTs);
      return 0;
    });

  // ── Upcoming matches ──────────────────────────────────────────────────────
  const now = new Date();
  const upcomingMatches = scheduleData.filter(match =>
    match["Winner"] === "TBD" &&
    match.start_time_iso &&
    new Date(match.start_time_iso) > now
  ).map(match => {
    const matchResponses = responsesWithValidity.filter(resp =>
      resp["Match ID"] === match.matchId && resp.valid_guess
    );
    if (matchResponses.length === 0) return null;

    const voteCounts = {};
    const voterNames = {};
    matchResponses.forEach(resp => {
      const team = resp["Who will win the match today ? "].trim();
      voteCounts[team] = (voteCounts[team] || 0) + 1;
      if (!voterNames[team]) voterNames[team] = [];
      voterNames[team].push(resp["Submitted By"].trim().split(' ')[0]);
    });
    const total = Object.values(voteCounts).reduce((a, b) => a + b, 0);
    const percentages = Object.fromEntries(
      Object.entries(voteCounts).map(([team, count]) => [team, ((count / total) * 100).toFixed(2)])
    );

    return { ...match, percentages, voterNames, totalVotes: total };
  }).filter(match => match !== null);

  // ── Recent guesses with result ────────────────────────────────────────────
  const recentGuesses = responsesWithValidity
    .filter(resp => resp.valid_guess)
    .sort((a, b) => new Date(b.timestamp_dt) - new Date(a.timestamp_dt))
    .map(resp => {
      const match = scheduleMap[resp["Match ID"]];
      let result = 'pending';
      if (match && match.Winner && match.Winner !== 'TBD') {
        result = resp["Who will win the match today ? "].trim() === match.Winner.trim()
          ? 'correct' : 'wrong';
      }
      return { ...resp, result };
    });

  res.status(200).json({
    scheduleData,
    responsesData,
    leaderboardData,
    upcomingMatches,
    recentGuesses,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSchedule(record) {
  try {
    const dateStr = record["Date"].split(",")[0].trim();
    const timeStr = record["Time"].trim();
    // Explicitly parse as IST (UTC+5:30) so times display correctly
    const dt = new Date(`${dateStr} 2026 ${timeStr} GMT+0530`);
    return dt;
  } catch (e) {
    return null;
  }
}

function extractMatchId(matchStr, scheduleData = null) {
  if (!matchStr) return "";

  // Legacy format: "IPL-21: RCB vs SRH, April 7th"
  if (matchStr.includes(":")) {
    return matchStr.split(":")[0].trim();
  }

  // New format: "Apr 13 - SRH vs RR"
  if (matchStr.includes(" - ") && scheduleData) {
    const dashIdx = matchStr.indexOf(" - ");
    const datePart  = matchStr.slice(0, dashIdx).trim();   // "Apr 13"
    const teamsPart = matchStr.slice(dashIdx + 3).trim();  // "SRH vs RR"
    const [monthAbbr, day] = datePart.split(" ");

    const found = scheduleData.find(m => {
      if (m.Teams !== teamsPart) return false;
      // Schedule date: "April 13, Monday" → split to ["April", "13", "Monday"]
      const parts = m.Date.replace(",", "").split(" ");
      return parts[1] === day &&
             parts[0].toLowerCase().startsWith(monthAbbr.toLowerCase());
    });

    return found ? found.matchId : teamsPart;
  }

  return matchStr.trim();
}

function parseResponseTimestamp(ts) {
  try {
    // Google Sheets stores timestamps as serial numbers (days since Dec 30, 1899).
    // Sheets serialises in UTC, so convert directly with no offset adjustment.
    if (/^\d+(\.\d+)?$/.test(ts.trim())) {
      return new Date((parseFloat(ts) - 25569) * 86400 * 1000);
    }
    const date = new Date(ts);
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    return date;
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
  const startTime = new Date(sched.start_time_iso);
  const ts = new Date(response.timestamp_dt);
  if (!startTime || !ts) return false;
  return ts < startTime;
}
