export type Operation = 'add' | 'sub' | 'mul' | 'div';
export type Pathway = Operation | 'mixed';
/** School-local ISO calendar day, resolved using meta.timezone. */
export type SchoolDay = string;
export interface ReportingDataset {
  schemaVersion: '1.0';
  meta: {mode: 'sample' | 'live'; asOf: SchoolDay; district: string; timezone: string; rulesVersion: string; responseLimitMs: 3000};
  schools: {id: string; name: string}[];
  classes: {id: string; schoolId: string; grade: number; name: string; teacher: string}[];
  students: {id: string; schoolId: string; classId: string; grade: number; name: string}[];
  facts: {id: string; op: Operation; a: number; b: number; answer: number; text: string}[];
  factStates: {studentId: string; factId: string; stage: 0|1|2|3|4; refresh: 0|1|2; due: SchoolDay|null; lastSuccess: SchoolDay|null; rulesVersion: string}[];
  checks: {id: string; studentId: string; pathway: Pathway; date: SchoolDay; durationSeconds: 90; correct: number; incorrect: number; timeouts: number; attempted: number; official: boolean; valid: boolean; rulesVersion: string}[];
  sessions: {id: string; studentId: string; date: SchoolDay; game: string; demo: boolean; practiceMs: number}[];
  responses: {id: string; studentId: string; factId: string; date: SchoolDay; game: string; outcome: 'correct'|'incorrect'|'timeout'; elapsedMs: number; assisted: boolean; demo: boolean}[];
  snapshots: {studentId: string; pathway: Pathway; date: SchoolDay; fullSetConfirmed: boolean; rulesVersion: string}[];
}
export interface ReportingAdapter {load(options?: {signal?: AbortSignal}): Promise<ReportingDataset>}
export interface DashboardInstance {destroy(): void}
export declare function mountDashboard(root: Document | HTMLElement | ShadowRoot, options: {adapter: ReportingAdapter; initialRole?: 'teacher'|'school'|'district'}): Promise<DashboardInstance|undefined>;
// Role navigation is cosmetic in this preview. Host authorization is mandatory.
