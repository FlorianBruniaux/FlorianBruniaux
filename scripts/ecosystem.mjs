#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const defaultManifestPath = resolve(scriptDirectory, '../ecosystem/projects.json')
const RTK_GITHUB = 'https://github.com/rtk-ai/rtk'
const RTK_WEBSITE = 'https://www.rtk-ai.app/'
const PROFILE_START = '<!-- BEGIN GENERATED OPEN SOURCE GALAXY -->'
const PROFILE_END = '<!-- END GENERATED OPEN SOURCE GALAXY -->'
const README_START = '<!-- BEGIN GENERATED RELATED PROJECTS -->'
const README_END = '<!-- END GENERATED RELATED PROJECTS -->'

export function loadManifest(manifestPath = defaultManifestPath) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'))
}

export function validateManifest(manifest) {
  if (!Array.isArray(manifest.routes) || manifest.routes.length !== 5) {
    throw new Error('manifest must define exactly 5 routes')
  }
  if (!Array.isArray(manifest.projects) || manifest.projects.length !== 16) {
    throw new Error('manifest must define exactly 16 projects')
  }

  const routeIds = new Set()
  for (const route of manifest.routes) {
    if (!route.id || routeIds.has(route.id)) {
      throw new Error(`duplicate or missing route id: ${route.id ?? '<missing>'}`)
    }
    routeIds.add(route.id)
  }

  const projectIds = new Set()
  for (const project of manifest.projects) {
    if (!project.id || projectIds.has(project.id)) {
      throw new Error(`duplicate or missing project id: ${project.id ?? '<missing>'}`)
    }
    projectIds.add(project.id)
    if (!routeIds.has(project.route)) {
      throw new Error(`${project.id} uses unknown route ${project.route}`)
    }
    if (!Array.isArray(project.tags) || project.tags.length > 3) {
      throw new Error(`${project.id} must define at most 3 tags`)
    }
    if (!Array.isArray(project.relations) || project.relations.length > 4) {
      throw new Error(`${project.id} must define at most 4 relations`)
    }
    if (project.managed_readme && !project.github) {
      throw new Error(`${project.id} needs a GitHub URL when its README is managed`)
    }
  }

  for (const project of manifest.projects) {
    const relationIds = new Set()
    for (const relation of project.relations) {
      if (relation.project === project.id) {
        throw new Error(`${project.id} cannot relate to itself`)
      }
      if (!projectIds.has(relation.project)) {
        throw new Error(`${project.id} relates to unknown project ${relation.project}`)
      }
      if (relationIds.has(relation.project)) {
        throw new Error(`${project.id} repeats relation ${relation.project}`)
      }
      relationIds.add(relation.project)
    }
  }

  const rtk = manifest.projects.find((project) => project.id === 'rtk')
  if (!rtk) throw new Error('manifest must include RTK')
  if (rtk.github !== RTK_GITHUB) throw new Error(`RTK GitHub URL must be ${RTK_GITHUB}`)
  if (rtk.website !== RTK_WEBSITE) throw new Error(`RTK website URL must be ${RTK_WEBSITE}`)
  if (rtk.managed_readme !== false) throw new Error('RTK README must remain unmanaged')

  return manifest
}

export function replaceMarkedSection(source, startMarker, endMarker, body) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`target must contain ${startMarker} and ${endMarker} in order`)
  }
  if (source.indexOf(startMarker, start + startMarker.length) !== -1 || source.indexOf(endMarker, end + endMarker.length) !== -1) {
    throw new Error('target must contain exactly one generated section')
  }

  return `${source.slice(0, start + startMarker.length)}\n${body.trim()}\n${source.slice(end)}`
}

function websiteLabel(url) {
  const host = new URL(url).hostname.replace(/^www\./, '')
  if (host === 'npmjs.com') return 'npm'
  if (host === 'pypi.org') return 'PyPI'
  return host
}

function githubAnchor(title) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replaceAll(' ', '-')
}

function mermaidId(value) {
  return value.replaceAll('-', '_')
}

function renderProfileMap(manifest) {
  const routeNodes = manifest.routes.flatMap((route, index) => {
    const routeId = mermaidId(route.id)
    const projectNames = manifest.projects
      .filter((project) => project.route === route.id)
      .map((project) => project.name)
      .join('<br/>')

    return [
      `  hub --> ${routeId}["0${index + 1} · ${route.title}"]`,
      `  ${routeId} --> ${routeId}_projects["${projectNames}"]`,
    ]
  })
  const routeIds = manifest.routes.map((route) => mermaidId(route.id)).join(',')
  const projectIds = manifest.routes.map((route) => `${mermaidId(route.id)}_projects`).join(',')

  return [
    '```mermaid',
    'flowchart TB',
    '  accTitle: AI engineering ecosystem map',
    '  accDescr: Five routes connect the ecosystem hub to all sixteen projects',
    '  hub(["AI engineering ecosystem"])',
    ...routeNodes,
    '  classDef hub fill:#f97316,color:#111827,stroke:#fb923c,stroke-width:3px',
    '  classDef route fill:#1f2937,color:#f9fafb,stroke:#94a3b8,stroke-width:2px',
    '  classDef projects fill:#111827,color:#e5e7eb,stroke:#475569',
    '  class hub hub',
    `  class ${routeIds} route`,
    `  class ${projectIds} projects`,
    '```',
  ].join('\n')
}

export function renderProfile(manifest) {
  const routeLinks = manifest.routes
    .map((route) => `[${route.title}](#${githubAnchor(route.title)})`)
    .join(' · ')

  const sections = manifest.routes.map((route) => {
    const rows = manifest.projects
      .filter((project) => project.route === route.id)
      .map((project) => {
        const website = project.website ? ` · [${websiteLabel(project.website)}](${project.website})` : ''
        const tags = project.tags.map((tag) => `<kbd>${tag}</kbd>`).join(' ')
        return `| **[${project.name}](${project.github})**${website}<br>${tags} | ${project.use_when} | ${project.format} |`
      })
      .join('\n')

    return [
      `### ${route.title}`,
      '',
      route.description,
      '',
      '| Project | Use it when | Format |',
      '|---|---|---|',
      rows,
    ].join('\n')
  })

  return [
    '## Open-source galaxy',
    '',
    'Choose a route based on the outcome you need. Each project appears once under its primary route; the labels show its secondary angles.',
    '',
    routeLinks,
    '',
    renderProfileMap(manifest),
    '',
    '> **Project spotlight: [cc-skill-usage](https://github.com/FlorianBruniaux/cc-skill-usage).** It measures real Skill tool calls from local transcripts, so usage reports do not confuse invocations with prose mentions.',
    '',
    ...sections.flatMap((section, index) => index === 0 ? [section] : ['', section]),
  ].join('\n')
}

export function renderReadme(manifest, projectId, locale = 'en') {
  const project = manifest.projects.find((candidate) => candidate.id === projectId)
  if (!project) throw new Error(`unknown project: ${projectId}`)
  if (!project.managed_readme) throw new Error(`${project.name} README is not managed`)
  if (!['en', 'fr'].includes(locale)) throw new Error(`unsupported locale: ${locale}`)

  const byId = new Map(manifest.projects.map((candidate) => [candidate.id, candidate]))
  const french = locale === 'fr'
  const items = project.relations.map((relation) => {
    const target = byId.get(relation.project)
    const label = french ? relation.label_fr ?? relation.label : relation.label
    const reason = french ? relation.reason_fr ?? relation.reason : relation.reason
    const separator = french ? ' :' : ':'
    return `- **${label} [${target.name}](${target.github})**${separator} ${reason}`
  })

  return [
    `<!-- Source: ${manifest.manifest_url}; project: ${project.id} -->`,
    french ? '## Explorer l’écosystème' : '## Explore the ecosystem',
    '',
    french
      ? 'Ces projets prolongent le workflow sans dupliquer cet outil :'
      : 'These projects extend the workflow without duplicating this tool:',
    '',
    ...items,
    '',
    french
      ? `[Parcourir toute la galaxie open source](${manifest.profile_url}#open-source-galaxy)`
      : `[Browse the complete open-source galaxy](${manifest.profile_url}#open-source-galaxy)`,
  ].join('\n')
}

export function renderLanding(manifest) {
  const routes = manifest.routes.map(({ id, title, description }) => ({ id, title, description }))
  const projects = manifest.projects.map((project) => ({
    id: project.id,
    icon: project.icon,
    title: project.name,
    description: project.description,
    useWhen: project.use_when,
    format: project.format,
    tags: project.tags,
    href: project.website ?? project.github,
    github: project.github,
    website: project.website,
    route: project.route,
    featured: project.landing_featured,
  }))

  return [
    '// This file is generated from the FlorianBruniaux profile manifest.',
    `// Source: ${manifest.manifest_url}`,
    '// Run scripts/ecosystem.mjs from the profile repository to update it.',
    '',
    `export const PERSONAL_PROJECT_ROUTES = ${JSON.stringify(routes, null, 2)} as const`,
    '',
    `export const PERSONAL_PROJECTS = ${JSON.stringify(projects, null, 2)} as const`,
    '',
  ].join('\n')
}

function optionValue(args, name) {
  const index = args.indexOf(name)
  if (index === -1 || !args[index + 1]) throw new Error(`${name} requires a value`)
  return args[index + 1]
}

function run() {
  const [command, ...args] = process.argv.slice(2)
  const manifest = validateManifest(loadManifest())
  if (command === 'validate') {
    process.stdout.write(`${manifest.projects.length} projects across ${manifest.routes.length} routes are valid\n`)
    return
  }
  if (command === 'profile') {
    const file = resolve(optionValue(args, '--file'))
    const source = readFileSync(file, 'utf8')
    const rendered = replaceMarkedSection(source, PROFILE_START, PROFILE_END, renderProfile(manifest))
    if (args.includes('--write')) {
      writeFileSync(file, rendered)
      process.stdout.write(`updated ${file}\n`)
      return
    }
    if (source !== rendered) throw new Error(`profile is out of date: ${file}`)
    process.stdout.write('profile is up to date\n')
    return
  }
  if (command === 'readme') {
    const projectId = optionValue(args, '--project')
    const file = resolve(optionValue(args, '--file'))
    const locale = args.includes('--locale') ? optionValue(args, '--locale') : 'en'
    const source = readFileSync(file, 'utf8')
    const rendered = replaceMarkedSection(source, README_START, README_END, renderReadme(manifest, projectId, locale))
    if (args.includes('--write')) {
      writeFileSync(file, rendered)
      process.stdout.write(`updated ${file}\n`)
      return
    }
    if (source !== rendered) throw new Error(`README is out of date: ${file}`)
    process.stdout.write('README is up to date\n')
    return
  }
  if (command === 'landing') {
    const file = resolve(optionValue(args, '--file'))
    const rendered = renderLanding(manifest)
    if (args.includes('--write')) {
      writeFileSync(file, rendered)
      process.stdout.write(`updated ${file}\n`)
      return
    }
    const source = readFileSync(file, 'utf8')
    if (source !== rendered) throw new Error(`landing data is out of date: ${file}`)
    process.stdout.write('landing data is up to date\n')
    return
  }
  throw new Error('usage: ecosystem.mjs validate | profile --file PATH [--write] | readme --project ID --file PATH [--locale en|fr] [--write] | landing --file PATH [--write]')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    run()
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
