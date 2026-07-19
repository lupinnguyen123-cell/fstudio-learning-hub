# Document Intelligence Pipeline — Sprint AI-4.5

## Boundary

Document Intelligence is independent from AI and the production Course model:

`Trainer Upload → DocumentParser → DocumentNormalizer → StructuredDocument → DocumentHandoff → AI Provider`.

Raw binary files never reach the AI provider. The AI contract accepts only `DocumentHandoff`, a normalized projection containing metadata, sections, element content, retail signals, normalized text, and a rule-based quality score.

## Model

`StructuredDocument` contains `DocumentSource`, `DocumentMetadata`, pages, sections, typed elements, warnings, detected retail signals, and quality rules. Supported elements include heading, paragraph, list, image, table, quote, code, blank line, and unavailable-parser placeholder.

This schema is versioned independently and does not alter Course, Progress, Quiz, ContentService, or localStorage schemas.

## Parser architecture

`DocumentParser` defines `supports`, `parse`, `normalize`, and `metadata`. `DocumentParserFactory` selects from registered parsers, so callers contain no format-specific branch chain.

- TXT: full text parsing with heading heuristics, paragraphs, blank lines, bullets, and numbered lists.
- Markdown: H1–H3, paragraphs, lists, fenced code, quotes, image links, and tables. Markdown is never converted to HTML.
- PDF: metadata and conservative `/Page` count detection; content parser unavailable.
- PPTX: metadata and conservative slide filename detection from ZIP container bytes; content parser unavailable.
- DOCX: metadata and explicit unavailable-parser placeholder.

Placeholder parsers never claim to have extracted content. Their normalized document has `parser_unavailable`, a warning, and the message “Định dạng đã nhận diện nhưng parser chưa khả dụng”.

## Normalization

The normalizer applies NFC Unicode normalization, non-breaking-space replacement, duplicate whitespace/newline cleanup, malformed bullet cleanup, removal of empty content, heading-to-section mapping, and typed element normalization.

Retail heuristics deterministically detect product, campaign, campaign rule, scenario, FAQ, warning, price, promotion, specification, and Trainer note signals. These labels are context hints, not AI scores.

Quality is a transparent five-rule score: usable content, heading presence, section structure, paragraph density, and structured elements.

## Trainer preview and export

The AI Workspace exposes Raw, Normalized, and Detected Structure views. Trainer can export the complete normalized JSON for debugging. This does not change Course JSON import/export.

Only documents with `status: parsed` can be generated. PDF/PPTX/DOCX placeholders are blocked from AI handoff until a real parser is implemented.

## Future parser seam

Future PDF.js, DOCX, or PPTX libraries should be added inside their parser implementation and must continue returning the same `ParsedDocument`/`StructuredDocument` contracts. OCR, embedded media extraction, speaker notes, charts, and shape interpretation remain out of scope.
