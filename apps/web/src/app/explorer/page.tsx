"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Sample match data (in production, fetched from API with pagination)
const sampleMatches = [
  { matchId: "match-001", homeTeam: "Argentina", awayTeam: "France", competition: "International", date: "2025-11-20", score: "3-2", homeXG: 2.8, awayXG: 2.1, homePossession: 55 },
  { matchId: "match-002", homeTeam: "Brazil", awayTeam: "Argentina", competition: "International", date: "2025-09-10", score: "1-2", homeXG: 1.5, awayXG: 1.8, homePossession: 52 },
  { matchId: "match-003", homeTeam: "England", awayTeam: "Germany", competition: "International", date: "2025-10-15", score: "2-2", homeXG: 1.9, awayXG: 1.8, homePossession: 48 },
  { matchId: "match-004", homeTeam: "Spain", awayTeam: "Italy", competition: "International", date: "2025-10-15", score: "1-0", homeXG: 1.6, awayXG: 0.6, homePossession: 64 },
  { matchId: "match-005", homeTeam: "Arsenal", awayTeam: "Chelsea", competition: "Premier League", date: "2025-12-20", score: "3-1", homeXG: 2.5, awayXG: 0.9, homePossession: 62 },
  { matchId: "match-006", homeTeam: "Manchester City", awayTeam: "Liverpool", competition: "Premier League", date: "2025-11-30", score: "2-2", homeXG: 2.1, awayXG: 1.8, homePossession: 58 },
  { matchId: "match-007", homeTeam: "Real Madrid", awayTeam: "Barcelona", competition: "La Liga", date: "2025-10-28", score: "2-1", homeXG: 1.8, awayXG: 1.5, homePossession: 45 },
  { matchId: "match-008", homeTeam: "Bayern Munich", awayTeam: "Borussia Dortmund", competition: "Bundesliga", date: "2025-11-09", score: "4-1", homeXG: 3.2, awayXG: 1.0, homePossession: 62 },
  { matchId: "match-009", homeTeam: "Portugal", awayTeam: "Netherlands", competition: "International", date: "2025-11-18", score: "1-1", homeXG: 1.4, awayXG: 1.2, homePossession: 53 },
  { matchId: "match-010", homeTeam: "Inter Milan", awayTeam: "PSG", competition: "Champions League", date: "2025-12-10", score: "1-0", homeXG: 1.2, awayXG: 1.0, homePossession: 48 },
];

const competitions = ["All", "International", "Premier League", "La Liga", "Bundesliga", "Serie A", "Champions League", "Ligue 1"];

export default function ExplorerPage() {
  const [search, setSearch] = useState("");
  const [competitionFilter, setCompetitionFilter] = useState("All");
  const [selectedMatch, setSelectedMatch] = useState<typeof sampleMatches[0] | null>(null);

  const filteredMatches = useMemo(() => {
    let result = sampleMatches;

    if (search.length >= 3) {
      const s = search.toLowerCase();
      result = result.filter(
        (m) => m.homeTeam.toLowerCase().includes(s) || m.awayTeam.toLowerCase().includes(s)
      );
    }

    if (competitionFilter !== "All") {
      result = result.filter((m) => m.competition === competitionFilter);
    }

    return result;
  }, [search, competitionFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Match Explorer</h1>
        <p className="mt-2 text-muted-foreground">
          Search and explore historical matches across competitions and time periods.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Search Teams</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type at least 3 characters..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Competition</label>
            <select
              value={competitionFilter}
              onChange={(e) => setCompetitionFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              {competitions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No matches found. Try removing filters to broaden results.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredMatches.map((match, i) => (
              <motion.button
                key={match.matchId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                onClick={() => setSelectedMatch(match)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold min-w-[200px]">
                    {match.homeTeam} <span className="text-muted-foreground">vs</span> {match.awayTeam}
                  </div>
                  <span className="text-sm font-mono font-bold text-primary">{match.score}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">{match.competition}</span>
                  <span>{match.date}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Pagination info */}
        <div className="px-6 py-3 border-t border-border/30 text-sm text-muted-foreground">
          Showing {filteredMatches.length} of {sampleMatches.length} matches
        </div>
      </div>

      {/* Match Detail Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Match Details</h3>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close match details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="text-sm text-muted-foreground mb-1">{selectedMatch.competition} • {selectedMatch.date}</div>
                <div className="text-xl font-bold">
                  {selectedMatch.homeTeam} <span className="text-primary text-2xl mx-2">{selectedMatch.score}</span> {selectedMatch.awayTeam}
                </div>
              </div>

              <div className="space-y-3">
                <StatRow label="Expected Goals (xG)" home={selectedMatch.homeXG.toFixed(1)} away={selectedMatch.awayXG.toFixed(1)} />
                <StatRow label="Possession" home={`${selectedMatch.homePossession}%`} away={`${100 - selectedMatch.homePossession}%`} />
              </div>

              <div className="mt-6 pt-4 border-t border-border/30">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, home, away }: { label: string; home: string; away: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center text-sm">
      <span className="text-right font-mono">{home}</span>
      <span className="text-muted-foreground text-xs w-28 text-center">{label}</span>
      <span className="font-mono">{away}</span>
    </div>
  );
}
