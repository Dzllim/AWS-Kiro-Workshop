"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Sample player data
const samplePlayers = [
  { playerId: "player-013", name: "Erling Haaland", team: "Manchester City", position: "FWD", goals: 25, assists: 5, xG: 22.5, xA: 3.2, form: 9.0, marketValue: 180 },
  { playerId: "player-018", name: "Harry Kane", team: "Bayern Munich", position: "FWD", goals: 28, assists: 8, xG: 25.2, xA: 6.5, form: 9.2, marketValue: 100 },
  { playerId: "player-019", name: "Robert Lewandowski", team: "Barcelona", position: "FWD", goals: 20, assists: 4, xG: 18.5, xA: 3.5, form: 7.8, marketValue: 30 },
  { playerId: "player-015", name: "Mohamed Salah", team: "Liverpool", position: "FWD", goals: 18, assists: 10, xG: 16.5, xA: 8.5, form: 8.5, marketValue: 80 },
  { playerId: "player-011", name: "Bukayo Saka", team: "Arsenal", position: "FWD", goals: 16, assists: 11, xG: 14.2, xA: 9.8, form: 8.8, marketValue: 120 },
  { playerId: "player-017", name: "Vinicius Jr", team: "Real Madrid", position: "FWD", goals: 15, assists: 6, xG: 13.8, xA: 5.2, form: 8.5, marketValue: 150 },
  { playerId: "player-016", name: "Jude Bellingham", team: "Real Madrid", position: "MID", goals: 14, assists: 8, xG: 12.5, xA: 7.0, form: 9.0, marketValue: 150 },
  { playerId: "player-020", name: "Lamine Yamal", team: "Barcelona", position: "FWD", goals: 12, assists: 10, xG: 10.5, xA: 9.0, form: 9.5, marketValue: 150 },
  { playerId: "player-004", name: "Kylian Mbappe", team: "Real Madrid", position: "FWD", goals: 10, assists: 4, xG: 9.5, xA: 3.2, form: 9.0, marketValue: 180 },
  { playerId: "player-014", name: "Kevin De Bruyne", team: "Manchester City", position: "MID", goals: 6, assists: 15, xG: 5.5, xA: 13.8, form: 8.2, marketValue: 80 },
  { playerId: "player-012", name: "Martin Odegaard", team: "Arsenal", position: "MID", goals: 8, assists: 10, xG: 6.8, xA: 9.2, form: 8.5, marketValue: 110 },
  { playerId: "player-001", name: "Lionel Messi", team: "Inter Miami", position: "FWD", goals: 8, assists: 6, xG: 7.2, xA: 5.8, form: 8.5, marketValue: 35 },
];

type SortKey = "goals" | "assists" | "xG" | "xA" | "form" | "marketValue";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("goals");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPlayer, setSelectedPlayer] = useState<typeof samplePlayers[0] | null>(null);

  const filteredPlayers = useMemo(() => {
    let result = samplePlayers;

    if (search.length >= 3) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(s) || p.team.toLowerCase().includes(s)
      );
    }

    if (positionFilter !== "All") {
      result = result.filter((p) => p.position === positionFilter);
    }

    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

    return result;
  }, [search, positionFilter, sortBy, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const formColor = (form: number) => {
    if (form >= 8.5) return "text-green-400";
    if (form >= 7.0) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Player Statistics</h1>
        <p className="mt-2 text-muted-foreground">
          View goals, xG, xA, form ratings, and market value. Click column headers to sort.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players or teams (3+ chars)..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option value="All">All Positions</option>
              <option value="FWD">Forwards</option>
              <option value="MID">Midfielders</option>
              <option value="DEF">Defenders</option>
              <option value="GK">Goalkeepers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Player Table */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Player</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Team</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Pos</th>
                <SortableHeader label="Goals" sortKey="goals" currentSort={sortBy} order={sortOrder} onSort={handleSort} />
                <SortableHeader label="Assists" sortKey="assists" currentSort={sortBy} order={sortOrder} onSort={handleSort} />
                <SortableHeader label="xG" sortKey="xG" currentSort={sortBy} order={sortOrder} onSort={handleSort} />
                <SortableHeader label="xA" sortKey="xA" currentSort={sortBy} order={sortOrder} onSort={handleSort} />
                <SortableHeader label="Form" sortKey="form" currentSort={sortBy} order={sortOrder} onSort={handleSort} />
                <SortableHeader label="Value (€M)" sortKey="marketValue" currentSort={sortBy} order={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredPlayers.map((player, i) => (
                <motion.tr
                  key={player.playerId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedPlayer(player)}
                  className="hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{player.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{player.team}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{player.goals}</td>
                  <td className="px-4 py-3 font-mono">{player.assists}</td>
                  <td className="px-4 py-3 font-mono">{player.xG.toFixed(1)}</td>
                  <td className="px-4 py-3 font-mono">{player.xA.toFixed(1)}</td>
                  <td className={cn("px-4 py-3 font-mono font-semibold", formColor(player.form))}>
                    {player.form.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 font-mono">{player.marketValue}M</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No players match your search criteria.
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPlayer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.team} • {selectedPlayer.position}</p>
                </div>
                <button onClick={() => setSelectedPlayer(null)} aria-label="Close player profile" className="text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard label="Goals" value={selectedPlayer.goals.toString()} />
                <StatCard label="Assists" value={selectedPlayer.assists.toString()} />
                <StatCard label="Form" value={selectedPlayer.form.toFixed(1)} highlight />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard label="Expected Goals" value={selectedPlayer.xG.toFixed(1)} />
                <StatCard label="Expected Assists" value={selectedPlayer.xA.toFixed(1)} />
              </div>

              <div className="rounded-lg border border-border/30 p-3 text-center">
                <div className="text-sm text-muted-foreground">Market Value</div>
                <div className="text-xl font-bold text-primary">€{selectedPlayer.marketValue}M</div>
              </div>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="mt-4 w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  order,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  order: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-primary text-xs">{order === "desc" ? "↓" : "↑"}</span>
        )}
      </span>
    </th>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border/30 p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-bold", highlight ? "text-primary" : "")}>{value}</div>
    </div>
  );
}
