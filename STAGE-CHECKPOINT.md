# Token Minner: PPT/Pitch Deck Feature - Stage Checkpoint

## COMPLETED (Committed)

### Stage 0: Security Fixes
- ✅ Tighten CSP: remove data: from img-src
- ✅ Add Trusted Types enforcement (require-trusted-types-for 'script'; trusted-types 'none')
- ✅ Add referrer-policy: no-referrer
- ✅ Add defense-in-depth (media-src, worker-src, manifest-src)
- Commit: `b63f457`

### Stage 1: PPT Infrastructure
- ✅ PPT field definitions (15 fields across 3 groups)
- ✅ File sanitization function (control chars, bidi, zero-width, whitespace)
- ✅ File validation (extension checking, allowed list)
- ✅ createField() support for file, checkbox, hidden inputs
- ✅ validateControl() skips files, validates custom words 10–150
- ✅ buildGuard() handles PPT task (uses text guard + current-data marker)
- ✅ PPT_PITCH_DECK_TEMPLATE and PPT_STEP_TEMPLATE
- ✅ PROVIDER_NOTES for PPT (ChatGPT, Claude, Gemini, Grok, Copilot)
- ✅ Stub PPT renderers (renderPptMarkdown, renderPptPlain)
- ✅ RENDERERS dict includes ppt handlers
- Commit: `0cb7118`

### Stage 2a: PPT HTML Structure
- ✅ Rename tabs: Text Prompts, Image Prompts, Video Prompts, Coding Loop
- ✅ Add PPT/Pitch Deck tab button (5th tab, data-prompt-type="ppt")
- ✅ Remove Presentation/Pitch Deck from Text categories
- ✅ Add pptFields section with pptFieldsMount for dynamic rendering
- Commit: `2af6c81`

## REMAINING WORK (Stage 2b–3)

### High Priority (Stage 2b - Core Integration)
- [ ] Add renderPptFields() function (renders PPT_FIELDS groups + guard + step locking)
- [ ] Cache elements: pptFieldsMount, pptFields, pptTab
- [ ] Call renderPptFields() during init and tab switching
- [ ] Add provider button for Microsoft Copilot
- [ ] Update updateProviderButtons() to handle "ppt" task type
- [ ] Add file input change handlers for pptSourceFile (sanitize, validate, display chip, clear input)
- [ ] Add file input elements to HTML: Image reference image, Video start frame
- [ ] Add file chip display and remove buttons
- [ ] Update HTML provider buttons (add Copilot, reorder)

### Medium Priority (Stage 3 - Refinement)
- [ ] Complete PPT renderer implementations (output all fields, format properly)
- [ ] Image Prompts: add category select + new fields (text, background, variations, reference)
- [ ] Video Prompts: add category select + new fields (audio, dialogue, start frame)
- [ ] Update Image/Video renderers to handle new fields and categories
- [ ] Add Unlimited slides warning (don't use setError, just warn)
- [ ] Add custom words field visibility toggle (show only when Custom selected)
- [ ] Test PPT generation and copying in all formats
- [ ] Test file handling (valid, spoofed, double-extension, HTML, oversized names)
- [ ] Test Image reference image upload and clearing
- [ ] Test Video start frame upload and clearing

### Low Priority (Stage 3 - Docs & Polish)
- [ ] Update README: add PPT tab, categories, deliverables, Reply Budget for PPT
- [ ] Add privacy line about files never being read/uploaded/stored
- [ ] Add Security section to README (CSP directives, Trusted Types, residual risks)
- [ ] Final VA: verify no XSS, exfiltration, storage, file APIs, ReDoS
- [ ] Test responsiveness at phone width
- [ ] Test keyboard navigation (arrow keys between 5 tabs)

## Architecture Notes

### File Handling Pattern
```javascript
sanitizeFilename(name) → remove dangerous chars, whitespace, cap 200 chars
getFileType(name, extensions) → extract ext, validate, return {name, ext, type}
// On file input change:
const file = getFileType(input.files[0].name, allowedExts)
if (!file) { setError(); return; }
storeFileName(file.name) // store for output
input.value = "" // release file from memory
showChip(file.name) // display with remove button
```

### Caching Pattern
```javascript
const elements = {
  pptFieldsMount: null,
  pptFields: null,
  pptTab: null,
  // etc
};
// In cacheElements():
elements.pptFieldsMount = document.getElementById("pptFieldsMount");
```

## Tokens Used
- Started: 15,000,000 tokens
- After Stage 0: ~14,990,000
- After Stage 1: ~14,956,000  
- After Stage 2a: ~14,949,000
- Remaining: ~14,949,000

## Next Session Approach
1. Load this file as context
2. Start with renderPptFields() function (copy renderCodingFields pattern, simplify)
3. Add caching and init call
4. Add provider button for Copilot
5. Add file input handlers (inline minimal version)
6. Commit as "Stage 2b: PPT integration complete"
7. Continue to Stage 3 if tokens allow

## Testing Checklist
- [ ] PPT tab appears and is keyboard-navigable
- [ ] Fields render with correct labels, tips, defaults
- [ ] Generate works for all three formats
- [ ] Copy buttons work (Generic, ChatGPT, Claude, Gemini, Grok, Copilot)
- [ ] Clear button resets PPT fields
- [ ] File input accepts .docx/.doc/.xlsx/.xls/.pdf/.md
- [ ] File input rejects .exe, HTML, oversized names
- [ ] File name appears in output and as chip
- [ ] Reply Budget calculates correctly (slides × words × 4/3)
- [ ] Unlimited slides shows warning, no token calc, output line omitted
- [ ] Custom words field visible only when Custom selected, validates 10–150
