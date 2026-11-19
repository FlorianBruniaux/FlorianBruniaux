import assert from 'node:assert/strict'
import test from 'node:test'
import { loadManifest, renderProfile, validateManifest } from '../scripts/ecosystem.mjs'

const source = loadManifest()
const website = 'https://ctxharness.bruniaux.com/'

test('ctxharness can use its website as the profile link while retaining its repository', () => {
  const candidate = structuredClone(source)
  Object.assign(candidate.projects.find(project => project.id === 'ctxharness'), { website, profile_link: 'website' })
  const before = renderProfile(validateManifest(source))
  const after = renderProfile(validateManifest(candidate))
  const ctx = after.split('\n').find(line => line.startsWith('| **[ctxharness]'))
  assert.ok(ctx.includes(`**[ctxharness](${website})**`))
  assert.ok(ctx.includes('[GitHub](https://github.com/FlorianBruniaux/ctxharness)'))
  const otherRows = text => text.split('\n').filter(line => line.startsWith('| **[') && !line.startsWith('| **[ctxharness]'))
  assert.deepEqual(otherRows(after), otherRows(before))
})

test('profile website selection requires an HTTPS website', () => {
  const candidate = structuredClone(source)
  Object.assign(candidate.projects.find(project => project.id === 'ctxharness'), { website: null, profile_link: 'website' })
  assert.throws(() => validateManifest(candidate), /HTTPS website/)
})

test('unknown profile link policies are rejected', () => {
  const candidate = structuredClone(source)
  candidate.projects.find(project => project.id === 'ctxharness').profile_link = 'unknown'
  assert.throws(() => validateManifest(candidate), /profile link/)
})
