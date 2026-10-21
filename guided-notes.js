(() => {
  "use strict";

  const chapters = Array.isArray(window.GUIDED_NOTES_CHAPTERS) ? window.GUIDED_NOTES_CHAPTERS : [];
  const chapterSelect = document.getElementById("chapter-select");
  const notes = document.getElementById("notes");
  const links = document.getElementById("section-links");
  const entries = [];
  let chapter = null;

  function normalize(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
  }

  function storageKey() {
    return `weinberg-9e-guided-notes:${chapter.id}:${chapter.sourceSha256}`;
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveProgress() {
    const values = {};
    for (const entry of entries) {
      if (entry.input.value || entry.revealed) {
        values[entry.id] = { value: entry.input.value, revealed: entry.revealed };
      }
    }
    try {
      localStorage.setItem(storageKey(), JSON.stringify(values));
    } catch {
      // The activity still works when browser storage is unavailable.
    }
  }

  function clearFeedback(entry) {
    entry.feedback.textContent = "";
    entry.feedback.className = "feedback";
    entry.input.classList.remove("is-correct", "is-shown");
    entry.input.removeAttribute("aria-invalid");
  }

  function check(entry) {
    clearFeedback(entry);
    if (entry.revealed) {
      entry.input.classList.add("is-shown");
      entry.feedback.textContent = "Answer shown";
      entry.feedback.classList.add("shown");
    } else if (!entry.input.value.trim()) {
      entry.feedback.textContent = "No answer yet";
      entry.feedback.classList.add("incorrect");
    } else if (normalize(entry.input.value) === normalize(entry.answer)) {
      entry.input.classList.add("is-correct");
      entry.feedback.textContent = "Correct";
      entry.feedback.classList.add("correct");
    } else {
      entry.input.setAttribute("aria-invalid", "true");
      entry.feedback.textContent = "Try again";
      entry.feedback.classList.add("incorrect");
    }
    updateCounts();
  }

  function updateCounts() {
    const correct = entries.filter(entry => !entry.revealed && entry.input.classList.contains("is-correct")).length;
    const answered = entries.filter(entry => !entry.revealed && entry.input.value.trim()).length;
    const shown = entries.filter(entry => entry.revealed).length;
    document.getElementById("correct-count").textContent = correct;
    document.getElementById("answered-count").textContent = answered;
    document.getElementById("shown-count").textContent = shown;
    document.getElementById("total-count").textContent = entries.length;
    const percent = entries.length ? Math.round(correct / entries.length * 100) : 0;
    document.getElementById("progress-fill").style.width = `${percent}%`;
    document.getElementById("progress").setAttribute("aria-valuenow", String(percent));
    document.getElementById("progress").setAttribute("aria-valuetext", `${correct} of ${entries.length} correct`);
  }

  function addPart(parent, part, sectionTitle, saved) {
    if (part.type === "text") {
      parent.append(document.createTextNode(part.value));
      return;
    }
    const wrap = document.createElement("span");
    wrap.className = "blank-wrap";
    const input = document.createElement("input");
    input.className = "blank";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.style.setProperty("--chars", String(Math.min(32, Math.max(7, part.answer.length))));
    input.setAttribute("aria-label", `Blank ${entries.length + 1} of ${chapter.blankCount} in ${sectionTitle}`);
    input.setAttribute("aria-describedby", `${part.id}-feedback`);
    const feedback = document.createElement("span");
    feedback.className = "feedback";
    feedback.id = `${part.id}-feedback`;
    feedback.setAttribute("aria-live", "polite");
    const old = saved[part.id] || {};
    input.value = typeof old.value === "string" ? old.value : "";
    const entry = { id: part.id, answer: part.answer, input, feedback, revealed: old.revealed === true };
    entries.push(entry);
    if (entry.revealed) check(entry);
    input.addEventListener("input", () => {
      entry.revealed = false;
      clearFeedback(entry);
      saveProgress();
      updateCounts();
    });
    input.addEventListener("blur", () => {
      if (input.value.trim()) check(entry);
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        check(entry);
        const next = entries[entries.indexOf(entry) + 1];
        if (next) next.input.focus();
      }
    });
    wrap.append(input, feedback);
    parent.append(wrap);
  }

  function render(chapterId) {
    chapter = chapters.find(item => item.id === chapterId) || chapters[0];
    if (!chapter) {
      document.getElementById("chapter-title").textContent = "Chapter data is unavailable";
      notes.textContent = "Check that chapters.js is beside this page.";
      return;
    }
    chapterSelect.value = chapter.id;
    document.getElementById("chapter-title").textContent = chapter.title;
    document.title = `${chapter.title} | Guided Notes`;
    notes.replaceChildren();
    links.replaceChildren();
    entries.length = 0;
    const saved = loadProgress();
    let sectionTitle = chapter.title;
    let headingIndex = 0;
    for (const block of chapter.blocks) {
      const heading = block.type === "h2" || block.type === "h3";
      const element = document.createElement(heading ? block.type : "p");
      if (block.type === "list") element.className = `note-row level-${Math.min(2, block.level)}`;
      if (heading) {
        sectionTitle = block.parts.map(part => part.value || part.answer || "").join("");
        element.id = `section-${++headingIndex}`;
        const link = document.createElement("a");
        link.href = `#${element.id}`;
        link.textContent = sectionTitle;
        if (block.type === "h3") link.className = "sub";
        links.append(link);
      }
      for (const part of block.parts) addPart(element, part, sectionTitle, saved);
      notes.append(element);
    }
    updateCounts();
  }

  for (const item of chapters) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `Chapter ${item.number}`;
    chapterSelect.append(option);
  }
  chapterSelect.addEventListener("change", () => render(chapterSelect.value));
  document.getElementById("check-all").addEventListener("click", () => {
    entries.forEach(check);
    saveProgress();
  });
  document.getElementById("reveal-all").addEventListener("click", () => {
    if (!confirm("Reveal every answer in this chapter? Revealed answers will be counted separately from correct answers.")) return;
    for (const entry of entries) {
      entry.input.value = entry.answer;
      entry.revealed = true;
      check(entry);
    }
    saveProgress();
  });
  document.getElementById("reset").addEventListener("click", () => {
    if (entries.some(entry => entry.input.value) && !confirm("Clear all entries for this chapter?")) return;
    for (const entry of entries) {
      entry.input.value = "";
      entry.revealed = false;
      clearFeedback(entry);
    }
    saveProgress();
    updateCounts();
    entries[0]?.input.focus();
  });
  render(chapters[0]?.id);
})();
