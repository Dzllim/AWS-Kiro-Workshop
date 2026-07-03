"""Parse FIFA World Cup 2026 squad list from raw text file.

Reads: data/raw/rosters/squads_raw.txt (paste full PDF text here)
Outputs: data/raw/rosters/worldcup2026.json

Run: python parse_squads.py
"""
import json
import re
import os

INPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "rosters", "squads_raw.txt")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "rosters", "worldcup2026.json")


def parse_squads(text: str) -> dict:
    """Parse raw PDF text into structured squad data."""
    squads = {}

    # Split by "SQUAD LIST" to get each team section
    sections = text.split("SQUAD LIST")

    for section in sections:
        if not section.strip():
            continue

        # Find country name: first line after split contains "Country (CODE)"
        lines = section.strip().split("\n")
        country_match = re.match(r'\s*(.+?)\s*\(\w{3}\)', lines[0])
        if not country_match:
            continue

        country = country_match.group(1).strip()
        players = []

        # Find player lines: they start with GK/DF/MF/FW
        for line in lines:
            line = line.strip()
            # Match position at start of line
            pos_match = re.match(r'^(GK|DF|MF|FW)\s+(.+)', line)
            if not pos_match:
                continue

            pos_code = pos_match.group(1)
            remainder = pos_match.group(2)

            # Extract player name (SURNAME Firstname pattern)
            # The surname is the first word (all or mixed case)
            name_match = re.match(r'(\S+)\s+(\S+)', remainder)
            if not name_match:
                continue

            surname = name_match.group(1)
            first_name = name_match.group(2)

            # Extract club (in parentheses pattern like "(ENG)" preceded by club name)
            club_match = re.search(r'([A-Za-z\s\.\-\']+(?:FC|SC|CF|AC|AS|SS|CR|CA|SE|RC|CD|FK|SK|PFC|AFC|BSC|RB|VfL|VfB|TSG|1\.|OGC|SL|KRC|PSV|AEK|NK|GNK|HNK|RSC|KAA|KV|RKC)[\w\s\.\-\']*)\s*\(\w{3}\)', remainder)
            club = ""
            if club_match:
                club = club_match.group(1).strip()
            else:
                # Try simpler pattern: anything before (XXX) near end
                club_match2 = re.search(r'(.{5,40})\s*\(\w{3}\)\s*\d{2,3}\s+\d+\s+\d+\s*$', remainder)
                if club_match2:
                    club = club_match2.group(1).strip()

            # Extract caps and goals (last two numbers in the line)
            numbers = re.findall(r'\d+', remainder)
            caps = 0
            goals = 0
            if len(numbers) >= 2:
                goals = int(numbers[-1])
                caps = int(numbers[-2])

            pos_map = {"GK": "GK", "DF": "DEF", "MF": "MID", "FW": "FWD"}

            # Clean up name
            full_name = f"{first_name} {surname}".strip()
            # Remove any ALL CAPS duplicates
            if full_name.isupper():
                full_name = full_name.title()

            players.append({
                "name": full_name,
                "position": pos_map[pos_code],
                "club": club,
                "caps": caps,
                "goals": goals,
            })

        if players:
            squads[country] = players
            print(f"  {country}: {len(players)} players")

    return squads


def main():
    if not os.path.exists(INPUT_PATH):
        print(f"Please save the full PDF text to:\n  {INPUT_PATH}")
        print("\nThen run: python parse_squads.py")
        return

    print("Reading raw squad text...")
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        text = f.read()

    print(f"Text length: {len(text)} characters")
    print("\nParsing squads...")
    squads = parse_squads(text)

    if not squads:
        print("ERROR: No squads parsed. Check the text format.")
        return

    # Build output
    output = {
        "_note": "FIFA World Cup 2026 squad rosters - parsed from official FIFA PDF",
        "_lastUpdated": "2026-07-03",
        "_source": "FIFA.com official squad list",
    }
    output.update(squads)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved {len(squads)} teams to worldcup2026.json")
    print(f"  Total players: {sum(len(p) for p in squads.values())}")


if __name__ == "__main__":
    main()
