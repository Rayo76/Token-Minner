# Token Minner

Token Minner is a fully client-side, manual structured prompt builder.

**Lesser Tokens -> Targeted Outputs -> Lower Costs -> Lower Computing used -> Better Planet**

## Workflow

1. Select Text, Image, Video, or Coding Loop.
2. Complete the structured fields for that task.
3. Select Plain Text, Concise Markdown, or JSON.
4. Generate the provider-independent canonical output.
5. Copy the canonical output or a provider-adapted version.

There is no raw-prompt detection, conversion, autofill, edit-source tracking, or backend processing.

## Task Types

- Text Prompting supports Travel, Health, Financial Planning, App/PRD spec, Product Comparison, Resume Optimization, Diet & Workout Plan, Education & Learning, Debugging Issues, Presentation/Pitch Deck, and Other. Step Locking uses a category-specific process.
- Image Prompting supports Basic and High Quality briefs.
- Video Prompting supports Basic and Cinematic briefs.
- Coding Loop supports Basic and Advanced modes plus Feature Development, Bug Fixing, Refactoring & Migration, Testing & Quality, and Other categories.

## Output Format

- **Plain Text** (default) writes one `Label: value` line per field, joins lists with semicolons, and uses no markup. It uses the fewest tokens.
- **Concise Markdown** uses readable task-specific headings and labels.
- **JSON** is always minified with `JSON.stringify`.
- Every format omits empty values, empty lists, optional selects left as `Not specified`, the `Other` category, and screen-only settings such as Basic/Advanced mode.
- Dropdown choices are sent as their readable labels, for example `Before risky actions` rather than `before_risky_actions`.
- Compact readable JSON keys reduce overhead without using cryptic single-letter keys. Examples include `cat`, `aud`, `obj`, `ctx`, `inc`, `steps`, `reply`, `done`, `tasks`, `iter`, `exec`, and `gates`.

## Keeping Replies Short

The reply is usually longer than the prompt, so every text prompt also shapes the reply:

- **Reply length** caps the answer in words: Brief (150), Standard (375, the default), Detailed (900), or No limit. Models follow word caps more reliably than token counts, and a prompt pasted into a chat window cannot set `max_tokens`.
- Every text prompt asks for no preamble, restated task, or closing summary.
- With Step Locking on, the steps are listed and the model is asked not to narrate them.
- The Anti-Hallucination Guard asks for unknowns and assumptions to be flagged inline rather than in separate sections.
- Coding Loop per-iteration reports default to 5 lines with commands but no logs, and a required final diff review asks the agent to review the diff without printing it.

These changes are expected to shorten replies; the app cannot measure reply length itself.

## Canonical And Provider Copies

The Generated Output is the canonical provider-independent prompt. **Copy Generic** copies that exact string with nothing added.

Each provider button adds exactly one line:

- Text: ChatGPT, Claude, Gemini, and Grok each get one note against padding, such as follow-up offers, multiple alternatives, key-takeaway sections, or jokes and asides.
- Image (ChatGPT Images, Gemini Image, Grok Image) and Video (Gemini Video, Grok Video): generate the media now and return only the media, without rewriting the prompt or describing the result. Claude is hidden for both, and ChatGPT is hidden for video.
- Coding Loop (Codex, Claude Code, Google Antigravity, Grok Build): run the bounded loop within its constraints, plus one provider-specific clause.

In JSON the line becomes `{"instruction": "...", "request": {...}}`.

The metric cards estimate tokens with `Math.ceil(text.length / 4)`: generic prompt tokens, selected provider prompt tokens, provider adapter overhead, ratio, and percentage increase. Generic is always the baseline, so its overhead is `0`. **Reply Budget** converts the Reply length word cap to tokens at about 4 tokens per 3 words, and shows `n/a` for image, video, and coding tasks.

## Validation

Every static and Coding Loop field has a visible tip and an associated inline error region.

Most fields are optional. Text, Image, and Coding Loop all generate successfully from a completely empty form; only the video durations are required.

**Required**

- Video Basic: `Duration`.
- Video Cinematic: `Sequence Duration` and `Output Duration`.

Each must be greater than zero.

**Required in pairs or by policy**

- A time budget value requires its unit, and a unit requires its value.
- A cost budget requires its currency, and a currency requires its amount.
- `Network Access: Allowed hosts only` requires the `Allowed Network Hosts` list.
- `Package Installation Policy: Allowed list only` requires the `Allowed Packages` list.

**Checked only when a value is present**

Character limits (500 for single-line fields, 5000 for textareas), a 50-entry cap on line-separated lists, a 200-character cap per command line, and numeric range and step limits.

**Advisory only, not safety controls**

- Apparent secret values are detected on `Required Environment Variable Names` and nowhere else. It matches common `NAME=value` shapes and will miss others.
- The destructive-command check is a short, non-exhaustive denylist over command fields. It exists to catch an obvious slip while typing, not to make a prompt safe. Do not rely on it.

**Regeneration and copying**

- The form regenerates the output 225 ms after valid structured edits, but only after the first manual generation.
- Changing task type or mode hides the previous payload when the new form is invalid, so one task type's prompt is never left on screen under another. It reappears once the new form validates.
- Copy buttons do nothing until a generate has succeeded and the output section is visible.
- Clear restores Text Prompting, default modes, Plain Text, Standard reply length, Coding Loop defaults, collapsed advanced sections, and an empty output area.

## Privacy

The application uses no backend, analytics, browser storage, external scripts, fonts, runtime dependencies, network calls, or third-party assets. Prompt content stays in the browser.

That boundary ends at the clipboard. Once a prompt is pasted into a provider, it is governed by that provider's terms, retention, and training policies.

## Hosting

Static files with no build step. Serve them over HTTPS.

GitHub Pages is not currently serving this repository. `https://rayo76.github.io/` returns 404.

## Files

- `index.html`: Accessible interface structure and fields.
- `app.js`: Validation, compact schema builders, plain-text and Markdown renderers, provider notes, token metrics, clipboard fallback, and reset behavior.
- `styles.css`: Responsive styling for forms, inline feedback, generated output, and metric cards.
