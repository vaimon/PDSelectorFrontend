# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students** — first- and second-year bachelors of ЮФУ ФИИТ, ~200 a year. They assemble their own project teams during the October window: questionnaire, catalogue, requests, invites, join links. Mostly on phones.
- **Organizers (admins)** — one to three people on desktop. They watch the набор, fix composition by hand on the board, manage settings and access, and hand the result over to core.

## Product Purpose

Self-assembly of ~30 project teams toward a target of 3 first-years + 3 second-years each, inside one window (October 2026). Success: every registered student sits in a team at close. Teams short of the target are flagged for the organizers, not blocked or auto-dissolved.

## Positioning

Subordinate to core (Проектная деятельность ЮФУ ФИИТ). Exactly one active набор; after core imports the roster and marks the hand-over, team-selection is read-only for everyone, admins included.

## Capabilities and Constraints

- Terms: «набор» (never «отбор»), «тимлид» (never «капитан»). Russian UI only.
- Roles: USER, STUDENT, ADMIN. ADMIN is the only grantable role.
- Hard lock after the window closes for students and team leads; admins exempt until hand-over.
- Targets are set per набор with per-team overrides; course 1 = first-year places, course ≥ 2 = second-year places.
- 152-ФЗ: RF hosting, self-hosted fonts, profiles and contacts visible only to registered students and admins.
- Frontend: React + Vite, plain CSS on Console tokens, no UI kit.

## Brand Commitments

- Console design system shared with core; tokens in `design/theme.css` flow one way, core → this fork.
- Logo: core's `‹ ›` brackets plus a team glyph (`design/logo-ts.svg`).

## Product Principles

1. The organizer sees the gap, not the inventory.
2. Irreversible actions say exactly what they lock.
3. Same family as core; the tool disappears into the task.
