# Report pages: integration note for the platform team

The teacher report (`educators/index.html`) and district report (`district.html`) in this repository run on **fictional sample data only**. They never read a student's browser save. This note says what a host platform must supply to run the same reports on real students, and what the numbers mean.

## Input: one roster row and one stored record per student

**Roster row** (from the platform):

| Field | Meaning |
| --- | --- |
| `id` | Opaque student id. Never shown. |
| `name` | Display name. |
| `grade` | 1–12. Decides the fact set; it overrides any grade inside the record. |
| `school`, `classId`, `className`, `teacher` | Used for grouping and labels only. |

**Stored record**: the JSON the game keeps under `mathArcadePathways.v2`, also returned by `ArcadePractice.exportRecord()`. The reports rely on exactly these fields:

| Field | Used for |
| --- | --- |
| `facts["<op>:<a>:<b>"].stage` (0–4), `.refresh` (0–2) | Confirmed = `stage >= 3` and `refresh` is 0. Steps = `min(3, stage)`. |
| `facts[...].misses`, `.attempts`, `.failedDay`, `.lastSuccess`, `.first` | Stuck facts and their miss counts; first day seen. |
| `checks[]`: `pathway`, `day`, `official`, `valid`, `passed`, `correct`, `attempts`, `accuracy`, `balanced`, `byOperation`, `missed` | Check days passed per pathway, check history, facts missed in each check. |
| `trophies[pathway]` = day earned | Trophies earned, Finished. |
| `days["YYYY-MM-DD"]`: `cards`, `correct`, `ms`, `steps`, `confirmed` | First and last day played, minutes, accuracy, growth, pace, projection. |

**The server must keep** `days`, `facts[].misses`, `facts[].first` and `checks[].missed`; without them there is no time on task, growth, pace or "what to teach next". `checks[].responses` is not used by the reports and may be discarded, **but** the game itself drops any stored check that has no `responses` array when it loads a record, so return `responses: []` (not a missing field) when handing a record back to the game. `facts[].cleared`, `facts[].due`, `activity` and `gameChecks` are not used by the reports.

## Summary module: `reporting/summary.js`

Load `practice-pathways.js` first; the module asks the engine for each grade's fact bank and rules, so totals cannot drift. In the browser it is `window.ArcadeReporting`; in Node, `require('./reporting/summary.js')`. It never touches browser storage. (The report pages load `reporting/isolate.js` before the engine so the engine does not open a local player save either; a host that already scopes `ArcadeStorage` to the signed-in user should not load the engine's default instance on a staff page.)

```js
const summary = ArcadeReporting.summarize(record, rosterRow, { today: '2027-02-01' });
// options: today (YYYY-MM-DD, default the local date), milestone ('2027-05-10'), target ('2027-04-26'),
//          onPaceRatio (0.9), behindRatio (0.6), graceDays (3), projectionDays (14)
```

`summary` contains: `student`, `grade`, `operationList`, `pathwayList`, `facts {total, confirmed, percent, steps, stepsTotal, started, notStarted}`, `operations[op] {total, confirmed, percent, steps, started, notStarted, stuck}`, `checks {byPathway[p] {passes, needed, spanMet, complete, taken, last, nextEligible}, history[], passedDays, neededDays}`, `trophies {earned[], count, possible, won, wonDay}`, `stuck[] {id, text, answer, misses, attempts, reason}`, `notStarted[]`, `activity {firstDay, lastDay, daysSinceLast, playedLast7, minutesThisWeek, minutesLastWeek, cardsThisWeek, accuracyThisWeek, ...}`, `series[] {day, confirmed, minutes, cards, correct, steps}` and `pace`.

Group helpers, all taking an array of summaries:

- `aggregate(list)`: counts by pace status, on-pace share, median % confirmed, played in the last 7 days, trophies earned and possible, students who have won, minutes per student this week and last week, totals per operation.
- `mostMissed(list, {limit, minStudents, op})`: the facts the most students are stuck on, each with its students and miss counts.
- `weeklySeries(list, {today, weeks})`: confirmed facts, minutes and active students per week.
- `groupBy(list, fn)`, `byAttention` (sort: needs attention first), `csv(rows)`, `gradeInfo(grade)`.

"This week" is the seven days ending today; "last week" is the seven before. Minutes are answer time only (`days[].ms`, at most three seconds per card), not time in the game.

## The pace rule

A straight line from the student's **first day played** to **every fact of their grade confirmed by the target day**, two weeks before the district milestone (target 2027-04-26, milestone 2027-05-10; both are options).

`expected = clamp((today − firstDay) / (target − firstDay), 0, 1) × total facts`

| Status | Rule |
| --- | --- |
| Finished | Every trophy for the grade is earned (3 in grades 1–2, 5 from grade 3). |
| Not started | No day of practice recorded. |
| On pace | Confirmed ≥ 90% of expected, or within the first 3 days, when nothing can be confirmed yet. |
| Behind | 60% to under 90% of expected. |
| At risk | Under 60% of expected. |

`pace.projection` is the day every fact would be confirmed at the student's rate over the last 14 days, or `null` when nothing was confirmed in that time.

## Who may see what

Authorization is the host's job; these pages render whatever they are given.

- **Teacher**: only the students on that teacher's own roster. The class picker on the sample page stands in for "the signed-in teacher's class". Build the page's data from the teacher's roster on the server; do not send other classes to the browser.
- **District**: aggregates by grade and class, with drill-down to a class and then a student for staff allowed to see student-level data. The district page links to `educators/index.html?class=<classId>&student=<studentId>&from=district`.
- Replace the sample loader (`reporting/sample.js` and `reporting/sample-data.js`) with the host's data and remove the "Sample data · fictional students" label only when the page shows real, authorized data.

## Not recorded

The game does not record which game was played, the wrong answer a student typed, or how fast each answer was outside the 90-second checks. A stuck fact tells a teacher *which* fact and how often it was missed, not what the student answered.

## Sample data

`reporting/sample-data.js` is generated by `node tools/generate-report-sample.cjs` (about one to two minutes), which plays the real practice engine for about 300 invented students on a simulated calendar ending 2027-02-01. Every school, class, teacher and student in it is invented.
