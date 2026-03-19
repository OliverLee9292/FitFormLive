export function updateHud({ hudReps, hudAngle, hudFps, statusLabel, statusDetail, statusDot }, { reps, angle, fps, label, detail, good }) {
  if (hudReps) hudReps.textContent = reps;
  if (hudAngle) hudAngle.textContent = `${Math.round(angle)}°`;
  if (hudFps) hudFps.textContent = fps.toFixed(0);
  if (statusLabel) statusLabel.textContent = label;
  if (statusDetail) statusDetail.textContent = detail;
  if (statusDot) {
    statusDot.classList.remove("good", "bad");
    if (good === true) {
      statusDot.classList.add("good");
    } else if (good === false) {
      statusDot.classList.add("bad");
    }
  }
}

import { t, getLanguage } from "./i18n.js";

export function renderExercisePicker(panelEl, exercises, onSelect, onClose) {
  if (!panelEl) return;
  let html = `
    <div class="exercise-picker-header">
      <h2 class="exercise-picker-title">${t("picker_title", "Choose Exercise")}</h2>
      <button id="exercise-picker-close" class="btn secondary" style="font-size:12px; padding:4px 10px;">${t("picker_close", "Close")}</button>
    </div>
    <div class="exercise-picker-grid">
  `;
  Object.keys(exercises).forEach((key) => {
    const ex = exercises[key];
    const lang = getLanguage();
    const type = lang === "en" && ex.typeEn ? ex.typeEn : ex.type || t("picker_type_default", "Exercise");
    const desc = lang === "en" && ex.shortDescEn ? ex.shortDescEn : ex.shortDesc || t("picker_desc_default", "Select to start pose tracking.");
    html += `
      <div class="exercise-card">
        <h3 class="exercise-card-title">${ex.name}</h3>
        <span class="exercise-type-tag">${type}</span>
        <p class="exercise-short">${desc}</p>
        <button class="btn exercise-start-btn" data-ex-key="${key}">${t("picker_start_btn", "Start with this")}</button>
      </div>
    `;
  });
  html += `</div>`;
  panelEl.innerHTML = html;

  const closeBtn = document.getElementById("exercise-picker-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (typeof onClose === "function") onClose();
    });
  }

  const buttons = panelEl.querySelectorAll(".exercise-start-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const key = btn.getAttribute("data-ex-key");
      if (key && typeof onSelect === "function") {
        onSelect(key);
      }
    });
  });
}

export function showSummaryOverlay(summaryEl, summaryData, onClose) {
  if (!summaryEl) return;
  const lang = getLanguage();
  const qText = lang === "en" && summaryData.qualityTextEn ? summaryData.qualityTextEn : summaryData.qualityText;
  summaryEl.innerHTML = `
    <div style="max-width:420px; padding:24px 28px; border-radius:18px; background:rgba(15,23,42,0.98); border:1px solid rgba(148,163,184,0.4); box-shadow:0 24px 60px rgba(0,0,0,0.8);">
      <h2 style="margin:0 0 12px; font-size:20px; font-weight:700;">${t("summary_title", "Workout Summary")}</h2>
      <p style="margin:0 0 8px; font-size:14px; color:#9ca3af;">${summaryData.exerciseName}</p>
      <p style="margin:0 0 4px; font-size:16px;">${t("summary_total", "Total reps")}: <strong>${summaryData.reps}</strong></p>
      <p style="margin:0 0 12px; font-size:14px; color:#e5e7eb;">${qText}</p>
      <p style="margin:0 0 16px; font-size:13px; color:#9ca3af;">${t("summary_hint", "Click the screen or press the button below to restart.")}</p>
      <button id="summary-close-btn" class="btn secondary" style="padding:6px 14px; font-size:13px;">${t("picker_close", "Close")}</button>
    </div>
  `;
  summaryEl.style.opacity = 1;
  summaryEl.style.pointerEvents = "auto";
  const closeBtn = document.getElementById("summary-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (typeof onClose === "function") onClose();
    });
  }
  summaryEl.addEventListener("click", onClose, { once: true });
}

export function hideSummaryOverlay(summaryEl) {
  if (!summaryEl) return;
  summaryEl.style.opacity = 0;
  summaryEl.style.pointerEvents = "none";
}

export function setActiveMenu(buttons, activeBtn) {
  buttons.forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle("active", btn === activeBtn);
  });
}
