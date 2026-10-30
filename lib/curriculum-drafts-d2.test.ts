import { test, expect } from 'bun:test'
import { findArea } from './curriculum'

// G-03 (GTM-10) drafts: every D2 module carries a lesson body.
// Bodies are drafts pending Alex's voice review — this only asserts presence, not prose.

test('every D2 module has a non-empty body', () => {
  const area = findArea('d2-gtm-systems')
  expect(area).toBeDefined()
  for (const section of area!.sections)
    for (const module of section.modules)
      expect(module.body?.trim().length ?? 0).toBeGreaterThan(0)
})
