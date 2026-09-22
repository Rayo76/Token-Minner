# Token Minner

Token Minner is a fully client-side, manual structured prompt builder.

**Lesser Tokens -> Targeted Outputs -> Lower Costs -> Lower Computing used -> Better Planet**

## Workflow

1. Select Text Prompts, Image Prompts, Video Prompts, Coding Loop, or PPT/Pitch Deck.
2. Complete the structured fields for that task.
3. Select Plain Text, Concise Markdown, or JSON.
4. Generate the provider-independent canonical output.
5. Copy the canonical output or a provider-adapted version.

There is no raw-prompt detection, conversion, autofill, edit-source tracking, or backend processing.

## Task Types

- Text Prompts supports Travel, Health, Financial Planning, App/PRD spec, Product Comparison, Resume Optimization, Diet & Workout Plan, Education & Learning, Debugging Issues, and Other. Step Locking uses a category-specific process.
- Image Prompts supports Basic and High Quality briefs, an optional category (Photo/Realistic, Illustration/Art, Logo/Icon, Product Shot, Poster/Social Graphic, Infographic/Diagram, UI/App Mockup, Character/Sticker, Image Edit) that swaps placeholders only, and optional Text to Render, Background, Variations, What to Change, What to Keep Unchanged, and a reference image.
- Video Prompts supports Basic and Cinematic briefs, an optional category (Cinematic Scene, Product Ad, Social Short (vertical), Explainer/Animation, Talking Head/UGC, Music Video, Seamless Loop, Animate an Image) that swaps placeholders only, and an optional Audio and Text group (Audio, Dialogue, Ambient Sound, On-screen Text/Captions) separate from Cinematic's existing Music/SFX/Voiceover fields, plus a start frame image.
- Coding Loop supports Basic and Advanced modes plus Feature Development, Bug Fixing, Refactoring & Migration, Testing & Quality, and Other categories.
- PPT/Pitch Deck builds a presentation brief: Role, Target Audience, Objective, Context, Must Include, Must Avoid (the same brief fields the old Text "Presentation/Pitch Deck" category used, now on their own tab), plus Deliverable (slide outline, .pptx file, or deck-tool content), Number of Slides (5–12, or Unlimited), Words per Slide or Bullets (preset options or a custom 10–150 word count), Speaker Notes, and an optional source file.

## Output Format

- **Plain Text** (default) writes one `Label: value` line per field, joins lists with semicolons, and uses no markup. It uses the fewest tokens.
- **Concise Markdown** uses readable task-specific headings and labels. Coding Loop renders all sections including Planning, which previous versions omitted.
- **JSON** is always minified with `JSON.stringify`.
- Every format omits empty values, empty lists, optional selects left as `Not specified`, the `Other` category, and screen-only settings such as Basic/Advanced mode.
- Dropdown choices are sent as their readable labels, for example `Before risky actions` rather than `before_risky_actions`.
- Compact readable JSON keys reduce overhead without using cryptic single-letter keys. Examples include `cat`, `aud`, `obj`, `ctx`, `inc`, `steps`, `reply`, `done`, `tasks`, `iter`, `exec`, and `gates`. PPT/Pitch Deck adds `deliv`, `slides`, `per` (`{unit, max}`, e.g. `{"unit":"words","max":40}`), `notes`, and `src`.

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
- PPT/Pitch Deck: ChatGPT, Claude, Gemini, and Grok reuse the same notes as Text; Microsoft Copilot gets its own note asking for the outline without embellishment.

In JSON the line becomes `{"instruction": "...", "request": {...}}`.

The metric cards estimate tokens with `Math.ceil(text.length / 4)`: generic prompt tokens, selected provider prompt tokens, provider adapter overhead, ratio, and percentage increase. Generic is always the baseline, so its overhead is `0`. **Reply Budget** converts the Reply length word cap to tokens at about 4 tokens per 3 words, and shows `n/a` for image, video, and coding tasks. For PPT/Pitch Deck it multiplies slides × words per slide × 4/3 tokens, and shows `n/a` when Number of Slides is Unlimited, Words per Slide is a bullet count, or a Custom word count is invalid; speaker notes are not counted.

PPT/Pitch Deck adds Microsoft Copilot as a sixth provider button, alongside ChatGPT, Claude, Gemini, and Grok.

## Validation

Every static and Coding Loop field has a visible tip and an associated inline error region.

Most fields are optional. Text, Image, Coding Loop, and PPT/Pitch Deck all generate successfully from a completely empty form; only the video durations are required, and a Custom word count (10–150) is required only while Words per Slide is set to Custom.

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
- Clear restores Text Prompts, default modes, Plain Text, Standard reply length, Coding Loop defaults, collapsed advanced sections, attached file names, and an empty output area.

## Privacy

The application uses no backend, analytics, browser storage, external scripts, fonts, runtime dependencies, network calls, or third-party assets. Prompt content stays in the browser.

The form sets `autocomplete="off"`, so browsers neither suggest earlier entries nor restore typed prompt content after a reload. Firefox otherwise refills the form on reload, and that leftover text would end up in the next generated prompt.

PPT/Pitch Deck's source file, Image Prompts' reference image, and Video Prompts' start frame are never read, uploaded, or stored. Only the sanitized file name enters the prompt; the browser's file selection is cleared immediately after the name is captured. Attach the actual file directly in your AI chat.

That boundary ends at the clipboard. Once a prompt is pasted into a provider, it is governed by that provider's terms, retention, and training policies.

## Security

The Content Security Policy is a meta tag with no external origins allowed anywhere:

```
default-src 'self'; script-src 'self'; require-trusted-types-for 'script'; trusted-types 'none';
style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'none'; media-src 'none';
worker-src 'none'; manifest-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
frame-src 'none'
```

`require-trusted-types-for 'script'` with `trusted-types 'none'` blocks any DOM-XSS sink that assigns HTML strings (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`) in browsers that enforce Trusted Types, such as Chrome. The app builds all DOM content with `createElement`/`textContent`/`replaceChildren`, so it needs no Trusted Types policy of its own. A `<meta name="referrer" content="no-referrer">` tag stops this page's URL from being sent as a referrer if the browser ever navigates away from it, even though the app has no outbound links today.

File names picked in PPT/Pitch Deck, Image Prompts, and Video Prompts are sanitized before use: control characters, bidi override characters (which can visually disguise one extension as another), and zero-width characters are stripped; whitespace is collapsed; the name is capped at 200 characters; and the extension is taken from the last segment and checked case-insensitively against an allow list in JavaScript, not just the input's `accept` attribute hint.

**Residual risks, not fixed by this app:**

- `frame-ancestors` cannot be set through a meta CSP tag, only through an HTTP response header, so this static site has no clickjacking protection from a hosting layer that does not add one.
- Anything copied to the clipboard is readable by any other application running on the same device until it is overwritten.
- Once a prompt is pasted into a provider, that provider's own privacy, retention, and training policies apply; this app has no influence past the clipboard.

## Hosting

Static files with no build step. Serve them over HTTPS.

Live on GitHub Pages at https://rayo76.github.io/Token-Minner/, served from the `TokenMinning` branch.

## Files

- `index.html`: Accessible interface structure and fields.
- `app.js`: Validation, compact schema builders, plain-text and Markdown renderers, provider notes, token metrics, filename sanitization, clipboard fallback, and reset behavior.
- `styles.css`: Responsive styling for forms, inline feedback, generated output, metric cards, and file-attachment chips.
