# Open-Source Galaxy Design

## Decision

The GitHub profile repository owns one canonical manifest for Florian Bruniaux's public open-source projects. The manifest generates the categorized profile catalog, the contextual project links copied into managed README files, and the data consumed by the Claude Code Guide landing page.

The profile is the complete map. Each project README shows only its local neighborhood.

## Scope

The first release covers 16 projects grouped into five primary routes:

1. Build & Run
2. Observe & Improve
3. Secure & Validate
4. Learn & Adopt
5. Research, Discover & Grow

Each project has one primary route and up to three secondary tags. The generic label `AI` is excluded because it does not distinguish projects in this catalog.

## Canonical manifest

`ecosystem/projects.json` contains:

- stable project identity and display order;
- GitHub and website URLs;
- one stable usage-oriented description;
- format, primary route, tags, icon, and featured state;
- one to four typed relations to other projects;
- an explicit `managed_readme` flag.

RTK uses these canonical URLs:

- website: `https://www.rtk-ai.app/`
- repository: `https://github.com/rtk-ai/rtk`

RTK remains in the manifest but sets `managed_readme` to `false` because the repository belongs to the `rtk-ai` organization. The synchronization command must refuse to write an RTK README block.

## Generated profile catalog

The profile README keeps the three editorial feature sections above the catalog. The generated catalog replaces the flat `Open-Source Tools` tables with:

- a five-route index;
- one table per route;
- three columns: project, use it when, and format;
- secondary tags shown below the project name;
- links carried by the project name and optional website label;
- no mutable star counts, test counts, versions, or benchmark figures.

Generated content is bounded by these markers:

```html
<!-- BEGIN GENERATED OPEN SOURCE GALAXY -->
<!-- END GENERATED OPEN SOURCE GALAXY -->
```

## Generated README neighborhoods

Each managed README receives an `Explore the ecosystem` section near its existing maintainer or license section. The block contains one to four contextual links. Each item names the relation and explains why the next project is useful.

Example:

```markdown
<!-- BEGIN GENERATED RELATED PROJECTS -->
## Explore the ecosystem

- **Measure with [cc-skill-usage](...)**: verify that the skill is invoked in real transcripts.
- **Optimize with [RTK](...)**: reduce command output while flow-lean reduces model prose.

[Browse the complete open-source galaxy](...)
<!-- END GENERATED RELATED PROJECTS -->
```

One strong relation is acceptable for Cowork and StarMapper. The generator must not create weak links to reach an arbitrary minimum.

French content is generated for `README.fr.md` in the Cowork repository. Other managed blocks use English.

## Landing integration

The manifest generates `src/data/personal-projects.generated.ts` in the Claude Code Guide landing repository. The existing homepage keeps three featured projects. `/projects/` groups all 16 projects by the same five routes used on the profile.

The landing page must not duplicate route labels, descriptions, project descriptions, formats, or URLs in a hand-maintained array.

## Synchronization interface

`scripts/ecosystem.mjs` exposes explicit, fail-closed commands:

```bash
node scripts/ecosystem.mjs validate
node scripts/ecosystem.mjs profile --file README.md --write
node scripts/ecosystem.mjs readme --project ccboard --file ../ccboard/README.md --write
node scripts/ecosystem.mjs landing --file ../claude-code-ultimate-guide-landing/src/data/personal-projects.generated.ts --write
```

Without `--write`, commands compare the target with the rendered output. A mismatch exits non-zero. Profile and README commands refuse to modify files without both expected markers. Every target path is explicit; the command does not scan `~/Sites`.

## Validation

The validator rejects:

- duplicate route or project identifiers;
- an unknown primary route;
- duplicate, unknown, or self-referential relations;
- more than four relations;
- a managed project without a GitHub URL;
- an RTK website or GitHub URL different from the canonical values;
- `managed_readme: true` for RTK;
- missing generation markers in a requested Markdown target.

Node's built-in test runner covers validation, profile rendering, README rendering, landing rendering, explicit-path updates, and RTK write refusal. Landing tests verify 16 unique projects, five routes, and three featured projects. The landing build remains the runtime integration gate.

## Worktree and dirty-repository policy

The profile implementation runs in an isolated worktree based on `origin/main` because the primary checkout is four commits behind and has an uncommitted README. Other repositories receive marker-bounded edits in their existing checkouts. Unrelated modified and untracked files remain untouched.

No commit or push is part of this implementation unless Florian requests it after reviewing the diffs.
