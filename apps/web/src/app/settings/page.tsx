"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const allTeams = [
  "Argentina", "France", "Brazil", "England", "Spain",
  "Germany", "Portugal", "Netherlands", "Italy", "Uruguay",
  "Arsenal", "Manchester City", "Liverpool", "Chelsea",
  "Real Madrid", "Barcelona", "Bayern Munich", "Inter Milan", "PSG", "Borussia Dortmund",
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [favourites, setFavourites] = useState<string[]>(["Argentina", "Arsenal"]);
  const [newFavourite, setNewFavourite] = useState("");
  const [saved, setSaved] = useState(false);

  const addFavourite = () => {
    if (newFavourite && !favourites.includes(newFavourite) && favourites.length < 5) {
      setFavourites([...favourites, newFavourite]);
      setNewFavourite("");
    }
  };

  const removeFavourite = (team: string) => {
    setFavourites(favourites.filter((f) => f !== team));
  };

  const handleSave = () => {
    // In production, save to API
    localStorage.setItem("matchlens-favourites", JSON.stringify(favourites));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value="user@matchlens.app"
                disabled
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Role</label>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                User
              </span>
            </div>
          </div>
        </div>

        {/* Favourite Teams */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Favourite Teams ({favourites.length}/5)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Favourite teams appear at the top of team selectors and search results.
          </p>

          {/* Current favourites */}
          <div className="flex flex-wrap gap-2 mb-4">
            {favourites.map((team) => (
              <span
                key={team}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm"
              >
                {team}
                <button
                  onClick={() => removeFavourite(team)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Remove ${team} from favourites`}
                >
                  ×
                </button>
              </span>
            ))}
            {favourites.length === 0 && (
              <span className="text-sm text-muted-foreground">No favourites set</span>
            )}
          </div>

          {/* Add new */}
          {favourites.length < 5 && (
            <div className="flex gap-2">
              <select
                value={newFavourite}
                onChange={(e) => setNewFavourite(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a team...</option>
                {allTeams.filter((t) => !favourites.includes(t)).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={addFavourite}
                disabled={!newFavourite}
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Appearance</h3>
          <div className="flex gap-3">
            {(["dark", "light", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                  theme === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30"
                )}
              >
                {t === "dark" && "🌙 "}
                {t === "light" && "☀️ "}
                {t === "system" && "💻 "}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {saved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
