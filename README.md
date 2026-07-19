# Token Minner

Token Minner is a fully client-side, manual structured prompt builder.

**Lesser Tokens -> Targeted Outputs -> Lower Costs -> Lower Computing used -> Better Planet**

## Workflow

1. Select Text, Image, Video, or Coding Loop.
2. Complete the structured fields for that task.
3. Select Concise Markdown or JSON.
4. Generate the provider-independent canonical output.
5. Copy the canonical output or a provider-adapted version.

There is no raw-prompt detection, conversion, autofill, edit-source tracking, or backend processing.

## Task Types

- Text Prompting supports Travel, Health, Financial Planning, App/PRD spec, Product Comparison, Resume Optimization, Diet & Workout Plan, Education & Learning, Debugging Issues, and Other. Step Locking uses a category-specific process.
- Image Prompting supports Basic and High Quality briefs.
- Video Prompting supports Basic and Cinematic briefs.
- Coding Loop supports Basic and Advanced modes plus Feature Development, Bug Fixing, Refactoring & Migration, Testing & Quality, and Other categories.

## Output Format

- Concise Markdown uses readable task-specific headings and labels.
- JSON is always minified with `JSON.stringify(data)`.
- Empty values, empty lists, optional media selects left as `Not specified`, and Text `max_tokens: 0` are omitted.
- Compact readable JSON keys reduce overhead without using cryptic single-letter keys. Examples include `cat`, `aud`, `obj`, `ctx`, `inc`, `val`, `steps`, `done`, `tasks`, `iter`, `exec`, and `gates`.

## Canonical And Provider Copies

The Generated Output is the canonical provider-independent prompt. **Copy Generic** copies that exact Markdown or minified JSON string without a wrapper, provider instructions, metadata, or duplicated requirements.

Provider buttons add only a small capability-aware instruction wrapper:

- Text: ChatGPT, Claude, Gemini, Grok, and Generic.
- Image: ChatGPT Images, Gemini Image, Grok Image, and Generic Image. Claude is hidden.
- Video: Gemini Video, Grok Video, and Generic Video. ChatGPT and Claude are hidden.
- Coding Loop: Codex, Claude Code, Gemini Coding, Grok, and Generic Loop.

The metric cards calculate token estimates from exact copy strings with `Math.ceil(text.length / 4)`: Generic output tokens, selected provider output tokens, provider adapter overhead, ratio, and percentage increase. Generic is always the baseline, so its overhead is `0`.

## Validation And Privacy

- Every static and Coding Loop field has a visible tip and an associated inline error region.
- Numeric limits, positive video duration, FPS, Text lists, Coding Loop policies, apparent secret values, and potentially destructive commands are validated client-side.
- The form regenerates the output 225 ms after valid structured edits, but only after the first manual generation.
- Clear restores Text Prompting, default modes, Concise Markdown, Coding Loop defaults, collapsed advanced sections, and an empty output area.
- The application uses no backend, analytics, browser storage, external scripts, fonts, runtime dependencies, network calls, or third-party assets. Prompt content remains in the browser.

For public hosting, serve these static files over HTTPS.

## Files

- `index.html`: Accessible interface structure and fields.
- `app.js`: Validation, compact schema builders, Markdown renderers, provider adapters, token metrics, clipboard fallback, and reset behavior.
- `styles.css`: Responsive styling for forms, inline feedback, generated output, and metric cards.
