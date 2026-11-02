# The Missing Piece: Collaboration Across Difference

**Unit:** MQBS2010 Enhancing Employability Skills, Assessment 3
**Due:** 2 November
**Lens:** Collaboration across difference: inclusive facilitation, conflict resolution, valuing diverse expertise
**Aim:** Prioritise inclusivity to make communication and collaboration more effective.

Printable cards: [missing-piece-cards.pdf](missing-piece-cards.pdf)

## Web app

`index.html` is a playable version with no build step. Run it locally with:

```
python -m http.server 3899
```

then open http://localhost:3899.

- **Random roles every round.** The facilitator picks a scenario and team size (4 or 5), and roles are dealt at random.
- **Two ways to deal:** pass one device around (tap to reveal, hide, pass on), or everyone opens their own card on their phone. In phone mode the facilitator's screen lists each player with a personal code: the game code plus their number (e.g. `G5 KQ7X 3`), or a personal link. Each code opens exactly one card, so no two players can get the same role. The game code seeds the shuffle, so every phone deals consistently without a server.
- **Facilitator screen:** the brief to read aloud, a 6-minute timer (pause, +1 minute, optional nudge, chime at zero), the reveal where each missing piece is slotted in for scoring, and debrief questions for round 1 and round 2.
- Files: `index.html`, `css/styles.css`, `js/data.js` (all scenario text, edit here), `js/app.js`.

---

## Assessment context

The WIL simulation and the last few weeks of class focus on diversity, equity and inclusion (DEI) practices and global citizenship. The training activity is built through one of these lenses:

- **Social responsibility:** human rights framing, understanding local context, considering downstream impacts
- **Power, privilege and bias awareness:** identifying implicit bias, recognising how power shows up in teams
- **Collaboration across difference** *(chosen lens)*: inclusive facilitation, conflict resolution, valuing diverse expertise
- **Cultural humility:** curiosity over certainty, reflecting on assumptions, adapting to different norms

Plan: give teams a scenario and let them solve the problem.

## How the game works

- Teams of 5. One person reads the client brief aloud.
- Each person gets a role card with one private piece of information and a rule.
- Senior roles hold confident, complete-looking plans and may **speak freely**.
- Junior or quiet roles hold the information the team actually needs, but may **only share it if someone asks** about a specific topic.
- Teams have **6 minutes** to agree on a plan.
- The lesson: a team only finds the missing pieces if it asks questions and draws out quieter members. Hierarchy and confidence can hide expertise.

**Optional scoring:** 1 point for each hidden piece that makes it into the final plan.

**Groups that aren't 5:** drop Seat 2 first, or give one person two cards.

---

## Scenario 1: Launch a new 24-hour gym in Parramatta (in the PDF)

**Brief:** You are a marketing agency team. In 6 minutes, agree on a launch plan covering who the target customers are, which channels and messages you'll use, and one launch offer or event.

| Seat | Role | Information | Rule |
|---|---|---|---|
| 1 | **Account Director**: Senior, owns the client relationship, has the final say | Has a plan the client loves: a Friday-night launch party with a DJ, free 7-day trial passes for attendees, and a standard 12-month membership deal | Speak freely |
| 2 | **Social Media Lead**: Runs social campaigns | A 4-week English-only Instagram/TikTok ad campaign targeting 18–35 year olds in Western Sydney, using influencers. It uses the whole budget | Speak freely |
| 3 | **Junior Designer**: Grew up in Parramatta, new, doesn't like interrupting | Many locals speak Hindi, Arabic or Mandarin at home. English-only ads miss a large group | Only if asked about **the local community / who lives in Parramatta** |
| 4 | **Data Analyst**: Quiet, works with survey results | Survey: the top local barrier to joining a gym is no women-only training times | Only if asked about **customer research / why people don't join gyms** |
| 5 | **Intern**: Second week, unsure their view counts | Local uni students prefer flexible weekly memberships over 12-month contracts | Only if asked about **students, pricing or membership options** |

**Facilitator's full picture:** ads and messaging in several languages (Hindi, Arabic, Mandarin), women-only training sessions, and flexible weekly membership options alongside the standard deal.

---

## Scenario 2: Welcome Week for new students (draft, not yet in the PDF)

Same mechanic, different setting. Use it as round 2, where teams try to apply what they learned in the first debrief.

**Brief:** Plan a welcome event for new students at a Western Sydney university. You are the student experience team. In 6 minutes, agree on who the event is for, the time, venue and activities, and how you'll promote it.

| Seat | Role | Information | Rule |
|---|---|---|---|
| 1 | **Events Manager**: Senior, has the final say | Has booked the Thursday-night campus bar for a welcome party: free drink tokens, a DJ, and speeches from the Dean on the main stage | Speak freely |
| 2 | **Marketing Coordinator**: Runs student comms channels | An English-only Instagram campaign and one all-student email sent 2 days before. Ready to go and uses the whole promotion budget | Speak freely |
| 3 | **International Student Ambassador**: Arrived from overseas last year, new to the team, doesn't like to interrupt | Many new students don't drink alcohol for religious or cultural reasons. A bar-based event signals "not for you" | Only if asked about **who the students are / their backgrounds** |
| 4 | **Accessibility Officer**: Quiet, works behind the scenes | The bar's stage has no ramp and no hearing loop. About 1 in 5 students have registered a disability or health condition | Only if asked about **the venue or access needs** |
| 5 | **Mature-Age Student Rep**: Part-time, unsure the team takes their view seriously | Many commencing students work evenings or have caring responsibilities. A Thursday-night event shuts them out | Only if asked about **timing or students' commitments** |

**Facilitator's full picture:** an alcohol-free daytime event (or a choice of times), in an accessible venue with captioned or looped speeches, promoted in several languages and on more than one channel, sent well ahead of time.

---

## Debrief questions

- Who spoke most? Who was asked for their view?
- How many hidden pieces did your team find? What question would have uncovered the rest?
- Seat 1 had the final say. How did that shape the conversation?
- Seat 2's plan used the whole budget. How did the team handle the conflict when new information came up?
- Round 2: what did you do differently? (e.g. asking each person "what do you know that we don't?")
- Where does this happen in real workplaces or uni group work?

## To do

- [x] Facilitator/debrief screen for each scenario (full picture + questions), in the web app
- [ ] Printable cards for Scenario 2 in the same design as the PDF
