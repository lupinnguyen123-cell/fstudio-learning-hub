# AI Course Authoring Workspace — Mock AI Engine Architecture

## Scope and safety boundary

The workspace prepares a structured, testable AI authoring pipeline without OpenAI, Gemini, Claude, backend, Supabase, OCR, or binary document parsing. Browser import records file metadata and an explicitly labelled mock `extractedText`; file binaries are never persisted.

## Pipeline

`AiSourceDocument` → `analyzeSource` → preset/heuristic generation → `AiCourseDraft` → validation → Trainer review → conversion → existing `ContentService.upsertCourse`.

The AI draft is an intermediate model and never replaces the production `Course` model. Conversion is the only boundary between the two domains.

## Service contract

`src/services/aiCourseService.ts` is independent of React and exposes:

- `analyzeSource`: validates source type and creates browser-local source metadata.
- `generateCourseDraft`: deterministic Product, Sales, or Campaign preset generation.
- `validateCourseDraft`: validates structure, supported blocks, quiz, required content, and unique IDs.
- `convertDraftToCourse`: creates new production IDs and a Course with `publishStatus: draft`.
- `saveDraft`, `loadDraft`, `discardDraft`: isolated AI draft persistence.

## Models

`AiSourceDocument` contains file name/type/size, imported timestamp, language, optional page/slide count, mock extracted text, and extraction metadata. It never contains binary content.

`AiCourseDraft` contains source linkage, preset, descriptions, objectives, duration, modules, lessons, structured blocks, quiz, XP proposal, badge proposal, confidence, warnings, timestamps, and review status. This metadata is not added to the production Course schema.

## Presets and retail heuristics

- Product Training: product overview, features, customer fit, consultation scenario, and final review.
- Sales Training: needs discovery, value presentation, objection handling, and store application.
- Campaign Training: campaign overview, conditions, consultation, and store execution.

Heuristics map features to flashcards/quick questions, price objections to scenarios, campaign conditions to warnings, and process/store application to checklists. These are deterministic proposals, not claims that the source was fully parsed.

## Validation and approval

Errors block approval: missing title/modules/lessons/blocks, invalid quiz/pass score, duplicate/missing IDs, unsupported block types, and empty required content. Warnings do not block approval but remain visible and reviewable.

Approved output always receives new Course/Module/Lesson/Block/Question/Option/Badge IDs, remains Draft, is appended through the existing ContentService, and never overwrites or publishes existing content.

## Persistence

AI review drafts use the isolated key `fstudio_ai_course_drafts`. Up to five recent drafts are stored without binary source data. Refresh resumes the latest active draft; discard removes only that AI draft.

## Future integration seam

A real parser/provider can replace source extraction and `generateCourseDraft` behind the same service/model boundary. Provider calls must use a protected backend or Edge Function; secrets must never be exposed to the frontend. Trainer validation and explicit approval remain mandatory.

## AI-3 review workspace

The advanced review layer remains entirely inside the AI draft boundary. `AdvancedAiReviewWorkspace` owns presentation and selection, while `aiReviewActions.ts` provides immutable, deterministic transformations for rename, reorder, duplicate, delete, merge, split, cross-module moves, review status, warning resolution, and mock regenerate proposals. These actions do not import or mutate the production Course model.

Desktop uses outline, selected-item editor, and review summary panels. Tablet and mobile expose the same areas as tabs so no fixed three-column layout is forced onto narrow viewports. Structural deletion requires confirmation. Merge, split, and regenerate use an editable Before/After review sheet before applying.

Review-only metadata is optional on the AI draft for backward compatibility:

- Course title, description, and objectives have review status plus a preview-opened flag.
- Module, Lesson, and Block support `unreviewed`, `reviewed`, `needs_changes`, and `approved`.
- Warning resolution records open, resolved, or dismissed state; dismissals keep their reason and can be restored.

`useAiReviewHistory` keeps at most 25 immutable states in memory. The current draft is autosaved after a 650 ms debounce, but undo history is intentionally session-only. Draft health and approval readiness are transparent rule-based calculations rather than AI scores.

Preview converts in memory and reuses the Employee lesson block renderer. It never calls ContentService, ProgressService, quiz submission, XP, or badge code. Approval remains the only production boundary: it creates a new Draft Course, stores the AI draft with `approved` status for audit, and never auto-publishes or overwrites an existing Course.
