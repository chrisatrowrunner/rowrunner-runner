// events.ts — the games a runner can work. For the pilot this is a local list
// (one match); it's shaped so more events just drop in, or it can later be
// swapped for a Supabase `events` fetch without touching the screens.
//
// NOTE: orders aren't tagged with an event id yet, so the queue isn't filtered
// per event — picking an event sets the runner's context (shown in the header).
// To scope the queue per game later: add `event_id` to the `orders` table, have
// the fan app write the active event, and filter the queue by selectedEvent.id.

export interface RunnerEvent {
  id: string
  /** home team, e.g. "URI" */
  home: string
  /** visiting team, e.g. "La Salle" */
  away: string
  /** e.g. "Men's Soccer" */
  sport: string
  /** e.g. "URI Soccer Complex" */
  venue: string
  /** human kickoff label, e.g. "Today · 7:00 PM" (edit per game) */
  startsAt: string
}

export const EVENTS: RunnerEvent[] = [
  {
    id: 'uri-lasalle-msoc',
    home: 'URI',
    away: 'La Salle',
    sport: "Men's Soccer",
    venue: 'URI Soccer Complex',
    startsAt: 'Today · 7:00 PM',
  },
]

/** Look up an event by id (used to restore the runner's last pick). */
export function eventById(id: string | null | undefined): RunnerEvent | null {
  if (!id) return null
  return EVENTS.find((e) => e.id === id) ?? null
}
