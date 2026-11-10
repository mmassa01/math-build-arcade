# Fluency Arcade educator module

Working HTML/CSS/JavaScript reporting preview, prepared for later MTSS integration. No MTSS deployment, database migration, account connection, or production record import has occurred. The public preview must remain fictional-data-only.

## Run the integration kit

Extract `integration-kit.zip`, serve its `dist` directory with any static web server, and open `/educators/`. Run `node tests/educator-dashboard.mjs` from the extracted root for model checks. The package includes the HTML template, styles, ES modules, TypeScript data contract, synthetic data generator, SQL starter and tests. It does not require the arcade game assets. The Back to arcade links are optional host navigation and should be replaced when embedded.

## Files and host mounting

`index.html` is the reusable accessible template. `dashboard.css` provides the responsive design. `dashboard.mjs` exports `mountDashboard(root, {adapter, initialRole})` and returns `{destroy()}` after loading. `bootstrap.mjs` explicitly selects the sample adapter. The report model is independent of DOM and networking. No third-party runtime libraries or build tools are required.

Copy this folder into a host route or render the template inside an isolated page/shadow root. For an isolated root, include dashboard.css inside that root. For MTSS SPA integration, namespace the CSS or isolate it; do not apply its global body/heading styles across the MTSS shell. Preserve the element IDs within one module instance. Mount once and call destroy() on route teardown. This preview does not prove compatibility with an unseen MTSS codebase.

```js
import {mountDashboard} from './dashboard.mjs';
import {httpAdapter} from './adapter.mjs';
const instance = await mountDashboard(document, {
  adapter: httpAdapter('/api/fluency/reporting'),
  initialRole: 'teacher'
});
// On route teardown: instance.destroy();
```

`httpAdapter` only permits same-origin endpoints and uses the host's configured same-origin session. There is no endpoint implemented by this demo. Do not replace sample data with real students on this public static site.

## ReportingDataset v1.0 contract

All arrays are normalized and linked by stable IDs. All dates are ISO school-local calendar dates (YYYY-MM-DD), calculated server-side in the district's timezone. Event timestamps should additionally retain UTC instants in storage. Never derive school days by slicing UTC timestamps around midnight.

| Collection | Required record shape |
| --- | --- |
| meta | mode, asOf, district, timezone, rulesVersion, responseLimitMs |
| schools | id, name |
| classes | id, schoolId, grade, name, teacher |
| students | id, schoolId, classId, grade, name |
| facts | id, op, a, b, answer, text |
| factStates | studentId, factId, stage (0–4), refresh (0–2), due, lastSuccess, rulesVersion |
| checks | id, studentId, pathway, date, durationSeconds (90), correct, incorrect, timeouts, attempted, official, valid, rulesVersion |
| sessions | id, studentId, date, game, demo, practiceMs |
| responses | id, studentId, factId, date, game, outcome, elapsedMs (0–3000), assisted, demo |
| snapshots | studentId, pathway, date, fullSetConfirmed, rulesVersion |

The sample generator contains 72 fictional students, 6 classrooms and 3 schools, with full assigned fact-state records across all four operations. It includes missing checks, practice gaps, retention refreshes, wrong answers, timeouts, and a short cross-game response history. The snapshots and fact states are independently authored fixtures, not reconstructed from that short response sample. No fixtures are actual district results.

## Facts, stages and denominator rules

The fact catalog matches the current arcade foundation: addition with sums through 20 (121), nonnegative subtraction with starting numbers through 20 (231), multiplication 0 through 12 (91), related division by 1 through 12 with quotients 0 through 12 (156). Total 599. Addition and multiplication reversals share canonical IDs; subtraction and division retain direction. Mixed reuses those 599 records and never duplicates them.

The dashboard consumes authoritative recorded states; it never awards milestones. Map stage 0 or refresh>0 to Learning, 1–2 to Strengthening, 3 to Provisional, and 4 without refresh to Confirmed. These are reporting labels for current pilot stages, not a new mastery policy or validated benchmark. A correct card can clear today's immediate practice without establishing retained mastery. The current source engine also carries its own policy version and eligibility limit; reconcile policy versions and timing eligibility explicitly during integration rather than inferring mastery from the three-second display alone.

Confirmed fact rate = confirmed student-fact records / all assigned student-fact records in scope. Full-set retention = students whose entire selected assigned set is currently confirmed / rostered students. Retention growth uses stored snapshots with the same students at both endpoints. Never relabel fact percent as percent of students. In production, assignment denominators must come from versioned student assignments, not a globally assumed bank. Stage-zero assigned states must be supplied so unseen facts are not dropped from the denominator.

Practice participation means at least one non-demo session in the latest 7 calendar days, regardless of the check review window. Checks use only the latest valid official 90-second check per student and selected pathway within the window. All operations selects the Mixed check; it does not combine four unrelated operation checks. Missing checks are excluded from score medians and shown in coverage. Incorrect and timeouts are distinct, mutually exclusive outcomes; attempted = correct + incorrect + timeouts. Medians are calculated per student, not from raw school answer totals. No game wins, coins, activity duration or cosmetics count as fluency mastery.

## Security and production adapter checklist

1. Authenticate through existing MTSS sessions. Resolve tenant and role on the server, never from query strings, client buttons, or request-supplied student IDs alone.
2. Teacher queries join authorized teacher-to-class assignments; principal queries join authorized school memberships; district queries require the appropriate district grant. Apply the same checks to detail, export and ingestion routes. This demo's Teacher/School/District controls are preview navigation only, not authorization.
3. Authorize every roster lookup, scope database queries before fetching records, minimize names in district responses, log access, use no-store responses for sensitive reports, and use the host's approved retention and deletion policies. Do not ship all student data to a teacher and rely on browser filtering.
4. Use a reviewed host adapter to map existing IDs and schemas. Use parameterized queries with tenant + student scope. Do not create a competing student identity system.
5. Ingest practice events using an idempotency key, preserve exact outcome and rule version, and update authoritative projections transactionally using the arcade's policy engine. Exclude demos from academic records. Do not trust client-supplied mastery, identity or school IDs.
6. Record original evidence, rules versions, delayed-review dates, official check status and assignment catalog versions. Support interrupted/invalid checks without awarding official passes. Mixed operation-balance thresholds require operation-level check evidence beyond the summary contract; extend the API before using it to verify trophies.
7. Review `schema.sql` as a portable SQLite/D1 starter, not a migration to execute blindly. Integrate with existing roster tables and institutional security controls. There is no production API, token handling, enrollment editing, or tier assignment in this module.
8. For large rosters, use scoped server-side aggregates and pagination. The all-record in-memory adapter is intentionally limited to this sample. Historical roster transfers and assignment changes require explicit cohort membership handling.

## UI behavior

Teacher: actionable fact groups, individual roster, student operation breakdown, per-fact history, and official check evidence. School: classroom aggregates with teacher drill-down. District: school aggregates with school/class drill-down. Filters, missing-data states, measure definitions and CSV export all work on the same normalized dataset. Suggested fact groups are teacher-review prompts, not automatic MTSS tier, disability, eligibility or intervention decisions.

Exports reflect current filters and fact groups. CSV cells are quoted and spreadsheet formula prefixes escaped. Sample exports retain fictional-data labels. Production exports must be authorized and audited server-side. All text from records is HTML escaped in the UI.

The template is a preparation artifact, not a claim of a deployed MTSS integration. Keep live records out of this public preview.
