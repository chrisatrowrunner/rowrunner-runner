// seat.ts — how a delivery destination reads on screen.
//
// Copied VERBATIM into the fan app, runner app, and KDS (src/lib/seat.ts) and
// mirrored by the label printer (label.py `_seat_str`), so every app formats a
// location the same way. Keep the copies in sync.
//
// Zone venues (unnumbered seating, e.g. the URI Soccer Complex) carry
// `label` ("Section A2" / "Zone B") + `detail` ("South bleachers"). Numbered
// venues fall back to section/row/seat — those render exactly as before.
import type { Seat } from '../types'

export interface SeatLines {
  /** broad location — "South bleachers" / "Section 204" */
  area: string
  /** where exactly to go — "Section A2" / "Row J · Seat 17" */
  spot: string
  /** true for zone venues */
  isZone: boolean
  /** compact pill text — "Section A2" / "Sec 204 · J17" */
  short: string
  /** one line — "Section A2 · South bleachers" / "Sec 204 · Row J · Seat 17" */
  text: string
}

export function seatLines(seat: Seat): SeatLines {
  if (seat.label) {
    const detail = seat.detail ?? ''
    return {
      area: detail,
      spot: seat.label,
      isZone: true,
      short: seat.label,
      text: detail ? `${seat.label} · ${detail}` : seat.label,
    }
  }
  return {
    area: `Section ${seat.section}`,
    spot: `Row ${seat.row} · Seat ${seat.seat}`,
    isZone: false,
    short: `Sec ${seat.section} · ${seat.row}${seat.seat}`,
    text: `Sec ${seat.section} · Row ${seat.row} · Seat ${seat.seat}`,
  }
}
