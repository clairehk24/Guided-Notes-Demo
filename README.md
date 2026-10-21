# Weinberg 9E Guided Notes proof of concept

Open `index.html` or `index_GN.html` in a browser. The current build contains the complete Chapter 1 guided notes activity from the supplied `Chapter 1 Guided Notes.docx` answer sheet.

The page has 107 blanks. A continuous bold phrase in the Word file becomes one blank, including phrases split across Word runs. Grading ignores capitalization and repeated or surrounding spaces; spelling and punctuation must otherwise match the answer sheet. The page saves entries in browser storage. Revealed answers are counted separately from learner-correct answers.

To add chapters, run `build_guided_notes.py` with the desired guided notes DOCX paths. Pass every chapter you want included in a single command; the script regenerates `chapters.js`, and the chapter selector updates automatically. The source files remain unchanged. The build checks that each paragraph's text is preserved during extraction and records a SHA-256 hash for each source file.

This is a static browser proof of concept. Progress is stored only in the learner's current browser; it is not sent to an LMS or server.
