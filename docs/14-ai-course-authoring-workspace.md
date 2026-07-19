# AI Course Authoring Workspace — Production MVP Architecture

## Scope

Sprint AI-1 prepares the Trainer authoring experience without calling an AI provider, backend, Supabase, or server-side upload. Uploaded files remain browser-local and only their metadata is used by the mock pipeline.

## Component boundaries

- `AiCourseWorkspacePage`: owns the import, processing, review, and approval state machine.
- `mockAiAuthoring.ts`: deterministic mock extraction plus the adapter from transient AI draft to the existing `Course` schema.
- `AiReviewTree`: presentation and review operations for rename, delete, merge, and split.
- Existing `CourseEditorPage`: remains the destination for the approved draft and is not modified.
- Existing `ContentService`: persists the approved draft through its existing `upsertCourse` contract and is not modified.

## Data flow

1. Trainer selects PPTX, PDF, DOCX, TXT, or Markdown.
2. The browser records file name, size, MIME type, and local estimates. File content is not transmitted or persisted.
3. A timed local mock shows the proposed AI processing stages.
4. A transient `AiCourseDraft` is created in React state.
5. Trainer reviews and modifies the transient tree.
6. `buildCourseFromAiDraft` creates modules, lessons, blocks, and quiz questions with the existing factory functions.
7. The resulting course is saved as `draft` and opened in the existing Course Builder.

## Future integration seam

A future AI provider may replace `createMockAiDraft` behind the same transient draft contract. Provider calls must happen through a backend or protected Edge Function, include file validation and size limits, and never expose provider secrets in the frontend. The adapter to the current `Course` schema should remain the final validation boundary.

## Non-goals

- No OpenAI or Gemini calls.
- No server upload or document parsing.
- No schemaVersion change.
- No automatic publishing.
- No modification of Role, guards, learning progress, quiz engine, rewards, Media Library, or publish workflow.
