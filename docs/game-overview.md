# Bomb Busters — Comprehensive Overview & Complete Game Rules

> A deep-research reference for the cooperative deduction board game **Bomb Busters**
> by Hisashi Hayashi (Spiel des Jahres 2025). It collects a full game overview, the
> complete official rules, every component, all action types, all special wires and
> tokens, the character ability, the equipment system, the campaign structure, the
> full-difficulty scaling by player count, strategy principles, a glossary, and every
> known edge case and FAQ clarification.
>
> **Primary source:** the **official English rulebook** (Cocktail Games), extracted in
> full. **Secondary sources:** BoardGameGeek, Spiel des Jahres, Pegasus Spiele, the
> official FAQ, and numerous published rules explainers and reviews (linked at the end).
>
> **Confidence notes:** The equipment cards are now enumerated with their exact names, effects,
> and unlock numbers (§9). Where a detail is still not printed in the base rulebook (notably the
> exact detonator track length per player count), the text below says so explicitly and gives the
> best cross-referenced answer rather than inventing specifics.

---

## Table of Contents

1. [Game at a Glance](#1-game-at-a-glance)
2. [The Premise & Theme](#2-the-premise--theme)
3. [Components (Full List)](#3-components-full-list)
4. [Core Concepts](#4-core-concepts)
5. [Setup (Step by Step)](#5-setup-step-by-step)
6. [How to Play — Turn Structure](#6-how-to-play--turn-structure)
7. [Special Wires — Detailed Rules](#7-special-wires--detailed-rules)
8. [The Character Card (Double Detector)](#8-the-character-card-double-detector)
9. [Equipment Cards (The Full System)](#9-equipment-cards-the-full-system)
10. [The Detonator & Difficulty Scaling by Player Count](#10-the-detonator--difficulty-scaling-by-player-count)
11. [Communication Rules](#11-communication-rules)
12. [Winning and Losing](#12-winning-and-losing)
13. [Campaign / Mission Structure & Surprise Boxes](#13-campaign--mission-structure--surprise-boxes)
14. [Player-Count Variants (Solo / 2 / 3 players)](#14-player-count-variants-solo--2--3-players)
15. [Strategy & Deduction Principles](#15-strategy--deduction-principles)
16. [A Full Turn, Worked Example](#16-a-full-turn-worked-example)
17. [Edge Cases, Clarifications & FAQ ("Every Corner")](#17-edge-cases-clarifications--faq-every-corner)
18. [Glossary / Lexicon](#18-glossary--lexicon)
19. [Reception & Awards](#19-reception--awards)
20. [Sources](#20-sources)

---

## 1. Game at a Glance

| Attribute | Detail |
| --- | --- |
| **Title** | Bomb Busters |
| **Designer** | Hisashi Hayashi (Japan) |
| **Illustrator** | Dom2D |
| **Publishers** | Cocktail Games (original FR/EN edition); Pegasus Spiele (German edition); localized worldwide |
| **Year released** | 2024 |
| **Players** | Box states **2–5**; BoardGameGeek lists **1–5** (a solo variant using two stands is supported) |
| **Play time** | ~**15–40 minutes** per mission (experienced groups often finish a mission in 15–20 min) |
| **Recommended age** | **10+** |
| **Genre / mechanics** | Cooperative · deduction · deduction-by-position (sorted hidden hand) · limited communication · campaign / legacy-lite · push-your-luck |
| **Campaign length** | **66 missions** of escalating difficulty (tutorials → training → exam → 5 sealed "Surprise" boxes → finale) |
| **Core deduction fact** | Exactly **4 copies of every number 1–12** exist, and every hand is **sorted in ascending order** |
| **Headline award** | **Spiel des Jahres 2025** (Game of the Year) — the first win for a Japanese/Asian designer in the prize's 46-year history |

---

## 2. The Premise & Theme

Every player is a **bomb disposal expert**; together they form a **single cooperative
team** (there are no traitors or hidden roles). The team must **defuse a bomb** by
**cutting wires** in the right way. Wires are represented by **numbered tiles** standing in
each player's rack, **visible only to their owner** — you hold your wires facing yourself,
exactly like holding cards. Because you can see your own wires but not your teammates', the
game is a **shared logic puzzle**: you deduce which wire a teammate is holding (partly from
what has already been cut, partly because everyone's wires are sorted in order) and then
"cut" matching pairs.

The bomb **explodes and you lose instantly** if a **red wire** is cut, or when the
**detonator** advances to its final skull space. The mission **succeeds** when every rack is
empty — i.e., all blue and yellow wires have been safely cut and any remaining all-red hands
have been revealed. The art is light and cartoonish (animal experts in sunglasses), which
deliberately offsets the ticking-bomb tension.

---

## 3. Components (Full List)

The exact retail contents:

- **70 Wire tiles**, comprising:
  - **48 blue wires** — numbered **"1" to "12"**, **4 copies of each number**.
  - **11 yellow wires** — printed **"1,1" to "11,1"**.
  - **11 red wires** — printed **"1,5" to "11,5"**.
- **17 cards** total, made up of:
  - **12 Equipment cards** (shared, single-use tools that unlock during play).
  - **5 Character cards** (each grants one player a one-time personal ability; one is used as the **Captain** marker).
- **8 large Mission cards** (the scenarios available out of the box at the start; more arrive inside the Surprise boxes to reach 66 total).
- **40 cardboard tokens** on the punchboard, which include:
  - **26 Info tokens** — including **2 yellow** ones.
  - **12 Validation tokens.**
  - **1 "=" token** and **1 "≠" token** (used by certain advanced missions).
- **7 pawns**: **4 yellow** and **3 red** (mark which yellow/red values are in play on the board).
- **1 board**, with an **arrow** that must be installed before the first game.
- **1 detonator** marker (advances along the board's track on mistakes).
- **5 tile stands** (racks that hold wires upright, facing the owner).
- **8 resealable bags** (sorting/storage between missions).
- **5 "Surprise" boxes** — sealed, opened one at a time as the campaign advances (each holds new missions, new equipment, and rules twists).
- **1 dedicated Bomb Busters pawn** — reserved **only for Mission 66** (the finale). Ignore it until then.
- **1 rulebook.**

> **Why yellow/red wires carry decimal numbers:** the "1,1 … 11,1" (yellow) and
> "1,5 … 11,5" (red) values exist **only so those tiles can be slotted into ascending order**
> while sorting your hand. A yellow "7,1" sorts between blue 7 and blue 8; a red "3,5" sorts
> between blue 3 and blue 4. **After sorting, the printed number is meaningless** — every
> yellow is simply "YELLOW" and every red is simply "RED."

### Component → Purpose Quick Reference

| Component | Purpose |
| --- | --- |
| Blue wires (1–12 ×4) | The main wires to cut; the deduction backbone (4 of each) |
| Yellow wires | "Same-value" safe wires; all count as "YELLOW" |
| Red wires | Deadly; all count as "RED"; cutting one = instant loss |
| Tile stands | Hold a player's sorted hidden hand |
| Info tokens | Record the true value of a wrongly-guessed wire |
| Validation tokens | Mark a number whose all-4 copies are cut |
| Detonator | Tracks mistakes; reaching the skull = loss |
| Yellow/Red pawns | Show on the board which yellow/red values are in play ("?" side = uncertain) |
| Character cards | One-time personal Double Detector; one flags the Captain |
| Equipment cards | Shared single-use powers, unlocked by cutting pairs |
| "=" / "≠" tokens | Advanced mission relationship constraints |
| Surprise boxes | Sealed campaign content unlocked over time |

---

## 4. Core Concepts

### Wires (Tiles)

- **Blue wires** are standard. Exactly **4 of each value 1–12**. This "4-of-each" fact is the
  engine of deduction: once you can see or have watched some copies of a number cut, you can
  reason about where the rest must be.
- **Yellow wires** are "special but safe." Cut like blue wires, but **all yellows share one
  value: "YELLOW."**
- **Red wires** are deadly. **All reds share one value: "RED."** Cutting a red (via a wrong
  guess) ends the game instantly. Reds are never cut on purpose — a player whose remaining
  hand is entirely red simply **reveals** them safely at the end.

### The Hand and Sorting (the heart of the puzzle)

- Each player's wires stand upright in their **tile stand(s)**, **facing only themselves.**
- Wires **must be sorted ascending, left to right.** Everyone knows this rule is being
  followed, so **position leaks information.** Classic deduction: if a player's
  third-from-left tile is a 5, the two tiles left of it are each one of 1–4; every tile to the
  right is ≥ 5.
- **Tile stands per player count:**
  - **2 players:** **2 tile stands each.**
  - **3 players:** the **Captain takes 2**; the others take **1 each.**
  - **4–5 players:** **1 tile stand each.**
- **"2 tile stands = 1 hand."** With two stands, each stand is **sorted independently** (its
  own ascending run), **but both stands together are one hand** for every rule — equipment,
  Info tokens, mission rules, "all my remaining wires are red," "I hold all remaining
  yellows," etc. A key consequence: a player with two stands still places only **one** Info
  token on a failed guess against them.

### The Detonator

- A marker on the board's track. Its **start position depends on player count** (more players
  → generally more margin, see §10). Each wrong guess on a **blue or yellow** wire advances it
  **one space.** If it reaches the **skull**, the bomb explodes → **mission failed.**

### Info Tokens

- Numbered markers that record the **true value of a wrongly-guessed wire.** On a failed Dual
  cut against a blue/yellow wire, the owner places an Info token in front of that wire showing
  what it actually is. This penalizes the team (detonator advances) **and simultaneously gives
  the team free, permanent deduction information.**
- **26 total, 2 of them yellow.** A **yellow Info token** marks a wire revealed to be
  **yellow.**

### Validation Tokens

- When **all 4 wires of a value are cut**, place a **Validation token** on that number. Pure
  memory aid: it tells the whole table "this number is finished," preventing illegal or fatal
  guesses. 12 tokens (one per value).

---

## 5. Setup (Step by Step)

1. **Select a Mission card.** Missions are ordered by increasing difficulty. You **do not have
   to** play in order, but it is **strongly recommended** — skipping many can leave you
   disoriented as rules accumulate.
2. **Choose a Captain.** Random for Mission 1; thereafter the Captain passes to the **player on
   the previous Captain's left.** Put the **"Captain" Character card** in front of them. Every
   other player takes a regular **Character card face up.**
3. **Read the Mission card aloud**, then place it **bottom-left of the board** so its special
   rules stay visible. **Front** = mission-specific setup; **back** = mission-specific rules.
   Default rules apply unless the card overrides them.
4. **Distribute tile stands** by player count (2p → 2 each; 3p → Captain 2, others 1; 4–5p → 1
   each).
5. **Prepare the wire tiles:**
   - **A.** Take the **48 blue wires** — *except* for tutorial Missions **1, 2, 3**, which use a
     reduced set.
   - **B.** Take the number of **red and yellow wires shown on the Mission card**, drawn at
     **random.**
   - **C.** **Indicate red/yellow values on the board** using the red/yellow pawns, **non-"?"
     side up.**
   - **D.** **Shuffle all tiles together face-down** (blue + red + yellow).
6. **Deal all wires face-down** across the stands **as evenly as possible** (one stand may hold
   one more than another).
7. **Sort each stand ascending, left to right, facing yourself** (each of two stands sorted
   separately). Use yellow/red decimals only for ordering.
8. **Board setup:**
   - Place the **detonator** on the section for the **player count.**
   - Put all **Info tokens** and the **12 Validation tokens** in their board area.
   - Take **Equipment cards equal to the number of players** and place them **face up on the
     checkmark area — not yet usable** (they unlock during play; the mission determines which
     equipment are present).
9. **Opening Info tokens:** starting with the Captain, going **clockwise**, **each player
   places one Info token in front of one of their own blue wires of the matching value.** This
   seeds starting information.
   - **Restriction:** you **may not use a yellow Info token during setup** — the opening token
     must mark a **blue** wire.

### The "1 out of N" / "2 out of 3" Partial-Knowledge Setups

Some missions specify special wires as **"1 out of 2," "1 out of 3,"** or **"2 out of 3."**
This makes some red/yellow wires only *partially* known. Example — **"2 out of 3 yellow
wires":**

1. Reveal **3** yellow wire tiles.
2. Put **3 pawns** in the matching board slots **"?" side up** ("these *might* be in play").
3. Shuffle those 3 face-down, add **2** of them (face-down) into the blue tiles, and **set the
   3rd aside unrevealed.**

Result: **only 2 of the 3** possible yellows are actually in the bomb, and the team never
learns which one was removed — the "?" pawns represent genuine, permanent uncertainty. The
same scales to other "X out of Y" values and to red wires.

---

## 6. How to Play — Turn Structure

Play proceeds **clockwise starting with the Captain.** On your turn you are the **active bomb
disposal expert** and must perform **exactly one** of three actions:

### 6.1 Dual Cut (the main action)

> **Terminology note:** this document uses **"Dual cut"** throughout (matching the companion
> app). The official Cocktail Games English rulebook prints the same action as **"Duo cut."**
> They are the same action under two spellings.

Cut **2 identical wires** — one of yours, one of a teammate's. **Point to a specific wire in a
teammate's stand and announce a value** (e.g., *"This wire is a 9"*). You must hold a matching
wire to make the claim.

- **Correct → success:**
  - The teammate flips the named wire **face up, without changing its position.**
  - Then you flip **one** of your matching wires face up in front of your stand.
  - You do **not** reveal which wire you *intended* beyond the one you cut; your hand stays
    hidden.
- **Wrong → failure:**
  - **RED wire → the bomb explodes immediately. Mission failed.**
  - **BLUE or YELLOW wire →** the **detonator advances one space** (if that space is the skull,
    the bomb explodes); the teammate places an **Info token** showing the wire's **true value**
    (a **yellow** Info token if it was yellow).

> On a failure, only the teammate's pointed-at wire is revealed/marked; **your own intended
> wire stays hidden.** The team learns "that tile is an X," not "the active player holds an X."

### 6.2 Solo Cut

Cut **2 or 4 identical wires from your own hand**, allowed **only when those are the only
remaining wires of that value in the game:**

- **All 4** copies are in your hand, **or**
- The **2** you hold are the last two (the other 2 already cut).

Flip them face up in front of your hand. No guess, no risk — a pure payoff for tracking the
"4-of-each" math (aided by cut tiles, Info tokens, and Validation tokens). Solo cut also works
for **yellow**, but only if **you hold ALL remaining yellow wires.**

### 6.3 Reveal Your Red Wires

Allowed **only when every remaining uncut wire in your hand is RED.** Reveal them all safely,
emptying your hand. This is the normal way to "finish" once your blue/yellow wires are gone.

### "No more wires?"

When a player's hand is empty, **the mission continues without them** — they stop taking
turns, play passes among the rest.

---

## 7. Special Wires — Detailed Rules

### Yellow Wires

- Cut like blue wires (Dual or Solo). The printed number matters **only for ordering**; in play
  **all yellows are one value: "YELLOW."**
- To Dual-cut a yellow: hold a yellow yourself, point at a teammate's wire and say **"this wire
  is yellow."** Correct → both cut. Wrong → **yellow Info token** placed and **detonator
  advances one space** (same as blue).
- **Solo cut on yellow** only when **you hold every remaining yellow.**
- **Detectors are blue-only:** per the official FAQ, you **cannot name "yellow"** with the
  Double/Triple detector — they indicate **blue** values only.

### Red Wires

- **All reds are one value: "RED."**
- Cutting a red (a wrong guess landing on a red) = **instant loss.**
- Reds only leave a hand via the **Reveal your red wires** action, when the whole remaining
  hand is red.

---

## 8. The Character Card (Double Detector)

Each player holds a **Character card** giving a **one-time personal ability, used by flipping
the card face down.** In the **base game the five character cards are functionally identical:
every one grants the "Double Detector"** (the characters differ only in art/flavor; one card
doubles as the **Captain** marker). More powerful scanners (Triple Detector, Super Detector,
X or Y Ray, General Radar) are **Equipment**, not character abilities (see §9).

**Double Detector** — during a **Dual cut**, announce a value and point at **TWO** wires in a
teammate's stand (instead of one):

- **Success — at least one** of the two named wires matches the value.
  - If **both** match, the teammate **does not say which** and **cuts the wire of their
    choice.**
- **Failure — neither** matches: the **detonator advances one space**, and the teammate places
  an Info token in front of **one** of the two named wires (their choice).
- **Red-wire safety valve:** if **only one** of the two named wires is **red**, **the bomb does
  NOT explode.** The teammate doesn't reveal/name the red one; instead they place an Info token
  in front of the **non-red** named wire. (This makes the Double Detector meaningfully safer
  than a plain Dual cut — pointing at two tiles can "absorb" a red without detonating, provided
  the other named tile isn't also wrong in a way that matters.)

**Related equipment:** the team also unlocks stronger scanners as **Equipment** — the **Triple
Detector**, the **Super Detector**, and the **X or Y Ray** (see §9). Each is its own card, but
the rulebook lets the **X or Y Ray combine with the Double, Triple, or Super Detector** to name
**two values across several wires at once**.

---

## 9. Equipment Cards (The Full System)

Equipment cards are **shared, single-use powers** that give the team escalating tools as a
mission unfolds.

### How Equipment Works (rules)

- A mission puts out **Equipment cards equal to the player count**, placed face up but
  **inactive** at setup. (Which equipment appear is set by the mission; some early missions
  give one fixed piece, later missions/boxes introduce more variety.)
- Each Equipment card shows a **wire value in its top-left corner** — its **unlock number.** The
  card becomes **usable the moment a pair (2 wires) of that number is cut.** Slide it up to
  reveal its green checkmark when it activates. (Example: cut a pair of 9s → the "9" equipment
  unlocks.)
- **Single use:** flip a card over after using it.
- **Timing:** each card states when it can be used. **Most can be used at any time by anyone —
  even out of turn** — and a player may use **several in a row.** (You may openly *suggest*
  using equipment; see §11.)

### The Detector Family (extended Dual cuts)

Several equipment cards are **stronger detectors** that resolve like a Dual cut: the turn player
names the value(s) and designates the **target wire(s)**; the guess succeeds if a target wire
matches a named value. A wrong guess advances the detonator, and hitting a red wire still
detonates (the Double Detector's one-red safety valve, §8, applies to the detectors too).

- **Double Detector** — say **one** number and point at **two different** target wires. This is
  each player's **Character-card** ability (§8); a spare copy can also appear as team equipment.
- **Triple Detector** — say **one** number and point at **three different** target wires.
- **Super Detector** — say **one** number and point at a **whole player's stand**; **every** wire
  that player holds becomes a target wire for the guess.
- **X or Y Ray** — say **two** numbers while pointing at a **single** target wire (the wire may be
  either of the two named numbers).

> **Combining detectors (official).** Per the rulebook, the **X or Y Ray can be combined with the
> Triple, Super, or Double Detector** to name **two values across several wires at once** — e.g.,
> X or Y Ray + Triple Detector points at three wires while naming two candidate values.

### The Full Equipment List

Each equipment card has a **fixed name, effect, and unlock number** printed on it (the number in
the top-left corner). The **base box holds 12 equipment cards, one per unlock value 1–12**; each
mission puts out a subset (as many as there are players). The confirmed cards:

| Unlock | Card | Effect |
| --- | --- | --- |
| **1** | **Label ≠** | Place the **≠ token** in front of two **adjacent** wires of **different** values in a hand (a permanent public clue). |
| **3** | **Triple Detector** | During a Dual cut, say one value and point at **three** wires in a teammate's stand. |
| **4** | **Post-It** | Place **one Info token** in front of one of **your own** blue wires (free information). |
| **5** | **Super Detector** | During a Dual cut, say one value and point at a teammate's **whole stand** — every wire is a target. |
| **6** | **Rewinder** | Move the detonator dial **back one space**. |
| **7** | **Emergency Batteries** | Turn **one or two used Character cards** back face up (recharge spent Double Detectors). |
| **8** | **General Radar** | Say a number 1–12; **every player** answers whether they hold that value (information, no cut). |
| **9** | **Stabilizer** | If the **next Dual cut fails**, the detonator does **not** move **and a red wire does not explode**. |
| **10** | **X or Y Ray** | During a Dual cut, say **two** values while pointing at **one** wire (it may be either). |
| **11** | **Coffee Mug** | **Skip your turn** and choose who the next active player is. |
| **12** | **Label =** | Place the **= token** in front of two **adjacent** wires of the **same** value in a hand. |

The twelfth base card (the unlock value not shown above) is a second team **Double Detector**,
usable by anyone in addition to each player's Character-card copy. Later Surprise boxes add
further equipment — e.g., the **Fast Pass** (Solo-cut two identical wires even when they are
*not* the last of that value) and the **Disintegrator** (an instant effect: draw a random
Info-token number and every player cuts their matching wires) — plus new mission twists.

> **Note on sourcing:** the base rulebook illustrates the equipment system but does not print the
> full card-by-card list; the effects above are transcribed from the physical cards. Treat the
> Surprise-box cards as spoilers you will meet in later missions.

---

## 10. The Detonator & Difficulty Scaling by Player Count

- The **detonator's starting position is set by the player count** (place it on the section for
  2/3/4/5 players). Each wrong blue/yellow guess advances it one space; reaching the **skull**
  ends the game.
- **How many mistakes are allowed** is small and **varies by mission** (missions can also add
  automatic-loss conditions). As a rough rule, the team can absorb only a **handful** of
  mistakes; every miss both hurts (detonator) and helps (free Info token). The base rulebook
  ties the start to player count rather than publishing a fixed universal number, so **read the
  detonator start off the board for your player count and the mission card for any modifiers.**

**Difficulty is balanced differently at each player count** (this is a deliberate design
feature, not just a component change):

| Players | Stands | Starting hints (opening Info tokens) | Equipment in play | Red/Yellow wires | Feel |
| --- | --- | --- | --- | --- | --- |
| **2** | 2 each | Fewer (fewer players to seed hints) | Fewer (= player count) | **More** red & yellow | Tightest deduction; least margin |
| **3** | Captain 2, others 1 | Few | Few | More | Tense |
| **4** | 1 each | More (one per player) | More | Fewer | "Hits its stride" |
| **5** | 1 each | Most | Most | Fewest | Most forgiving margins, most tools |

So smaller games aren't simply "easier" or "harder" — with fewer players you get **fewer
starting hints and less equipment but face more red/yellow wires**, while larger games hand you
**more hints and more equipment against fewer dangerous wires.** Many reviewers feel the game
"hits its stride" at **4–5 players.**

---

## 11. Communication Rules

Communication is **strictly limited** — this constraint *is* the game:

- **Forbidden:** discussing the wires in your hand, or **hinting/implying their values** in any
  way (no coded talk, no meaningful pauses, no "I have a feeling about that one," no leading a
  teammate toward a specific tile).
- **Allowed:** general **tactics** — advising a teammate to use their Double Detector, asking a
  teammate to trigger an Equipment card you need, and discussing the **specific mission rules.**

You may coordinate *how to use abilities and strategy*, but **never leak information about your
own hidden wires.**

---

## 12. Winning and Losing

- **Win (mission success):** **every tile stand is empty** — all blue and yellow wires cut, all
  all-red hands revealed.
- **Lose (mission failure):** either
  - a **red wire is cut** (instant explosion), **or**
  - the **detonator reaches the skull.**
- **On a loss:** **change the Captain** (pass left) and **replay the same mission.** A failed
  mission is not a campaign dead-end.

---

## 13. Campaign / Mission Structure & Surprise Boxes

Bomb Busters is a **66-mission campaign** with gentle **legacy-lite** onboarding — sealed
Surprise boxes open as you progress, but **nothing is destroyed**, so the game is fully
replayable.

- **Missions 1–3 — Tutorials (Beginners):** teach the core rules; use a **reduced tile set**
  (not all 48 blue wires).
- **Missions 4–7 — Training (Optimists):** practice rounds to prepare for the exam.
- **Mission 8 — The "Exam":** passing it **earns the right to open the first Surprise box.**
- **Missions 9–19 — First Surprise box:** opened after Mission 8; you record wins/losses in the
  **table on the back of the box.** Introduces new equipment cards and small rule twists,
  expanding the equipment system.
- **Later Surprise boxes (5 in total):** each unlocks more missions plus **new equipment, new
  variant rules, and surprises** (e.g., the **Fast Pass** and **Disintegrator** equipment).
  Reviewers deliberately avoid spoiling their contents to preserve discovery. The **"=" and "≠"
  tokens** are played by the **Label** equipment cards and by certain advanced missions.
- **Mission 66 — Finale:** uses the dedicated **Bomb Busters pawn** reserved for this final
  mission ("don't worry about it before then").

Difficulty escalates by adding red/yellow wires, "X out of Y" partial-knowledge setups, tighter
detonator margins, more/varied equipment, and per-mission special rules printed on the Mission
card (**mission rules override defaults**).

---

## 14. Player-Count Variants (Solo / 2 / 3 players)

- **Solo (1 player):** BoardGameGeek lists a **1-player** minimum; the game is played solo by
  controlling multiple stands as your single "hand," following the same deduction/limited-info
  logic against yourself.
- **2 players:** **each player takes 2 tile stands.** The two stands are sorted independently
  but count as one hand. This is the tightest configuration (most red/yellow wires, fewest
  hints and equipment).
- **3 players:** the **Captain takes 2 stands**, the other two players take 1 each.
- **4–5 players:** **one stand each** — the configuration most reviewers consider the sweet
  spot.

The **"2 stands = 1 hand"** rule is the crucial subtlety in low-player games: you still place
only one Info token per failed guess, and hand-wide equipment/mission effects treat both stands
together.

---

## 15. Strategy & Deduction Principles

The puzzle is built from three always-true, always-public facts: **(1)** exactly **4 of each
number**, **(2)** every hand is **sorted ascending**, and **(3)** mistakes are **permanently
recorded** (Info + Validation tokens). From these:

- **Read positions.** A tile's neighbors bound its value. If a teammate's leftmost tiles are
  known low and a later tile is a known 8, the tiles between are constrained to that range.
- **Count to four.** Track how many copies of each number are visible (cut, or shown by Info
  tokens). When the last copies of a value are provably in one hand, that hand can **Solo cut**
  them risk-free — and Validation tokens confirm a number is closed.
- **Turn mistakes into information.** A wrong guess is costly, but the resulting Info token is
  permanent public data. Sometimes a low-risk "probing" guess is worth the detonator space for
  what it reveals — but weigh it against the small mistake budget.
- **Sequence your safe cuts.** Cash in guaranteed cuts (Solo cuts, near-certain Dual cuts)
  before spending detector abilities or taking risks, so you unlock equipment (via cut pairs)
  and shrink the search space first.
- **Use the Double Detector for red safety and 50/50s.** Because a single red among two named
  wires won't detonate, the Double Detector is ideal when a target tile *might* be red, or to
  cover a genuine two-way guess.
- **Unlock equipment on purpose.** Equipment activates when a **pair** of its number is cut —
  prioritize cutting the numbers whose equipment you want online.
- **Respect the communication wall.** You can suggest *using tools*, never *which of your wires
  is what*. The tension comes from deducing rather than telling.

---

## 16. A Full Turn, Worked Example

*(3-player game; the Captain is active.)*

1. Earlier, two "9s" were already cut, and Info tokens around the table reveal several values.
2. The Captain reasons from a teammate's sorted rack: their 3rd tile is a known 7, and Info
   tokens show the tiles right of it. A gap at the 2nd position, bounded below by a revealed 1
   and above by the 7, plus the count of visible 4s, makes that tile **almost certainly a 4** —
   and the Captain holds a 4.
3. **Dual cut:** the Captain points at that tile and says *"this is a 4."*
   - **If right:** the teammate flips their 4 face up (position unchanged); the Captain flips
     one of their own 4s. If that completes all four 4s, a **Validation token** goes on "4," and
     if a "4" equipment exists it is now unlocked.
   - **If wrong (say it's a blue 5):** the detonator advances one space and the teammate puts an
     Info token "5" in front of that tile. (Had it been red, the bomb would explode.)
4. Play passes clockwise. Later, once only the last two 6s remain and both are in one player's
   hand, that player takes a **Solo cut** to clear them with no risk.
5. When a player's only remaining wires are all red, they take **Reveal your red wires** to
   empty their hand. When every rack is empty, the **bomb is defused — the team wins.**

---

## 17. Edge Cases, Clarifications & FAQ ("Every Corner")

- **Two stands, one Info token.** A player with **2 stands** is **one hand**, so a failed guess
  against them places only **one** Info token (in front of the stand of their choice).
- **Independent sorting, single hand.** Two stands are sorted as **separate ascending runs**,
  yet all hand-wide rules (equipment, mission rules, Info tokens, "all remaining wires red,"
  "hold all remaining yellows") treat them as **one hand.**
- **Character cards are identical (base game).** All five grant the same one-shot **Double
  Detector**; only art/flavor differs. The stronger detectors are **equipment**.
- **Detectors are blue-only.** Per the official **FAQ**, you **cannot name "yellow"** with the
  Double/Triple detector.
- **Double Detector vs. red.** If **exactly one** of the two named wires is red, it **does not**
  detonate — the Info token goes on the **non-red** named wire. (You still lose the detonator
  space if the play counts as a failure.)
- **Both named wires correct (Double Detector).** The teammate **doesn't reveal which** and
  **cuts the wire of their choice.**
- **Active player's intended wire stays hidden on a failure.** Only the teammate's pointed-at
  wire is revealed/marked; you never expose your hand on a miss.
- **Yellow Info tokens.** Only used to mark a wire revealed to be **yellow**; ordinary numbered
  Info tokens mark blue values. **No yellow Info token may be used during setup** — the opening
  token must be on a **blue** wire.
- **Solo cut requires certainty, not luck.** Allowed only when the wires cut are provably the
  **last** of that value (all 4 in hand, or the last 2 after the other 2 are cut). Same for
  yellow (must hold **all** remaining yellows).
- **Reveal-red only when the whole remaining hand is red** — you can't reveal reds while you
  still hold blue/yellow wires.
- **Equipment unlocks on a *pair*, not all four.** Cutting **2** of the number is enough to
  activate that equipment card.
- **Equipment can fire off-turn and be chained.** Most equipment is usable by anyone at any
  time, even out of turn, and several can be used in a row.
- **Equipment quantity = player count**, chosen per the mission.
- **X or Y Ray targets a single wire with two numbers.** On its own you point at **one** target
  wire and name **two** candidate numbers (the wire may be either). It may also be **combined**
  with the Double/Triple/Super Detector to name two values across several wires (official).
- **Super Detector targets a whole player.** You name one number and point at a **player's whole
  stand**, and every wire that player holds becomes a target wire for the guess.
- **Validation tokens are advisory but vital** — they don't change legality directly but prevent
  fatal mistakes by clearly marking closed numbers.
- **Partial special wires ("X out of Y") stay permanently uncertain** — the set-aside tile is
  never revealed; the "?" pawns mark information the team never gets.
- **Empty-handed players are skipped**, and the mission continues.
- **Restart on loss, rotate Captain** — replay the same mission with the next Captain.
- **Mission card overrides defaults** — a mission's back-of-card rules win for that mission.
- **"=" / "≠" tokens** are placed by the **Label =** and **Label ≠** equipment cards (unlock 12
  and 1): mark two **adjacent** wires in a hand as the **same** ("=") or **different** ("≠")
  value — a permanent public deduction clue. Some advanced missions also use them directly per
  the Mission card. *(Advanced/spoiler
  content; not detailed in the base rules.)*

---

## 18. Glossary / Lexicon

- **Bomb disposal expert** — a player.
- **Active bomb disposal expert** — the player whose turn it is.
- **Captain** — the starting player for the mission (rotates left each mission); marked by the
  Captain Character card.
- **Hand** — all wires a player controls. **Two tile stands in front of one player = one hand.**
- **Dual cut** — cut one of your wires + one matching teammate wire by naming its value.
  (Official rulebook spelling: **"Duo cut."**)
- **Solo cut** — cut the last 2 or 4 of a value entirely from your own hand.
- **Reveal your red wires** — safely reveal an all-red remaining hand.
- **Info token** — records the true value of a wrongly-guessed wire.
- **Validation token** — marks a value whose all-4 copies are cut.
- **Detonator** — the mistake track; reaching the skull loses the game.
- **Double Detector** — the one-shot character ability: name a value, point at two wires.
- **Equipment** — shared single-use tools unlocked by cutting pairs.

---

## 19. Reception & Awards

- **Spiel des Jahres 2025 (Game of the Year)** — the hobby's most prestigious mainstream award.
  Bomb Busters gave designer **Hisashi Hayashi** the first Spiel des Jahres win for a
  Japanese/Asian designer, and continued a strong run of **cooperative** games taking the top
  prize.
- Widely praised for **accessible rules with deep deduction**, tense push-your-luck moments, a
  **gentle legacy-lite campaign** that teaches itself, and strong replayability across 66
  missions. Common critiques note that difficulty and feel **shift with player count** and that
  the experience is strongest at 4–5 players. Typical session length is a brisk **15–20+
  minutes** per mission.

---

## 20. Sources

- [Bomb Busters — Official English Rulebook (Cocktail Games, PDF)](https://www.cocktailgames.com/wp-content/uploads/2023/10/BombBusters_rules_EN.pdf)
- [Bomb Busters — English Rulebook (mirror, PDF)](https://meepletron-storage.s3.us-east-2.amazonaws.com/resources/bomb-busters-rulebook.pdf)
- [Bomb Busters | BoardGameGeek](https://boardgamegeek.com/boardgame/413246/bomb-busters)
- [Bomb Busters Official FAQ (English)](https://boardgamegeek.com/filepage/290942/bomb-busters-faq-english)
- [Bomb Busters : la FAQ officielle — Cocktail Games](https://www.cocktailgames.com/nos-jeux/bomb-busters-faq/)
- [Spiel des Jahres 2025: Bomb Busters (official)](https://www.spiel-des-jahres.de/en/the-spiel-des-jahres-2025-is-bomb-busters/)
- [Bomb Busters is the Game of the Year 2025 — Pegasus Spiele](https://news.pegasus.de/en/bomb-busters-game-of-the-year-2025/)
- [Co-op designs dominate as Bomb Busters seals Spiel des Jahres win — Board Game Wire](https://boardgamewire.com/index.php/2025/07/14/co-op-designs-continue-to-dominate-board-gamings-biggest-prize-as-bomb-busters-seals-spiel-des-jahres-win/)
- [How to Play Bomb Busters — Merchants of Play](https://merchantsofplay.com/howtoplay/bomb-busters/)
- [How to Play Bomb Busters: A Beginner's Guide — Goblin Games](https://www.goblingames.com.au/blogs/news/how-to-play-bomb-busters-a-beginners-guide)
- [Rulesplainer { Bomb Busters } — Hacking Board Games](https://hackingboardgames.com/rulesplainer-bomb-busters/)
- [Bomb Busters review — Wargamer](https://www.wargamer.com/bomb-busters/review)
- [Bomb Busters review — GamesRadar+](https://www.gamesradar.com/games/board-games/bomb-busters-review/)
- [Bomb Busters Review — Shelf Gamer](https://shelfgamer.com/reviews/bomb-busters/)
- [Bomb Busters — Careful Now, That One Might Go Boom (Tabletopping)](https://tabletopping.games/2025/07/31/bomb-busters/)
- [Double detector: Yellow allowed? — BGG thread](https://boardgamegeek.com/thread/3398561/double-detector-yellow-allowed)
- [How do you play with 2 players? — BGG thread](https://boardgamegeek.com/thread/3414555/how-do-you-play-with-2-players)
- [Mission 9-20 spoiler question — BGG thread](https://boardgamegeek.com/thread/3418918/mission-9-20-spoiler-question)
- [Bomb Busters — Wikipedia (DE)](https://de.wikipedia.org/wiki/Bomb_Busters)

*Document compiled July 2026. Anchored on the official Cocktail Games rulebook (extracted in
full) and cross-referenced against the official FAQ, publisher/award pages, and multiple
independent rules explainers. The equipment cards (§9) are enumerated with their exact names,
effects, and unlock numbers from the physical cards. Where the base rulebook still leaves a
detail implicit — notably the precise detonator track length per player count — the text flags
the uncertainty rather than inventing specifics; those details are best confirmed from the
physical components and higher-numbered mission boxes.*
