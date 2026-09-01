# Open-Source Galaxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one validated project manifest that renders the GitHub profile catalog, contextual README links, and the Claude Code Guide landing project data.

**Architecture:** The GitHub profile repository owns a dependency-free JSON manifest and Node renderer. Markdown consumers use marker-bounded generated sections. The landing consumes a generated TypeScript module and groups projects by the same route identifiers.

**Tech Stack:** JSON, Markdown, Node.js ESM, Node test runner, Astro 5, TypeScript

**Spec:** `docs/superpowers/specs/2026-09-01-open-source-galaxy-design.md`

## Global Constraints

- Preserve unrelated changes in every dirty checkout.
- Use the RTK URLs `https://www.rtk-ai.app/` and `https://github.com/rtk-ai/rtk`.
- Do not modify the RTK README automatically.
- Limit each project to four relations; allow one relation when only one strong relation exists.
- Keep mutable statistics out of generated profile and README blocks.
- Require explicit target paths and generation markers before Markdown writes.
- Do not commit or push without a separate user request.

---

### Task 1: Canonical manifest and validation

**Files:**
- Create: `ecosystem/projects.json`
- Create: `scripts/ecosystem.mjs`
- Create: `tests/ecosystem.test.mjs`

**Interfaces:**
- Produces: `loadManifest(): object`, `validateManifest(manifest): void`, `renderProfile(manifest): string`, `renderReadme(manifest, projectId, locale): string`, `renderLanding(manifest): string`, and `replaceMarkedSection(source, start, end, body): string`.
- Consumes: no third-party packages.

- [x] **Step 1: Write failing manifest validation tests**

  Add Node tests that assert 16 projects, five routes, unique identifiers, at most four relations, canonical RTK URLs, and `managed_readme: false` for RTK.

- [x] **Step 2: Run the tests and confirm the expected import failure**

  Run: `node --test tests/ecosystem.test.mjs`

  Expected: failure because `scripts/ecosystem.mjs` and `ecosystem/projects.json` do not exist.

- [x] **Step 3: Add the complete manifest and minimal validator**

  Define all five routes and all 16 audited projects. Add typed relations from the approved neighborhood map. Export the six interfaces listed above.

- [x] **Step 4: Run validation tests**

  Run: `node --test tests/ecosystem.test.mjs`

  Expected: all manifest validation tests pass.

### Task 2: Profile renderer

**Files:**
- Modify: `scripts/ecosystem.mjs`
- Modify: `tests/ecosystem.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `renderProfile(manifest): string` and `replaceMarkedSection(...)` from Task 1.
- Produces: marker-bounded profile catalog with five route tables.

- [x] **Step 1: Add failing profile rendering tests**

  Assert the five route headings, 16 linked projects, three-column tables, secondary tags, both RTK URLs, and absence of the old `Link` column.

- [x] **Step 2: Run the focused test and confirm failure**

  Run: `node --test --test-name-pattern="profile" tests/ecosystem.test.mjs`

  Expected: failure because the renderer does not yet emit the contract.

- [x] **Step 3: Implement profile rendering and add markers to README**

  Replace the two flat tool tables with one generated `Open-source galaxy` block. Keep the Guide, RTK, and StarMapper feature narratives unchanged.

- [x] **Step 4: Verify the generated profile is current**

  Run: `node scripts/ecosystem.mjs profile --file README.md`

  Expected: exit 0 and `profile is up to date`.

### Task 3: Contextual README blocks

**Files:**
- Modify: `scripts/ecosystem.mjs`
- Modify: `tests/ecosystem.test.mjs`
- Modify: the canonical README files for 15 personal projects listed in the manifest
- Modify: `README.fr.md` in `claude-cowork-guide`
- Modify: project changelogs when their repository instructions require it

**Interfaces:**
- Consumes: `renderReadme(manifest, projectId, locale): string`.
- Produces: one marker-bounded local neighborhood per managed README.

- [x] **Step 1: Add failing README rendering and RTK refusal tests**

  Assert relation labels, target URLs, the full-galaxy footer, French Cowork copy, one-link support, four-link maximum, marker refusal, and refusal to write an RTK README.

- [x] **Step 2: Run the focused tests and confirm failure**

  Run: `node --test --test-name-pattern="README|RTK" tests/ecosystem.test.mjs`

  Expected: failures for the missing render and write contracts.

- [x] **Step 3: Implement README rendering and explicit-path updates**

  Add the `readme` command with `--project`, `--file`, optional `--locale`, and optional `--write`. Require markers before a write.

- [x] **Step 4: Insert generated blocks without replacing unrelated content**

  Add markers near each maintainer, author, or license section. Replace the stale StarMapper catalog, CC-Sessions placeholders, incorrect RTK URLs, and broken Cowork relative guide link through the generated content.

- [x] **Step 5: Verify every managed README against the manifest**

  Run one explicit check command per target file. Expected: all checks exit 0. Confirm `git diff -- <README path>` contains no unrelated edits.

### Task 4: Landing generated data and grouped page

**Files:**
- Create: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/data/personal-projects.generated.ts`
- Modify: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/data/homepage-content.ts`
- Modify: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/data/homepage-content.test.ts`
- Modify: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/pages/projects/index.astro`
- Modify: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/CHANGELOG.md`

**Interfaces:**
- Consumes: `renderLanding(manifest): string`.
- Produces: `PERSONAL_PROJECT_ROUTES`, `PERSONAL_PROJECTS`, `RELATED_PROJECTS`, and `FEATURED_PROJECTS` with the existing homepage field contract.

- [x] **Step 1: Update the landing test to expect the new contract**

  Assert 16 unique projects, five unique routes, three featured projects, and the canonical RTK URLs.

- [x] **Step 2: Run the landing data test and confirm failure**

  Run: `node --import tsx --test src/data/homepage-content.test.ts`

  Expected: failure because the current hard-coded array contains 12 projects and no route contract.

- [x] **Step 3: Generate the TypeScript data module**

  Run: `node scripts/ecosystem.mjs landing --file /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/data/personal-projects.generated.ts --write`

  Expected: the generated module exports five routes and 16 projects.

- [x] **Step 4: Replace the landing hard-coded array and group the projects page**

  Import generated data in `homepage-content.ts`. Render a heading and route description before each project grid in `src/pages/projects/index.astro`. Keep the three featured cards on the homepage.

- [x] **Step 5: Run landing tests and build**

  Run: `pnpm test`

  Run: `pnpm build`

  Expected: both commands exit 0. Structural tests prove the data contract; the Astro build proves integration.

### Task 5: Cross-repository verification and handoff

**Files:**
- Modify: `docs/superpowers/plans/2026-09-01-open-source-galaxy.md`

**Interfaces:**
- Consumes: all generated outputs from Tasks 1 through 4.
- Produces: verified diffs and an explicit list of remaining dirty state.

- [x] **Step 1: Run the profile repository test suite**

  Run: `node --test tests/ecosystem.test.mjs`

  Expected: all tests pass.

- [x] **Step 2: Scan generated Markdown for forbidden editorial markers**

  Run the repository's deterministic prose checks against every changed Markdown file. Expected: no em dash or forbidden link labels introduced by this implementation.

- [x] **Step 3: Inspect explicit diffs and statuses**

  Run `git diff -- <changed paths>` and `git status --short` in each repository. Verify that pre-existing changes remain present and no unrelated path was modified.

- [x] **Step 4: Report the isolated profile branch and every changed file**

  Include the profile worktree path, branch name, validation results, landing build result, excluded RTK README, pre-existing dirty files, and the fact that no commit or push occurred.
