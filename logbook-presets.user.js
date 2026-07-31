// ==UserScript==
// @name         SPTT Dashboard Logbook Presets
// @namespace    https://sptt-dashboard.vercel.app/
// @version      0.5.1
// @description  Adds local-only presets, persistent last-used selections, daily totals, and page-size defaults. Never submits automatically.
// @match        https://sptt-dashboard.vercel.app/contracts/*/logbooks/*
// @match        https://sptt-dashboard.vercel.app/contracts/*
// @downloadURL  https://raw.githubusercontent.com/e-bax/SPTT-Dashboard-Logbook-Presets/main/logbook-presets.user.js
// @updateURL    https://raw.githubusercontent.com/e-bax/SPTT-Dashboard-Logbook-Presets/main/logbook-presets.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

// Access note: SPTT Dashboard is not public. It is for a specific university placement program only.
// Do not try to enrol in or request access to SPTT unless your university/course has explicitly directed you to use it.
(function () {
  "use strict";

  const CONFIG = {
    debug: true,
    storageKey: "sptt.logbookPresets.v1",
    previousKey: "sptt.previousLogbookActivity.v1",
    lastUsedKey: "sptt.lastUsedLogbookSelections.v1",
    clientContactTargetKey: "sptt.clientContactTargetHours.v1",
    panelId: "sptt-logbook-presets-panel",
    dailyTotalsId: "sptt-daily-hours-tally",
    contractProgressId: "sptt-contract-progress",
    clientContactTargetId: "sptt-client-contact-target",
    maxPresets: 12,
    bakedPresets: [
      {
        name: "sup indiv",
        values: {
          deliveryType: "Individual",
          clientAge: "N/A",
          sessionType: "Supervision",
          placeOfPractice: "External",
          activityType: "Supervision",
          duration: "1",
          primaryComp: "Discipline Knowledge",
          secondComp: "Intervention",
          description: "",
        },
        savedAt: "2026-07-30T10:38:08.921Z",
      },
      {
        name: "Tx adult",
        values: {
          deliveryType: "Individual",
          clientAge: "Adult",
          sessionType: "Tx Ind",
          placeOfPractice: "External",
          activityType: "Client Contact",
          duration: "1",
          primaryComp: "Intervention",
          secondComp: "Communication",
          description: "",
        },
        savedAt: "2026-07-30T10:46:33.629Z",
      },
      {
        name: "Notes 3hr",
        values: {
          deliveryType: "N/A",
          clientAge: "Adult",
          sessionType: "Notes",
          placeOfPractice: "External",
          activityType: "Client Related Activities",
          duration: "3",
          primaryComp: "Discipline Knowledge",
          secondComp: "Intervention",
          description: "Notes",
        },
        savedAt: "2026-07-30T10:55:04.531Z",
      },
      {
        name: "Notes 1hr",
        values: {
          deliveryType: "N/A",
          clientAge: "Adult",
          sessionType: "Notes",
          placeOfPractice: "External",
          activityType: "Client Related Activities",
          duration: "1",
          primaryComp: "Discipline Knowledge",
          secondComp: "Intervention",
          description: "Notes",
        },
        savedAt: "2026-07-30T10:56:27.428Z",
      },
      {
        name: "Notes 2hr",
        values: {
          deliveryType: "N/A",
          clientAge: "Adult",
          sessionType: "Notes",
          placeOfPractice: "External",
          activityType: "Client Related Activities",
          duration: "2",
          primaryComp: "Discipline Knowledge",
          secondComp: "Intervention",
          description: "Notes",
        },
        savedAt: "2026-07-30T10:57:20.123Z",
      },
      {
        name: "Notes 0.5hr",
        values: {
          deliveryType: "N/A",
          clientAge: "Adult",
          sessionType: "Notes",
          placeOfPractice: "External",
          activityType: "Client Related Activities",
          duration: "0.5",
          primaryComp: "Discipline Knowledge",
          secondComp: "Intervention",
          description: "Notes",
        },
        savedAt: "2026-07-30T11:06:36.356Z",
      },
    ],
    defaultActivitiesPerPage: "20",
    clientContactTargetHours: 172,
    usePlacementHoursAsClientContactFallback: true,
    theme: { accent: "#c05621", accentDark: "#9c4221", accentSoft: "#fff7ed", accentBorder: "#fdba74" },
    modalTitleText: "New activity",
    formSelectors: ["#createActivityForm", "form[id*='Activity' i]", "form"],
    modalSelectors: ["[role='dialog']", "[aria-modal='true']", ".modal", ".chakra-modal__content"],
    defaultDateToToday: true,
    autoApplyLastUsedSelections: true,
    persistLastUsedOnChange: true,
    neverSubmitAutomatically: true,
    fields: [
      { key: "date", label: "Date", names: ["date"], type: "date", persistPreset: false },
      { key: "deliveryType", label: "Delivery type", names: ["deliveryType"] },
      { key: "clientAge", label: "Client Age", names: ["clientAge"] },
      { key: "sessionType", label: "Session type", names: ["sessionType"] },
      { key: "placeOfPractice", label: "Place of practice", names: ["placeOfPractice"] },
      { key: "activityType", label: "Activity type", names: ["activityType"] },
      { key: "duration", label: "Duration", names: ["duration"] },
      { key: "primaryComp", label: "Primary competency", names: ["primaryComp", "primaryCompetency"] },
      { key: "secondComp", label: "Secondary competency", names: ["secondComp", "secondaryCompetency"] },
      { key: "description", label: "Description and reflection", names: ["description"], multiline: true, persistLastUsed: false },
    ],
    dropdownOpenTimeoutMs: 2500,
    renderTimeoutMs: 10000,
  };

  const LOG_PREFIX = "[Logbook presets]";
  const SECRET_FIELD_PATTERN = /(^|[-_.])(user(name)?|pass(word)?|token|auth|cookie|session(id|token)?|credential|secret|email)([-_.]|$)/i;
  const INITIALISED_FORMS = new WeakSet();
  let openButtonListenerAttached = false;
  let dailyTotalsSignature = "";
  let enhancementTimer = 0;
  let pageSizeDefaultInProgress = false;

  function log(...args) {
    if (CONFIG.debug) console.info(LOG_PREFIX, ...args);
  }

  function error(message, details) {
    console.error(LOG_PREFIX, message, details || "");
  }

  function normalize(text) {
    return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function todayIso() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function storageGet(key, fallback) {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
    } catch (err) {
      error("GM_getValue failed; falling back to localStorage.", err);
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      error("localStorage read failed.", err);
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value);
        return;
      }
    } catch (err) {
      error("GM_setValue failed; falling back to localStorage.", err);
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      error("localStorage write failed.", err);
    }
  }

  function sanitizeValues(values, options = {}) {
    const output = {};
    for (const field of CONFIG.fields) {
      if (options.lastUsedOnly && field.persistLastUsed === false) continue;
      if (options.presetOnly && field.persistPreset === false) continue;
      if (SECRET_FIELD_PATTERN.test(field.key) || field.names.some((name) => SECRET_FIELD_PATTERN.test(name))) continue;
      const value = values?.[field.key];
      if (value !== undefined && value !== null) output[field.key] = String(value);
    }
    return output;
  }

  function normalizePreset(item) {
    return item && item.name && item.values
      ? { ...item, values: sanitizeValues(item.values, { presetOnly: true }) }
      : null;
  }

  function readPresets() {
    const baked = Array.isArray(CONFIG.bakedPresets) ? CONFIG.bakedPresets.map(normalizePreset).filter(Boolean) : [];
    const data = storageGet(CONFIG.storageKey, []);
    const local = Array.isArray(data) ? data.map(normalizePreset).filter(Boolean) : [];
    const byName = new Map();
    baked.forEach((preset) => byName.set(preset.name, preset));
    local.forEach((preset) => byName.set(preset.name, preset));
    return [...byName.values()];
  }

  function writePresets(presets) {
    storageSet(CONFIG.storageKey, presets);
  }

  function readPrevious() {
    const previous = storageGet(CONFIG.previousKey, null);
    return previous && typeof previous === "object" ? previous : null;
  }

  function writePrevious(values) {
    storageSet(CONFIG.previousKey, sanitizeValues(values));
  }

  function readLastUsed() {
    const lastUsed = storageGet(CONFIG.lastUsedKey, null);
    return lastUsed && typeof lastUsed === "object" ? lastUsed : null;
  }

  function writeLastUsed(values) {
    storageSet(CONFIG.lastUsedKey, sanitizeValues(values, { lastUsedOnly: true }));
  }

  function readClientContactTarget() {
    const stored = Number(storageGet(CONFIG.clientContactTargetKey, CONFIG.clientContactTargetHours));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return Number.isFinite(CONFIG.clientContactTargetHours) ? CONFIG.clientContactTargetHours : null;
  }

  function writeClientContactTarget(value) {
    const target = Number(value);
    if (!Number.isFinite(target) || target <= 0) {
      error("Client contact target must be a positive number.");
      return null;
    }
    storageSet(CONFIG.clientContactTargetKey, target);
    return target;
  }

  function fieldContainerByLabel(root, labelText) {
    const wanted = normalize(labelText);
    const labels = [...root.querySelectorAll("label, [id], span, div, p")].filter(isVisible);
    const label = labels.find((el) => normalize(el.textContent) === wanted);
    if (!label) return null;
    return label.closest("[data-field], [role='group'], .form-control, .chakra-form-control, label, div") || label.parentElement;
  }

  function findNativeField(root, field) {
    for (const name of field.names) {
      const escaped = CSS.escape(name);
      const direct = root.querySelector(`[name="${escaped}"], #${escaped}`);
      if (direct) return direct;
      const labelled = root.querySelector(`[aria-labelledby="${escaped}"], [aria-describedby="${escaped}"]`);
      if (labelled) return labelled;
    }
    const container = fieldContainerByLabel(root, field.label);
    return container?.querySelector("input, select, textarea") || null;
  }

  function readField(root, field) {
    const native = findNativeField(root, field);
    if (native) return native.value || "";
    const container = fieldContainerByLabel(root, field.label);
    const control = container?.querySelector("[role='combobox'], button, [aria-haspopup='listbox'], [tabindex]");
    if (!control) return "";
    return control.getAttribute("aria-label") || control.textContent || "";
  }

  function currentValues(root) {
    const values = {};
    for (const field of CONFIG.fields) values[field.key] = readField(root, field);
    return sanitizeValues(values);
  }

  function setElementValue(el, value) {
    const prototype = el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : el.tagName === "SELECT"
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) descriptor.set.call(el, value);
    else el.value = value;
  }

  function dispatchValueEvents(el) {
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: el.value }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
  }

  function setNativeFieldValue(el, value) {
    if (!el) return false;
    if (el.tagName === "SELECT") {
      const options = [...el.options];
      const option = options.find((item) => normalize(item.textContent) === normalize(value))
        || options.find((item) => normalize(item.value) === normalize(value));
      if (!option) {
        error(`Could not find select option by visible text: ${value}`, el);
        return false;
      }
      setElementValue(el, option.value);
      dispatchValueEvents(el);
      return true;
    }
    setElementValue(el, value);
    dispatchValueEvents(el);
    return true;
  }

  function waitForMutation(predicate, timeoutMs = CONFIG.renderTimeoutMs) {
    return new Promise((resolve) => {
      const immediate = predicate();
      if (immediate) {
        resolve(immediate);
        return;
      }
      const observer = new MutationObserver(() => {
        const result = predicate();
        if (result) {
          observer.disconnect();
          clearTimeout(timer);
          resolve(result);
        }
      });
      const timer = window.setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  function optionCandidates() {
    return [...document.querySelectorAll(["[role='option']", "[cmdk-item]", "[data-value]", ".chakra-menu__menuitem", ".chakra-select__option", "li", "button", "div[tabindex]"].join(","))].filter(isVisible);
  }

  async function setCustomDropdownByText(root, field, value) {
    const container = fieldContainerByLabel(root, field.label);
    if (!container) return false;
    const control = [...container.querySelectorAll("[role='combobox'], [aria-haspopup='listbox'], button, input, [tabindex]")]
      .filter(isVisible)
      .find((el) => !el.closest(`#${CSS.escape(CONFIG.panelId)}`));
    if (!control) return false;

    control.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    control.click();

    const option = await waitForMutation(() => optionCandidates().find((el) => normalize(el.textContent) === normalize(value)), CONFIG.dropdownOpenTimeoutMs);
    if (!option) {
      error(`Could not find dropdown option by visible text: ${field.label} = ${value}`);
      return false;
    }
    option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    option.click();
    return true;
  }

  async function applyValues(root, values, options = {}) {
    const clean = sanitizeValues(values || {}, options);
    for (const field of CONFIG.fields) {
      if (clean[field.key] === undefined) continue;
      const native = findNativeField(root, field);
      if (native && setNativeFieldValue(native, clean[field.key])) continue;
      await setCustomDropdownByText(root, field, clean[field.key]);
    }
    writePrevious(clean);
  }

  function syncNativeFieldState(root, fieldKey) {
    const field = CONFIG.fields.find((item) => item.key === fieldKey);
    const input = field ? findNativeField(root, field) : null;
    if (!input || !input.value) return;
    setElementValue(input, input.value);
    dispatchValueEvents(input);
  }

  async function applyPresetValues(root, values) {
    const dateField = CONFIG.fields.find((field) => field.key === "date");
    const dateInput = dateField ? findNativeField(root, dateField) : null;
    const currentDate = dateInput?.value || "";
    await applyValues(root, values, { presetOnly: true });
    if (dateInput && dateInput.value !== currentDate) {
      setNativeFieldValue(dateInput, currentDate);
      writeLastUsed(currentValues(root));
      log("Restored persistent date after applying preset.");
    }
    syncNativeFieldState(root, "date");
    syncNativeFieldState(root, "description");
  }

  function findActivityForm() {
    for (const selector of CONFIG.formSelectors) {
      const forms = [...document.querySelectorAll(selector)].filter(isVisible);
      const form = forms.find((candidate) => {
        const text = normalize(candidate.closest(CONFIG.modalSelectors.join(","))?.textContent || candidate.textContent);
        return text.includes(normalize(CONFIG.modalTitleText)) || candidate.id === "createActivityForm";
      });
      if (form) return form;
    }
    return null;
  }

  function findModalForForm(form) {
    return form?.closest(CONFIG.modalSelectors.join(",")) || form?.parentElement || null;
  }

  async function applyLastUsedSelections(root) {
    if (!CONFIG.autoApplyLastUsedSelections) return;
    const lastUsed = readLastUsed();
    if (!lastUsed) return;
    await applyValues(root, lastUsed, { lastUsedOnly: true });
    syncNativeFieldState(root, "date");
    syncNativeFieldState(root, "description");
  }

  function scheduleLastUsedApply(reason = "modal open") {
    window.setTimeout(async () => {
      try {
        const form = findActivityForm();
        if (!form || form.dataset.spttLastUsedApplied === "true") return;
        form.dataset.spttLastUsedApplied = "true";
        await applyLastUsedSelections(form);
        if (!readLastUsed()?.date) defaultDate(form);
        log(`Applied last-used selections after ${reason}.`);
      } catch (err) {
        error("Could not apply last-used selections after modal open.", err);
      }
    }, 250);
  }

  function attachOpenButtonListener() {
    if (openButtonListenerAttached) return;
    openButtonListenerAttached = true;
    document.addEventListener("click", (event) => {
      const trigger = event.target?.closest?.("button, a, [role='button']");
      if (!trigger || !isVisible(trigger)) return;
      if (/^\s*new activity\b/i.test(trigger.textContent || "")) {
        const form = findActivityForm();
        if (form) delete form.dataset.spttLastUsedApplied;
        scheduleLastUsedApply("New activity click");
      }
    }, true);
  }

  function persistLastUsedSoon(form) {
    if (!CONFIG.persistLastUsedOnChange) return;
    window.clearTimeout(form.__spttLastUsedTimer);
    form.__spttLastUsedTimer = window.setTimeout(() => {
      try {
        writeLastUsed(currentValues(form));
      } catch (err) {
        error("Could not store last-used selections.", err);
      }
    }, 150);
  }

  function attachLastUsedPersistence(form) {
    form.addEventListener("input", () => persistLastUsedSoon(form), true);
    form.addEventListener("change", () => persistLastUsedSoon(form), true);
  }

  function defaultDate(root) {
    if (!CONFIG.defaultDateToToday) return;
    const dateField = CONFIG.fields.find((field) => field.key === "date");
    const input = dateField ? findNativeField(root, dateField) : null;
    if (!input || input.value) return;
    setNativeFieldValue(input, todayIso());
  }

  function stylePanel(panel) {
    panel.style.cssText = [`border:1px solid ${CONFIG.theme.accentBorder}`, "border-radius:8px", "padding:8px 10px", "margin:0 0 12px", `background:${CONFIG.theme.accentSoft}`, `color:${CONFIG.theme.accentDark}`, "font:13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif"].join(";");
  }

  function button(text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.style.cssText = `border:1px solid ${CONFIG.theme.accentBorder};background:white;border-radius:6px;padding:5px 8px;cursor:pointer;min-height:30px;color:${CONFIG.theme.accentDark};`;
    return btn;
  }

  function parseHours(text) {
    const match = String(text || "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function parseDateKey(text) {
    const value = String(text || "").trim();
    let match = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${year}-${month}-${day}`;
    }
    match = value.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    return "";
  }

  function formatDateKey(key) {
    const match = String(key || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : key;
  }

  function findLabelValueRows(labelText) {
    const wanted = normalize(labelText);
    return [...document.querySelectorAll("div, p, li, span")]
      .filter(isVisible)
      .filter((el) => {
        const text = normalize(el.textContent);
        return text.includes(wanted) && text.length < 90;
      })
      .sort((a, b) => normalize(a.textContent).length - normalize(b.textContent).length);
  }

  function findWeeklyTotalAnchor() {
    const candidates = findLabelValueRows("Weekly total");
    return candidates.find((el) => /weekly total\s*:?\s*[-\d.]+\s*hrs?/i.test(el.textContent))
      || candidates.find((el) => /weekly total/i.test(el.textContent))
      || null;
  }

  function findSummaryMount(anchor) {
    const summaryCard = [...document.querySelectorAll("section, div")]
      .filter(isVisible)
      .filter((el) => {
        const text = normalize(el.textContent);
        return text.includes("logbook summary") && text.includes("weekly total") && text.length < 700;
      })
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];

    if (summaryCard) {
      const rightColumn = [...summaryCard.querySelectorAll("div")]
        .filter(isVisible)
        .filter((el) => normalize(el.textContent).includes("weekly total") && normalize(el.textContent).length < 220)
        .sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0];
      return rightColumn || summaryCard;
    }
    return anchor?.parentElement || anchor || null;
  }

  function readActivitiesFromTables() {
    const activities = [];
    document.querySelectorAll("table").forEach((table) => {
      const headers = [...table.querySelectorAll("thead th, thead [role='columnheader'], tr:first-child th")].map((cell) => normalize(cell.textContent));
      const dateIndex = headers.findIndex((header) => header === "date" || header.includes("date"));
      const durationIndex = headers.findIndex((header) => header.includes("duration") || header.includes("hours"));
      if (dateIndex < 0 || durationIndex < 0) return;
      table.querySelectorAll("tbody tr").forEach((row) => {
        const cells = [...row.children];
        const date = parseDateKey(cells[dateIndex]?.textContent || "");
        const hours = parseHours(cells[durationIndex]?.textContent || "");
        if (date && Number.isFinite(hours)) activities.push({ date, hours });
      });
    });
    return activities;
  }

  function readSelectedActivityDetail() {
    const activitySection = [...document.querySelectorAll("section, [id='activity']")]
      .filter(isVisible)
      .find((section) => normalize(section.textContent).includes("activity") && normalize(section.textContent).includes("duration"));
    if (!activitySection) return [];
    const text = activitySection.textContent || "";
    if (/no activity selected/i.test(text)) return [];
    const date = parseDateKey(text);
    const durationMatch = text.match(/Duration \(hours\)\s*:?\s*(-?\d+(?:\.\d+)?)/i);
    const hours = durationMatch ? Number(durationMatch[1]) : NaN;
    return date && Number.isFinite(hours) ? [{ date, hours }] : [];
  }

  function readRenderedActivities() {
    const tableActivities = readActivitiesFromTables();
    if (tableActivities.length) return tableActivities;
    return readSelectedActivityDetail();
  }

  function itemsPerPageContainers() {
    return [...document.querySelectorAll("div, td, span, p")]
      .filter(isVisible)
      .filter((el) => /items\s+per\s+page\s*:?/i.test(el.textContent || ""))
      .map((el) => el.closest("tr, [role='row'], div") || el)
      .filter((el, index, list) => el && list.indexOf(el) === index);
  }

  function selectHasPageSizeOption(select) {
    const values = [...select.options].map((option) => normalize(option.textContent || option.value));
    return values.includes(CONFIG.defaultActivitiesPerPage) && (values.includes("5") || values.includes("10"));
  }

  function isItemsPerPageControl(select) {
    if (!selectHasPageSizeOption(select)) return false;
    const containers = itemsPerPageContainers();
    if (containers.some((container) => container.contains(select))) return true;
    const context = [select.closest("label")?.textContent, select.parentElement?.textContent, select.closest("div")?.textContent]
      .filter(Boolean)
      .join(" ");
    return /items\s+per\s+page/i.test(context);
  }

  async function defaultCustomItemsPerPage(container) {
    const current = [...container.querySelectorAll("button, [role='button'], [aria-haspopup='listbox'], div[tabindex]")]
      .filter(isVisible)
      .find((el) => normalize(el.textContent) !== CONFIG.defaultActivitiesPerPage && /^\s*\d+\s*$/.test(el.textContent || ""));
    if (!current) return false;

    current.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    current.click();

    const option = await waitForMutation(() => {
      return optionCandidates().find((el) => normalize(el.textContent) === CONFIG.defaultActivitiesPerPage);
    }, CONFIG.dropdownOpenTimeoutMs);

    if (!option) return false;
    option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    option.click();
    log(`Defaulted custom activities items per page to ${CONFIG.defaultActivitiesPerPage}.`);
    return true;
  }

  async function defaultActivitiesItemsPerPage() {
    if (pageSizeDefaultInProgress) return;
    pageSizeDefaultInProgress = true;
    try {
      const selects = [...document.querySelectorAll("select")].filter(isVisible).filter(isItemsPerPageControl);
      let changed = false;
      selects.forEach((select) => {
        const option = [...select.options].find((item) => normalize(item.textContent) === CONFIG.defaultActivitiesPerPage)
          || [...select.options].find((item) => normalize(item.value) === CONFIG.defaultActivitiesPerPage);
        if (!option) return;
        if (select.value !== option.value) {
          setNativeFieldValue(select, option.value);
          changed = true;
          log(`Defaulted activities items per page to ${CONFIG.defaultActivitiesPerPage}.`);
        }
      });
      if (changed) return;

      for (const container of itemsPerPageContainers()) {
        const text = normalize(container.textContent);
        const alreadyDefaulted = new RegExp(`items\\s+per\\s+page\\s*:?\\s*${CONFIG.defaultActivitiesPerPage}\\b`, "i").test(text);
        if (alreadyDefaulted) continue;
        if (await defaultCustomItemsPerPage(container)) return;
      }
    } catch (err) {
      error("Could not default activities items per page.", err);
    } finally {
      pageSizeDefaultInProgress = false;
    }
  }

  function renderDailyTotals() {
    try {
      const anchor = findWeeklyTotalAnchor();
      if (!anchor) return;
      const activities = readRenderedActivities();
      let panel = document.getElementById(CONFIG.dailyTotalsId);
      if (!activities.length) {
        panel?.remove();
        return;
      }
      const totals = new Map();
      activities.forEach(({ date, hours }) => totals.set(date, (totals.get(date) || 0) + hours));
      const rows = [...totals.entries()].sort(([a], [b]) => a.localeCompare(b));
      const signature = JSON.stringify(rows);
      if (panel?.dataset.signature === signature) return;
      dailyTotalsSignature = signature;

      const mount = findSummaryMount(anchor);
      if (!mount) return;
      if (!panel) {
        panel = document.createElement("section");
        panel.id = CONFIG.dailyTotalsId;
        panel.setAttribute("aria-label", "Daily hours tally");
      }
      panel.style.cssText = `margin:4px 0 0;font:inherit;color:${CONFIG.theme.accentDark};`;
      if (panel.parentElement !== mount) mount.append(panel);

      panel.dataset.signature = dailyTotalsSignature;
      panel.textContent = "";
      const title = document.createElement("div");
      title.textContent = "Daily totals";
      title.style.cssText = `font-weight:600;margin:2px 0 3px;color:${CONFIG.theme.accentDark};`;
      panel.append(title);

      rows.forEach(([date, hours]) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;max-width:220px;";
        const label = document.createElement("span");
        label.textContent = formatDateKey(date);
        label.style.cssText = `color:${CONFIG.theme.accent};`;
        const value = document.createElement("strong");
        value.textContent = `${Number(hours.toFixed(2))} hrs`;
        value.style.cssText = `color:${CONFIG.theme.accentDark};`;
        row.append(label, value);
        panel.append(row);
      });
    } catch (err) {
      error("Could not render daily hours tally.", err);
    }
  }

  function presetChip(name, onApply, onDelete) {
    const wrap = document.createElement("span");
    wrap.style.cssText = `display:inline-flex;align-items:center;border:1px solid ${CONFIG.theme.accentBorder};border-radius:999px;background:white;overflow:hidden;color:${CONFIG.theme.accentDark};`;

    const apply = document.createElement("button");
    apply.type = "button";
    apply.textContent = name;
    apply.title = `Apply ${name}`;
    apply.style.cssText = `border:0;background:white;padding:5px 9px;cursor:pointer;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${CONFIG.theme.accentDark};`;
    apply.addEventListener("click", onApply);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "x";
    remove.title = `Delete ${name}`;
    remove.style.cssText = `border:0;border-left:1px solid ${CONFIG.theme.accentBorder};background:${CONFIG.theme.accentSoft};padding:5px 8px;cursor:pointer;color:${CONFIG.theme.accentDark};`;
    remove.addEventListener("click", onDelete);

    wrap.append(apply, remove);
    return wrap;
  }

  function isContractDashboardPage() {
    return /^\/contracts\/[^/]+\/?$/.test(window.location.pathname);
  }

  function readLabelValue(labelText) {
    const wanted = normalize(labelText);
    const candidates = [...document.querySelectorAll("div, p, li, span")]
      .filter(isVisible)
      .map((el) => ({ el, text: (el.textContent || "").replace(/\s+/g, " ").trim() }))
      .filter((item) => normalize(item.text).includes(wanted) && item.text.length < 220)
      .sort((a, b) => a.text.length - b.text.length);

    for (const item of candidates) {
      const regex = new RegExp(`${labelText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*(.+)$`, "i");
      const match = item.text.match(regex);
      if (match?.[1]) return match[1].trim();
      const parentText = (item.el.parentElement?.textContent || "").replace(/\s+/g, " ").trim();
      const parentMatch = parentText.match(regex);
      if (parentMatch?.[1] && parentText.length < 260) return parentMatch[1].trim();
    }
    return "";
  }

  function parseNumber(value) {
    const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function parseDisplayDate(value) {
    const match = String(value || "").match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dayDiff(a, b) {
    return Math.round((startOfLocalDay(a).getTime() - startOfLocalDay(b).getTime()) / 86400000);
  }

  function findContractSummaryCard() {
    return [...document.querySelectorAll("section, div")]
      .filter(isVisible)
      .filter((el) => {
        const text = normalize(el.textContent);
        return text.includes("contract summary") && text.includes("date commenced") && text.includes("planned completion") && text.length < 1200;
      })
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0] || null;
  }

  function findMetricCard(titleText) {
    const wanted = normalize(titleText);
    const label = [...document.querySelectorAll("h1, h2, h3, h4, h5, p, span, div")]
      .filter(isVisible)
      .find((el) => normalize(el.textContent) === wanted);
    if (!label) return null;
    return label.closest("section, div") || label.parentElement;
  }

  function findMetricValueRow(card) {
    return [...card.querySelectorAll("div, span")]
      .filter(isVisible)
      .filter((el) => /\d/.test(el.textContent || "") && normalize(el.textContent).length < 80)
      .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
      || card;
  }

  function renderContractDashboardProgress() {
    try {
      if (!isContractDashboardPage()) return;
      const summaryCard = findContractSummaryCard();
      if (!summaryCard) return;

      const commenced = parseDisplayDate(readLabelValue("Date commenced"));
      const completion = parseDisplayDate(readLabelValue("Planned completion"));
      const placementHours = parseNumber(readLabelValue("Placement hours"));
      if (commenced && completion) {
        const today = startOfLocalDay(new Date());
        const totalWeeks = Math.max(1, Math.ceil((dayDiff(completion, commenced) + 1) / 7));
        const currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(dayDiff(today, commenced) / 7) + 1));
        const weeksToGo = Math.max(0, Math.ceil(dayDiff(completion, today) / 7));
        let progress = document.getElementById(CONFIG.contractProgressId);
        if (!progress) {
          progress = document.createElement("div");
          progress.id = CONFIG.contractProgressId;
          progress.setAttribute("aria-label", "Placement week progress");
          summaryCard.append(progress);
        }
        const progressStyle = `margin:12px auto 0;display:flex;justify-content:center;align-items:center;gap:0;color:${CONFIG.theme.accentDark};text-align:center;`;
        if (progress.style.cssText !== progressStyle) progress.style.cssText = progressStyle;
        const contactCard = findMetricCard("Client contact hours");
        const currentContactHours = contactCard ? parseNumber(contactCard.textContent) : NaN;
        const savedClientTarget = readClientContactTarget();
        const clientTarget = savedClientTarget ?? (CONFIG.usePlacementHoursAsClientContactFallback ? placementHours : NaN);
        const projectedTotal = Number.isFinite(currentContactHours)
          ? (currentContactHours / currentWeek) * totalWeeks
          : NaN;
        const forecastHours = Number.isFinite(projectedTotal) ? Number(projectedTotal.toFixed(1)) : null;
        const forecastTarget = Number.isFinite(clientTarget) ? Number(clientTarget.toFixed(2)) : null;
        const progressText = `week:${currentWeek}/${totalWeeks}|remaining:${weeksToGo}|forecast:${forecastHours ?? ""}/${forecastTarget ?? ""}`;
        if (progress.dataset.signature !== progressText) {
          progress.dataset.signature = progressText;
          progress.textContent = "";
          const segments = [
            ["Week ", currentWeek, " / ", totalWeeks],
            ["", weeksToGo, " weeks remaining"],
            ["Client contact forecast: ", forecastHours ?? "-", forecastTarget !== null ? " / " : "", forecastTarget ?? "", " hrs"],
          ];
          segments.forEach((parts, index) => {
            const segment = document.createElement("span");
            segment.style.cssText = `display:inline-flex;align-items:baseline;justify-content:center;padding:0 14px;${index > 0 ? `border-left:1px solid ${CONFIG.theme.accentBorder};` : ""}`;
            if (index === 2) {
              segment.title = "Click to change client contact target hours";
              segment.style.cursor = "pointer";
              segment.addEventListener("click", () => {
                const next = window.prompt("Client contact target hours", String(readClientContactTarget() ?? ""));
                if (next === null) return;
                const saved = writeClientContactTarget(next);
                if (saved !== null) {
                  progress.dataset.signature = "";
                  renderContractDashboardProgress();
                }
              });
            }
            parts.forEach((part) => {
              const node = document.createElement(typeof part === "number" ? "strong" : "span");
              node.textContent = String(part);
              if (typeof part === "number") node.style.cssText = "font-weight:800;";
              segment.append(node);
            });
            progress.append(segment);
          });
        }
      }

      if (Number.isFinite(clientTarget)) {
        const card = findMetricCard("Client contact hours");
        if (!card) return;
        let target = document.getElementById(CONFIG.clientContactTargetId);
        if (!target) {
          target = document.createElement("span");
          target.id = CONFIG.clientContactTargetId;
          target.setAttribute("aria-label", "Client contact target hours");
        }
        const valueRow = findMetricValueRow(card);
        if (target.parentElement !== valueRow) valueRow.append(target);
        const current = parseNumber(card.textContent);
        const percent = Number.isFinite(current) && clientTarget > 0 ? ` (${Math.round((current / clientTarget) * 100)}%)` : "";
        const targetStyle = `display:inline-flex;align-items:baseline;margin-left:8px;color:${CONFIG.theme.accentDark};font-size:18px;font-weight:700;white-space:nowrap;`;
        if (target.style.cssText !== targetStyle) target.style.cssText = targetStyle;
        const targetText = `of ${Number(clientTarget.toFixed(2))} hrs${percent}`;
        if (target.textContent !== targetText) target.textContent = targetText;
      }
    } catch (err) {
      error("Could not render contract dashboard progress.", err);
    }
  }
  function renderPanel(form) {
    if (document.getElementById(CONFIG.panelId)) return;
    const panel = document.createElement("section");
    panel.id = CONFIG.panelId;
    panel.setAttribute("aria-label", "Logbook presets");
    stylePanel(panel);

    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;flex-wrap:wrap;";
    const title = document.createElement("div");
    title.textContent = "Logbook presets";
    title.style.cssText = `font-weight:700;color:${CONFIG.theme.accentDark};`;
    const status = document.createElement("span");
    status.style.cssText = `color:${CONFIG.theme.accent};font-size:12px;`;
    const presetList = document.createElement("div");
    presetList.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-height:30px;margin-bottom:7px;";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Preset name";
    nameInput.setAttribute("aria-label", "Preset name");
    nameInput.style.cssText = `width:140px;max-width:100%;padding:5px 8px;border:1px solid ${CONFIG.theme.accentBorder};border-radius:6px;min-height:30px;color:${CONFIG.theme.accentDark};`;

    const refreshPresets = () => {
      const presets = readPresets();
      writePresets(presets);
      presetList.textContent = "";
      status.textContent = presets.length ? `${presets.length} saved` : "No presets saved";
      if (!presets.length) {
        const empty = document.createElement("span");
        empty.textContent = "Save current selections to create one-click presets.";
        empty.style.cssText = `color:${CONFIG.theme.accent};font-size:12px;`;
        presetList.append(empty);
        return;
      }
      presets.forEach((preset, index) => {
        presetList.append(presetChip(
          preset.name,
          async () => {
            try {
              await applyPresetValues(form, preset.values);
              log(`Applied preset: ${preset.name}`);
            } catch (err) {
              error("Could not apply preset.", err);
            }
          },
          () => {
            try {
              const next = readPresets().filter((_, itemIndex) => itemIndex !== index);
              writePresets(next);
              refreshPresets();
              log(`Deleted preset: ${preset.name}`);
            } catch (err) {
              error("Could not delete preset.", err);
            }
          },
        ));
      });
    };

    const save = button("Save current");
    save.addEventListener("click", () => {
      try {
        const name = nameInput.value.trim();
        if (!name) return;
        const values = currentValues(form);
        const presets = readPresets().filter((preset) => preset.name !== name);
        const presetValues = sanitizeValues(values, { presetOnly: true });
        presets.push({ name, values: presetValues, savedAt: new Date().toISOString() });
        writePresets(presets.slice(-CONFIG.maxPresets));
        writePrevious(values);
        nameInput.value = "";
        refreshPresets();
        log(`Saved preset: ${name}`);
      } catch (err) {
        error("Could not save preset.", err);
      }
    });

    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        save.click();
      }
    });

    const repeat = button("Repeat previous");
    repeat.addEventListener("click", async () => {
      try {
        const previous = readPrevious();
        if (!previous) {
          error("No previous activity has been stored yet. Save a preset, apply one, or manually submit once to record the previous values.");
          return;
        }
        await applyValues(form, previous);
        log("Repeated previous activity values.");
      } catch (err) {
        error("Could not repeat previous activity.", err);
      }
    });

    const copyPresets = button("Copy presets");
    copyPresets.addEventListener("click", async () => {
      try {
        const json = JSON.stringify(readPresets(), null, 2);
        await navigator.clipboard.writeText(json);
        log("Copied presets JSON for baking into CONFIG.bakedPresets.");
      } catch (err) {
        error("Could not copy presets JSON. Check browser clipboard permission, then inspect readPresets() in the console.", err);
      }
    });

    header.append(title, status);
    row.append(nameInput, save, repeat, copyPresets);
    panel.append(header, presetList, row);
    refreshPresets();

    form.addEventListener("submit", () => {
      try {
        const values = currentValues(form);
        writePrevious(values);
        writeLastUsed(values);
        log("Stored previous activity values from manual submit. The userscript did not submit the form.");
      } catch (err) {
        error("Could not store previous activity values on manual submit.", err);
      }
    }, true);

    const body = findModalForForm(form)?.querySelector("[class*='Body'], .chakra-modal__body") || form;
    body.insertBefore(panel, body.firstChild);
  }

  async function initialiseForCurrentModal() {
    try {
      attachOpenButtonListener();
      const form = findActivityForm();
      if (!form) return;
      if (!INITIALISED_FORMS.has(form)) {
        INITIALISED_FORMS.add(form);
        attachLastUsedPersistence(form);
        scheduleLastUsedApply("initial modal detection");
      }
      if (!readLastUsed()?.date) defaultDate(form);
      renderPanel(form);
    } catch (err) {
      error("Initialisation failed.", err);
    }
  }
  function runPageEnhancements() {
    initialiseForCurrentModal();
    renderDailyTotals();
    defaultActivitiesItemsPerPage();
    renderContractDashboardProgress();
  }

  function schedulePageEnhancements() {
    window.clearTimeout(enhancementTimer);
    enhancementTimer = window.setTimeout(runPageEnhancements, 120);
  }

  const observer = new MutationObserver(schedulePageEnhancements);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  waitForMutation(findActivityForm).then(initialiseForCurrentModal).catch((err) => error("Initial wait failed.", err));
  runPageEnhancements();
})();
