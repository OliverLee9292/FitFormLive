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

export function renderExercisePicker(panelEl, exercises, onSelect, onClose) {
  if (!panelEl) return;
  let html = `
    <div class="exercise-picker-header">
      <h2 class="exercise-picker-title">운동 동작 선택</h2>
      <button id="exercise-picker-close" class="btn secondary" style="font-size:12px; padding:4px 10px;">닫기</button>
    </div>
    <div class="exercise-picker-grid">
  `;
  Object.keys(exercises).forEach((key) => {
    const ex = exercises[key];
    html += `
      <div class="exercise-card">
        <h3 class="exercise-card-title">${ex.name}</h3>
        <span class="exercise-type-tag">${ex.type || "운동"}</span>
        <p class="exercise-short">${ex.shortDesc || "이 동작을 선택해 자세를 인식합니다."}</p>
        <button class="btn exercise-start-btn" data-ex-key="${key}">이 동작으로 시작</button>
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
  summaryEl.innerHTML = `
    <div style="max-width:420px; padding:24px 28px; border-radius:18px; background:rgba(15,23,42,0.98); border:1px solid rgba(148,163,184,0.4); box-shadow:0 24px 60px rgba(0,0,0,0.8);">
      <h2 style="margin:0 0 12px; font-size:20px; font-weight:700;">운동 요약</h2>
      <p style="margin:0 0 8px; font-size:14px; color:#9ca3af;">${summaryData.exerciseName}</p>
      <p style="margin:0 0 4px; font-size:16px;">총 횟수: <strong>${summaryData.reps}</strong>회</p>
      <p style="margin:0 0 12px; font-size:14px; color:#e5e7eb;">${summaryData.qualityText}</p>
      <p style="margin:0 0 16px; font-size:13px; color:#9ca3af;">다시 시작하려면 화면을 클릭하거나 아래 버튼을 누르세요.</p>
      <button id="summary-close-btn" class="btn secondary" style="padding:6px 14px; font-size:13px;">닫기</button>
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
