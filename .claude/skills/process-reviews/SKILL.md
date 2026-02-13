---
name: process-reviews
description: Review feedback files and implement thoughtful changes. Use when processing code review feedback.
---

# Process Reviews

Review feedback from code review files and implement changes.

## Process

1. Read review files in `./scratchpad/review-*.md`
2. For each piece of feedback:
   - Reflect on whether it's valid and applicable
   - Consider security, code quality, and best practices implications
   - Decide: implement, defer, or reject with reasoning
3. Implement accepted changes
4. Document results in `./scratchpad/review-<X>_fixed.md`:
   - Date of processing
   - Hash of the source review file
   - Each item: accepted/rejected with reasoning
   - Changes made

## Priority

1. Security issues -- always address
2. Code quality -- implement if low-risk
3. Best practices -- implement if scope allows
4. Style preferences -- defer unless trivial
