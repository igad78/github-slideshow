---
name: football-match-reporter
description: Turns a finished football fixture's raw stats into four ready-to-publish outputs for yalla-kora-live.xyz — an Arabic fixture-page recap block, a TikTok/Shorts script, a dashboard/newsletter table, and a push notification. Works for any competition (league, cup, continental, international), not just tournaments. Use whenever match_status is "Finished" and a match data packet needs converting into publishable content. Trigger on "generate match content," "match finished, need the recap," "post-match package," or when the content pipeline receives a completed fixture event.
---

# Football Match Reporter

Converts one finished-match data packet into four publish-ready outputs in a single pass. Replaces the World Cup–only `worldcup-multimedia-reporter`, which assumed knockout brackets and produced English copy for an Arabic-language audience.

## When this runs

Trigger condition: `match_status == "Finished"`, for **any** competition — domestic league, domestic cup, continental (UCL / AFC Champions League Elite / CAF), or international.

Invoked by the content pipeline immediately after a fixture is marked finished and its stats packet is available. Club football produces ~10x the fixtures a tournament does, so this skill runs many times per matchday. Bias every judgement toward speed and accuracy over polish — a recap published 90 seconds after the whistle beats a better one published in 20 minutes.

## Required input

Confirm all seven fields before generating. If any are missing, pull them from the match data source (API-Football / recap pipeline) or ask. **Never invent a scoreline, scorer, minute, or table position** — a wrong fact in a push notification is unrecallable.

| Field | Type | Example |
|---|---|---|
| `fixture` | string | "Al Ahly vs. Zamalek" |
| `competition` | string | "Egyptian Premier League" |
| `round` | string | "Matchweek 3" / "Round of 16" / "UCL League Phase MD1" |
| `final_score` | string | "2-1" |
| `key_events` | array | ["Goal 12' Ahmed Sayed", "Red Card 54'"] |
| `tactical_context` | string | "10-man low block after the red" |
| `table_or_bracket_impact` | string | "Ahly go top on goal difference" / "Zamalek eliminated" |

`next_fixture` is optional but include it when known — it's what makes the recap link forward into the next fixture page.

## Step 1 — Classify the match

Do this first; it decides the narrative angle for all four outputs. Generic recap boilerplate is exactly the content type the February 2026 Google Discover core update demoted, so the angle is not decoration — it's the reason the content gets distributed at all.

| Type | Signal in the packet | Angle to lead with |
|---|---|---|
| **Derby** | Historic rivals, same city/country | Rivalry stakes, crowd, what bragging rights cost |
| **Title race** | Both sides in top 3, late season | Points swing, remaining fixtures, pressure |
| **Relegation six-pointer** | Both sides in bottom 4 | Survival maths, games left |
| **Knockout** | `round` names a cup stage | Who advances, aggregate, who they meet next |
| **Upset** | Large table/seeding gap, favourite lost | How the underdog did it — tactically, not luckily |
| **Routine league win** | None of the above | The tactical detail that actually decided it |

If a match is genuinely routine, say something specific and small rather than inflating it. Manufactured drama on a 1-0 midweek win reads as noise and trains readers to ignore your notifications.

## Voice

A veteran tactical analyst who respects the reader's time. Lead with the mechanism — the shape change, the substitution that shifted the game, the pressing trigger someone exploited. Keep the raw data exact; let the analysis carry the interest instead of adjectives.

## Language

**Arabic is the primary output language** for all four formats — the audience is MENA. Use Modern Standard Arabic with the football vernacular readers actually use. Add an English version underneath only when the packet sets `bilingual: true`.

Arabic team and competition names run longer than their English equivalents. Check rendered length on anything with a character limit rather than assuming the English fits.

---

## Output 1 — Fixture page recap block

The durable asset — this is what ranks and what every social post links back to. It replaces the pre-match state on the same fixture URL.

- **H1 pattern:** `نتيجة مباراة {home} و {away} في {competition}`
- **Schema:** `NewsArticle` (the page carried `SportsEvent` pre-match and `LiveBlogPosting` while live)
- **Length:** 250–400 words. Long enough to be original, short enough to publish fast.
- **Must contain:** the score in the first sentence, every scorer with minute, the tactical turning point, `table_or_bracket_impact`, and an internal link to the `next_fixture` page.
- **By-line:** a named analyst, not the site name. E-E-A-T is a Discover eligibility factor now.

```
# نتيجة مباراة {home} و {away} في {competition}

{One sentence: the result and what decided it.}

{Two or three sentences on the tactical turning point — what changed, when, and why it worked.}

{One sentence on {table_or_bracket_impact}.}

{Closing line linking forward to {next_fixture}.}
```

## Output 2 — Short-form video script

TikTok / Reels / YouTube Shorts. Optimise for retention and TTS pacing: visual cue + voiceover pairs, escalating hook → turning point → tactical read → what's next. Open on the single most dramatic moment in `key_events`, never on a scoreboard graphic.

```
[Visual: {the most dramatic moment from key_events}]
Voiceover: {Hook — the result stated as a consequence, not a scoreline.}

[Visual: Turning-point graphic overlay, timestamp burned in]
Voiceover: {The moment it turned — the event and its minute.}

[Visual: 2D tactical whiteboard showing {tactical_context}]
Voiceover: {What the shape change actually did.}

[Visual: League table or bracket animating the change]
Voiceover: {table_or_bracket_impact} {Next up: next_fixture.}
```

Burn in Arabic captions — most of this audience watches muted.

## Output 3 — Dashboard / newsletter table

Markdown, for the internal dashboard and the newsletter. Map each raw metric to a narrative takeaway rather than restating it.

```
### {Tactical headline}
{Two sentences: the result against the context of the competition and what was at stake.}

| Raw Match Metric | Tactical Breakdown |
| :--- | :--- |
| Scoreline: {final_score} | {What the score does and doesn't tell you.} |
| Key Event: {key_events} | {The structural shift it forced.} |
| Impact: {table_or_bracket_impact} | {What it changes about the run-in.} |
| Next: {next_fixture} | {What this result means for that game.} |
```

## Output 4 — Push notification

**Hard cap 140 characters, rendered.** Count the actual output; Arabic club names blow the budget fast. Truncation kills click-through.

Send only to users following one of the two teams. Never broadcast to the whole list.

```
⚽ {competition}: {fixture} — {final_score}. {The one-clause reason.} اقرأ التحليل ←
```

Rules: one emoji maximum, lead with the result (readers who only see the banner still get the value), and end on a reason to tap. Never use a cliffhanger that withholds the score — it reads as clickbait and burns the subscription.

## Return format

Return all four labeled in one response so the calling agent can route each without re-prompting:

`## Fixture Page Recap` · `## Video Script` · `## Dashboard Table` · `## Push Notification`

Then a one-line `Checks:` confirming the push notification's rendered character count and that every scorer and minute came from the packet rather than from you.
