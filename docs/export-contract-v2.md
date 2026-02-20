# Export Contract v2

This document defines exactly which canvas data sources feed each export output.

## Scope

- Source of truth: `canvasStore.nodes`, `canvasStore.edges`, `canvasStore.projectName`
- Persisted source: `projects.canvas_data` (`nodes`, `edges`) + `projects.name`
- Export UI entry point: `src/components/canvas/ExportMenu.tsx`

## Node Types

- `idea`: product and architecture context
- `feature`: implementation and delivery context
- `screen`: UI and interaction context
- `techStack`: stack and configuration choices
- `prompt`: prompt history and learnings
- `note`: freeform notes

## Output Contracts

### Context File (`.context/index.md`)

- Includes:
  - `idea`: `projectArchitecture`, `description`, `targetUser`, `coreProblem`, `corePatterns`, `constraints`
  - `feature`: `featureName`, `userStory`, `acceptanceCriteria`, `implementationSteps`, `aiContext`, `codeReferences`, `relatedFiles`, `testingRequirements`, `dependencies`, `technicalConstraints`
  - `screen`: `screenName`, `purpose`, `componentHierarchy`, `keyElements`, `aiContext`, `codeReferences`
  - `techStack`: `category`, `toolName`, `version`, `rationale`, `configurationNotes`
  - feature connected graph context from `edges` (incoming/outgoing linked nodes)
  - related `prompt` learnings (`targetTool`, `promptText`, `resultNotes`, `breakdown`, `refinements`)
- Excludes:
  - `note`
  - graph/edge relationship semantics

### Claude Code Prompt (feature export)

- Selection:
  - one selected feature or many selected features from modal
- Includes:
  - feature core fields (`summary`, `problem`, `userStory`, criteria, implementation, dependencies, testing, constraints)
  - feature planning metadata (`priority`, `status`, `effort`, `estimatedHours`, `tags`, `risks`, `metrics`, `notes`)
  - connected graph context from `edges` (incoming/outgoing connected nodes)
  - related prompt learnings from `prompt` nodes:
    - `targetTool`, `promptText`, `resultNotes`, `breakdown`, `refinements`, `actualOutput`, `contextUsed`
  - global `techStack` summary
- Excludes:
  - `note` nodes

### Cursor Plan Mode Prompt (feature export)

- Selection:
  - one selected feature or many selected features from modal
- Includes:
  - feature implementation checklist and file structure
  - planning metadata (`priority`, `status`, `effort`, `estimatedHours`, `tags`)
  - dependencies, risks, metrics, constraints, notes
  - connected graph context from `edges`
  - concise prompt learnings from related `prompt` nodes
- Excludes:
  - `note` nodes

### Bolt/Lovable Full Prompt

- Includes:
  - `idea`: `appName`, `description`, `targetUser`, `coreProblem`, `constraints`
  - `feature`: `featureName`, `userStory`, `acceptanceCriteria`
  - `screen`: `screenName`, `purpose`, `keyElements`
  - `techStack`: grouped by `category` with `toolName`, `version`
- Excludes:
  - `prompt` and `note`
  - graph/edge relationship semantics

### PDF Export

- Includes:
  - same conceptual coverage as Context File
  - `projectName` for title
  - feature connected graph context from `edges`
  - related `prompt` learnings (summarized)
- Excludes:
  - `note`
  - graph/edge relationship semantics

### TODO.md

- Includes:
  - `idea`: `appName`, `description`
  - `feature`: grouped by `status` and includes `featureName`, `priority`, `effort`, `summary`, `aiContext`, `relatedFiles`, `dependencies`, `implementationSteps`, `testingRequirements`, `risks`
- Excludes:
  - all non-feature node details for task rows
  - `prompt` and `note`

### JSON Canvas Export

- Includes:
  - full `nodes` and `edges` as-is
  - `projectName`
  - export metadata (`version`, `exportedAt`)
- Excludes:
  - none (full canvas portable payload)

### GitHub Issues JSON

- Includes:
  - one issue per `feature`
  - issue body from `userStory`, `problem`, `acceptanceCriteria`, `implementationSteps`, `aiContext`, `codeReferences`, `testingRequirements`, `dependencies`
  - labels derived from `priority`, `effort`, `status`
- Excludes:
  - `prompt`, `note`, `screen`, `idea`, `techStack` content
  - graph/edge relationship semantics

## Relationship Rules (v2)

- Feature-centric exports should use `edges` to include connected context.
- Prompt learnings should be attached when:
  - prompt node is directly connected to feature, or
  - prompt node is one hop from a connected feature context node, or
  - prompt metadata references the feature name.

## Known Gaps

- Full-stack/TODO/GitHub exports still do not consume prompt-node learnings.
- Semantic edge meaning (dependency vs flow vs reference) is not modeled; only connectivity is used.
