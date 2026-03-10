/* ============================================================
   MaternaCheck — Pregnancy Wellness Guide
   Frontend Script: app.js
   ============================================================ */

/* ── Application State ── */
const state = {
  gestWeek: 0,
  gravida: '',
  painLevel: 0,
  headache: 0,
  contractions: 'none',
  bleeding: 'none',
  fluid: 'none',
  fetalMovement: 'normal',
  kickCount: 0,
  swelling: 'none',
  vision: 'none',
  upperPain: 'no',
  breathing: 'none',
  pre: [],
  other: []
};

let kicksCount = 0;
let currentStep = 0;

const STEP_LABELS = ['Context', 'Pain', 'Bleeding', 'Baby', 'Swelling', 'Other'];

// Backend API base URL
const API_BASE = 'https://materna-check-ai-4mmz.vercel.app';

/* ── Initialisation ── */
window.onload = () => {
  buildWeekGrid();
  buildStepDots();
  // Default pain scale selects "0"
  document.querySelector('#painScale .pain-btn').classList.add('sel');
  document.querySelector('#headScale .pain-btn').classList.add('sel');
};

/* ── Build Week Grid (Weeks 32–40) ── */
function buildWeekGrid() {
  const g = document.getElementById('weekGrid');
  for (let w = 32; w <= 40; w++) {
    const b = document.createElement('button');
    b.className = 'week-btn';
    b.innerHTML = `${w}<small>wks</small>`;
    b.onclick = () => {
      document.querySelectorAll('.week-btn').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      state.gestWeek = w;
      document.getElementById('weekDisplay').textContent = `Week ${w}`;
    };
    g.appendChild(b);
  }
}

/* ── Build Step Dots ── */
function buildStepDots() {
  const w = document.getElementById('stepDots');
  STEP_LABELS.forEach((l, i) => {
    const d = document.createElement('div');
    d.className = 'step-dot' + (i === 0 ? ' active' : '');
    d.innerHTML = `<div class="step-dot-circle">${i + 1}</div><div class="step-dot-label">${l}</div>`;
    w.appendChild(d);
  });
}

/* ── Update Progress Bar & Dots ── */
function updateProgress(s) {
  document.getElementById('progressFill').style.width = (s / (STEP_LABELS.length - 1) * 100) + '%';
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.className = 'step-dot' + (i < s ? ' done' : i === s ? ' active' : '');
  });
}

/* ── Navigate Between Steps ── */
function goStep(n) {
  document.getElementById(`step${currentStep}`).classList.remove('active');
  currentStep = n;
  document.getElementById(`step${n}`).classList.add('active');
  document.getElementById('progressWrap').style.display = 'block';
  updateProgress(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Yes/No Toggle (generic, adds 'no' class for selected) ── */
function setYN(btn, field, val) {
  state[field] = val;
  btn.parentElement.querySelectorAll('.yn-btn').forEach(b => (b.className = 'yn-btn'));
  btn.classList.add('no');
}

/* ── Yes/No Toggle for Named Field ── */
function setYNField(field, val, yId, nId) {
  state[field] = val;
  document.getElementById(yId).className = 'yn-btn' + (val === 'yes' ? ' no' : '');
  document.getElementById(nId).className = 'yn-btn' + (val === 'no' ? ' yes' : '');
}

/* ── Multi-select Symptom Toggle ── */
function toggleSym(card, group) {
  card.classList.toggle('active');
  const v = card.dataset.val;
  if (!state[group]) state[group] = [];
  const i = state[group].indexOf(v);
  if (i >= 0) state[group].splice(i, 1);
  else state[group].push(v);
}

/* ── Single-select Symptom (radio-style) ── */
function setSingle(card, field, val, cls) {
  card.parentElement.querySelectorAll('.sym-card').forEach(c => (c.className = 'sym-card'));
  card.className = 'sym-card ' + (cls || 'active');
  state[field] = val;
}

/* ── Pain Scale Selection ── */
function setPain(btn) {
  document.querySelectorAll('#painScale .pain-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  state.painLevel = parseInt(btn.dataset.v);
}

/* ── Headache Scale Selection ── */
function setHead(btn) {
  document.querySelectorAll('#headScale .pain-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  state.headache = parseInt(btn.dataset.v);
}

/* ── Kick Counter ── */
function addKick() {
  kicksCount++;
  state.kickCount = kicksCount;
  document.getElementById('kickNum').textContent = kicksCount;
  document.getElementById('kickCount').value = kicksCount;

  const baby = document.getElementById('kickBaby');
  baby.style.transform = 'scale(1.3)';
  setTimeout(() => { baby.style.transform = 'scale(1)'; }, 150);

  document.getElementById('kickBar').style.width = Math.min(100, (kicksCount / 10) * 100) + '%';

  const msgs = [
    'Start tapping every time you feel baby move 💝',
    'Keep going — every kick counts! 💝',
    'Great! Baby is active 🌟',
    'Wonderful! Almost at 10 ✨',
    '10 kicks! Baby is doing great! 💚'
  ];
  if      (kicksCount >= 10) document.getElementById('kickMsg').textContent = msgs[4];
  else if (kicksCount >= 7)  document.getElementById('kickMsg').textContent = msgs[3];
  else if (kicksCount >= 4)  document.getElementById('kickMsg').textContent = msgs[2];
  else                       document.getElementById('kickMsg').textContent = msgs[1];
}

/* ════════════════════════════════════════
   ANALYZE — calls backend API
   ════════════════════════════════════════ */
async function analyzeSymptoms() {
  // Show loading state on the button
  const analyzeBtn = document.querySelector('.btn-analyze');
  const originalText = analyzeBtn.innerHTML;
  analyzeBtn.innerHTML = '🌸 Analyzing...';
  analyzeBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: state })
    });

    if (!response.ok) {
      throw new Error('Server returned an error');
    }

    const data = await response.json();
    showResults(
      data.riskLevel,
      data.score,
      data.trail,
      data.emergencyReasons,
      data.context,
      data.guidance,
      data.aiAdvice
    );
  } catch (err) {
    console.error('API call failed, using local fallback:', err);
    // Fallback: run analysis locally if backend is not available
    analyzeLocal();
  } finally {
    analyzeBtn.innerHTML = originalText;
    analyzeBtn.disabled = false;
  }
}

/* ════════════════════════════════════════
   LOCAL FALLBACK ANALYSIS (same logic as backend)
   Used when frontend is opened without the server
   ════════════════════════════════════════ */
function analyzeLocal() {
  const s = state;
  const week = s.gestWeek || 36;
  const preterm = week < 37;
  let score = 0;
  let trail = [];
  let emergencyReasons = [];

  trail.push({
    type: 'ok', icon: '🗓',
    title: `Week ${week} pregnancy`,
    detail: preterm
      ? `You are at ${week} weeks — before full term (37 wks). Any labor symptoms need urgent evaluation.`
      : `You are at term (${week} weeks). Your baby is ready. Signs of labor are expected soon.`
  });

  if (s.contractions === 'constant' || s.contractions === 'sub5') {
    score += 42;
    emergencyReasons.push('Frequent or constant contractions');
    trail.push({ type: 'crit', icon: '🚨', title: 'Dangerous contraction pattern', detail: 'Contractions every 5 minutes or constant — consistent with active labor. Go to hospital immediately.' });
  } else if (s.contractions === '5min') {
    score += preterm ? 35 : 22;
    trail.push({ type: 'warn', icon: '⚡', title: 'Contractions every 5–10 minutes', detail: preterm ? 'Possible preterm labor. Call your midwife right away.' : 'This may be early active labor. Prepare to go to hospital.' });
  } else if (s.contractions === '10min') {
    score += preterm ? 18 : 8;
    trail.push({ type: preterm ? 'warn' : 'ok', icon: '⏱', title: 'Contractions every 10+ minutes', detail: preterm ? 'Even mild contractions before 37 weeks need a call to your provider.' : 'Early labor signs. Time and record contractions.' });
  } else {
    trail.push({ type: 'ok', icon: '😌', title: 'No significant contractions', detail: 'No concerning contraction pattern noted. This is reassuring.' });
  }

  if (s.bleeding === 'heavy') {
    score += 48;
    emergencyReasons.push('Heavy vaginal bleeding');
    trail.push({ type: 'crit', icon: '🚨', title: 'Heavy vaginal bleeding', detail: 'Heavy bright red bleeding may indicate placental abruption or previa — a life-threatening emergency.' });
  } else if (s.bleeding === 'light') {
    score += 26;
    trail.push({ type: 'warn', icon: '⚠️', title: 'Light vaginal bleeding', detail: 'Bright red light bleeding needs same-day hospital assessment.' });
  } else if (s.bleeding === 'spotting') {
    score += 7;
    trail.push({ type: 'ok', icon: '🌸', title: 'Light spotting noted', detail: 'Pink/brown spotting can come from cervical irritation, but mention it to your provider.' });
  } else {
    trail.push({ type: 'ok', icon: '✅', title: 'No vaginal bleeding', detail: 'No bleeding reported — reassuring.' });
  }

  if (s.fluid === 'gush') {
    score += 38;
    emergencyReasons.push('Sudden fluid gush — possible rupture of membranes');
    trail.push({ type: 'crit', icon: '🌊', title: 'Waters may have broken', detail: 'A sudden gush of clear fluid is a sign of membrane rupture. Go to hospital immediately.' });
  } else if (s.fluid === 'watery') {
    score += 22;
    trail.push({ type: 'warn', icon: '💧', title: 'Possible fluid leak', detail: 'A slow watery trickle may be amniotic fluid. Needs same-day hospital assessment.' });
  } else {
    trail.push({ type: 'ok', icon: '✅', title: 'No abnormal fluid loss', detail: 'No unusual fluid changes reported.' });
  }

  if (s.fetalMovement === 'absent' || s.kickCount === 0) {
    score += 42;
    emergencyReasons.push('No fetal movement in 12+ hours');
    trail.push({ type: 'crit', icon: '🚨', title: 'No fetal movement detected', detail: 'Absence of fetal movement for 12+ hours is a serious warning sign. Seek emergency care immediately.' });
  } else if (s.fetalMovement === 'reduced' || (s.kickCount > 0 && s.kickCount < 5)) {
    score += 22;
    trail.push({ type: 'warn', icon: '⚠️', title: 'Reduced fetal movement', detail: 'Fewer kicks than usual may indicate fetal stress. Lie on your left side and count for one hour. If still fewer than 10, go to hospital.' });
  } else {
    trail.push({ type: 'ok', icon: '💚', title: `Baby moving well${s.kickCount > 0 ? ' (' + s.kickCount + ' kicks counted)' : ''}`, detail: 'Good fetal movement is one of the most reassuring signs of baby wellbeing.' });
  }

  let peFlags = 0;
  if (s.headache >= 7) peFlags++;
  if (s.vision === 'flashing' || s.vision === 'blurred') peFlags++;
  if (s.swelling === 'severe' || s.swelling === 'moderate') peFlags++;
  if (s.upperPain === 'yes') peFlags++;
  if (s.pre.includes('hypertension')) peFlags += 0.5;

  if (peFlags >= 3) {
    score += 46;
    emergencyReasons.push('Multiple preeclampsia warning signs');
    trail.push({ type: 'crit', icon: '🚨', title: `Preeclampsia cluster (${peFlags}/4 markers)`, detail: 'Severe headache + vision changes + body swelling + upper pain together strongly suggest severe preeclampsia — a life-threatening emergency.' });
  } else if (peFlags >= 2) {
    score += 26;
    trail.push({ type: 'warn', icon: '⚠️', title: `Possible preeclampsia signs (${peFlags}/4 markers)`, detail: 'Two or more blood pressure warning signs warrant urgent evaluation today.' });
  } else {
    if (s.headache >= 7) {
      score += 14;
      trail.push({ type: 'warn', icon: '🤕', title: `Severe headache (${s.headache}/10)`, detail: 'A headache this severe — not responding to rest and water — needs evaluation.' });
    } else if (s.headache > 0) {
      trail.push({ type: 'ok', icon: '💊', title: `Mild headache (${s.headache}/10)`, detail: 'Mild headaches are common in pregnancy. Stay hydrated and rest.' });
    }
    if (s.vision === 'mild') {
      score += 7;
      trail.push({ type: 'ok', icon: '✨', title: 'Occasional visual floaters', detail: 'Can be normal — mention it at your next appointment.' });
    }
    if (s.swelling === 'moderate' || s.swelling === 'severe') {
      score += 12;
      trail.push({ type: 'warn', icon: '💧', title: 'Notable swelling', detail: 'Swelling beyond the ankles (face, hands) is worth monitoring for blood pressure changes.' });
    }
  }

  if (s.breathing === 'severe') {
    score += 32;
    emergencyReasons.push('Severe breathing difficulty at rest');
    trail.push({ type: 'crit', icon: '🚨', title: 'Severe breathing difficulty', detail: 'Laboured breathing at rest can indicate pulmonary embolism or severe preeclampsia. Emergency care needed.' });
  } else if (s.breathing === 'moderate') {
    score += 14;
    trail.push({ type: 'warn', icon: '😤', title: 'Moderate breathlessness', detail: 'If affecting daily activities or worsening, call your provider today.' });
  } else {
    trail.push({ type: 'ok', icon: '😌', title: 'Breathing normal', detail: 'Mild breathlessness in late pregnancy is common due to pressure on the diaphragm.' });
  }

  if (s.other.includes('fever')) { score += 16; trail.push({ type: 'warn', icon: '🌡', title: 'Fever / Chills', detail: 'Fever in pregnancy can indicate chorioamnionitis. Contact your doctor today.' }); }
  if (s.other.includes('dizziness')) { score += 11; trail.push({ type: 'warn', icon: '😵', title: 'Dizziness / Fainting', detail: 'May indicate low BP or anaemia. Sit or lie down, hydrate, and call your provider.' }); }
  if (s.other.includes('pelvicPressure') && preterm) { score += 16; trail.push({ type: 'warn', icon: '⬇️', title: 'Pelvic pressure (preterm)', detail: 'Before 37 weeks, pelvic pressure may signal early cervical dilation. Evaluation recommended.' }); }
  if (s.other.includes('nausea')) { score += 8; trail.push({ type: 'warn', icon: '🤢', title: 'New nausea / vomiting', detail: 'New-onset nausea in late pregnancy can be linked to preeclampsia or infection.' }); }
  if (s.other.includes('backPain')) { score += 10; trail.push({ type: 'warn', icon: '🔙', title: 'Severe back pain', detail: 'Intense back pain in late pregnancy may accompany labor or abruption. Monitor closely.' }); }

  if (s.pre.includes('hypertension')) { score = Math.min(100, score * 1.2); trail.push({ type: 'warn', icon: '🫀', title: 'Risk factor: Hypertension', detail: 'Pre-existing high blood pressure means ALL BP symptoms carry extra clinical weight.' }); }
  if (s.pre.includes('twins')) { score = Math.min(100, score * 1.1); trail.push({ type: 'warn', icon: '👶👶', title: 'Risk factor: Multiple pregnancy', detail: 'Twin/multiple pregnancies have higher baseline risk for preterm labor.' }); }
  if (s.painLevel >= 8) { score += 14; trail.push({ type: 'warn', icon: '💊', title: `High pain level: ${s.painLevel}/10`, detail: 'Severe pain always deserves professional evaluation in late pregnancy.' }); }

  score = Math.round(Math.min(100, score));
  const level = score >= 55 || emergencyReasons.length > 0 ? 'emergency' : score >= 25 ? 'monitor' : 'normal';

  const guides = {
    normal: [
      { t: 'Attend all prenatal appointments', d: 'Continue your regular check-up schedule — even if feeling well.' },
      { t: 'Count kicks daily', d: 'Aim for 10 kicks in 2 hours. Do this at the same time each day while relaxed.' },
      { t: 'Rest on your left side', d: 'Left side sleeping improves blood flow to baby and reduces swelling.' },
      { t: 'Know your warning signs', d: 'Memorise red-flag symptoms: severe headache, vision changes, heavy bleeding, no fetal movement.' },
      { t: 'Prepare your hospital bag', d: `At week ${week}, you could deliver any day. Have your bag ready.` }
    ],
    monitor: [
      { t: 'Call your provider today', d: 'Contact your midwife or doctor now — explain your symptoms clearly.' },
      { t: 'Measure blood pressure if possible', d: 'If you have a home BP cuff, take readings and note them to share.' },
      { t: 'Lie on your left side & count kicks', d: 'Rest on your left side for 1–2 hours. Count every movement.' },
      { t: 'Avoid strenuous activity', d: 'Rest until you have professional guidance.' },
      { t: 'Have someone ready to take you in', d: 'Do not be alone. Arrange transport to hospital if symptoms worsen.' },
      { t: 'Re-check if symptoms change', d: 'If any symptom becomes sudden or severe, seek emergency care immediately.' }
    ],
    emergency: [
      { t: 'Call 108 / 102 / 112 NOW', d: 'Call emergency services immediately or have someone drive you to hospital. Do not delay.' },
      { t: 'Do not eat or drink anything', d: 'You may need emergency procedures — an empty stomach is important.' },
      { t: 'Lie on your left side while waiting', d: 'This position improves blood flow to baby and stabilises your blood pressure.' },
      { t: 'Tell responders your gestational week', d: 'Say exactly how many weeks pregnant you are and your key symptoms.' },
      { t: 'Bring your antenatal records', d: 'Grab your maternity card or hospital notes if you can reach them quickly.' }
    ]
  };

  showResults(level, score, trail, emergencyReasons, { week, preterm }, guides[level], null);
}

/* ════════════════════════════════════════
   RENDER RESULTS
   ════════════════════════════════════════ */
function showResults(level, score, trail, emergencyReasons, ctx, guidance, aiAdvice) {
  // Hide all steps
  for (let i = 0; i < 6; i++) document.getElementById(`step${i}`).classList.remove('active');
  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('heroSection').style.display = 'none';

  const res = document.getElementById('results');
  res.style.display = 'block';
  res.scrollIntoView({ behavior: 'smooth' });

  /* ── Result Hero Banner ── */
  const hc = {
    normal: {
      cls: 'normal', emoji: '✅', title: 'All Looking Good',
      msg: `Your symptoms appear within the normal range for week ${ctx.week}. Keep attending your prenatal visits and monitoring at home.`
    },
    monitor: {
      cls: 'monitor', emoji: '⚠️', title: 'Please Monitor Closely',
      msg: 'Some of your symptoms need attention today. Contact your doctor or midwife — do not wait for a scheduled appointment.'
    },
    emergency: {
      cls: 'emergency', emoji: '🚨', title: 'Seek Immediate Care',
      msg: 'Your symptoms include serious warning signs. Please go to hospital or call emergency services right now. Do not drive alone.'
    }
  }[level];

  document.getElementById('resultHero').className = `result-hero ${hc.cls}`;
  document.getElementById('resultHero').innerHTML = `
    <span class="result-emoji">${hc.emoji}</span>
    <div class="result-title">${hc.title}</div>
    <p class="result-msg">${hc.msg}</p>
  `;

  /* ── Risk Meter ── */
  const meterColors = {
    normal:    'linear-gradient(90deg, #2d9e6e, #56c48e)',
    monitor:   'linear-gradient(90deg, #d4832a, #f0a850)',
    emergency: 'linear-gradient(90deg, #c0392b, #e05c6e)'
  };
  document.getElementById('meterFill').style.background = meterColors[level];
  document.getElementById('meterPct').textContent = score + '/100';
  setTimeout(() => { document.getElementById('meterFill').style.width = score + '%'; }, 200);

  /* ── Emergency Reasons Box ── */
  document.getElementById('emergencyBox').innerHTML = level === 'emergency'
    ? `<div class="emergency-card">
        <h3>🚨 Critical Symptoms Detected</h3>
        <ul>${emergencyReasons.map(r => `<li>🔴 ${r}</li>`).join('')}</ul>
        <div class="hotline-box">📞 Call Emergency: <strong>108 / 102 / 112</strong> — or go to your nearest maternity hospital now</div>
      </div>`
    : '';

  /* ── Assessment Trail ── */
  document.getElementById('trailContent').innerHTML = trail.map(t =>
    `<div class="trail-item">
      <div class="t-icon ${t.type}">${t.icon}</div>
      <div class="t-body"><strong>${t.title}</strong><span>${t.detail}</span></div>
    </div>`
  ).join('');

  /* ── AI Advice Section ── */
  if (aiAdvice) {
    document.getElementById('aiAdviceContent').textContent = aiAdvice;
    document.getElementById('aiAdviceCard').style.display = 'block';
  } else {
    document.getElementById('aiAdviceCard').style.display = 'none';
  }

  /* ── Personalised Guidance Steps ── */
  const colorMap = { normal: 'green', monitor: 'amber', emergency: 'red' };
  const c = colorMap[level];
  document.getElementById('guidanceContent').innerHTML = guidance.map((g, i) =>
    `<div class="step-item">
      <div class="step-num ${c}">${i + 1}</div>
      <div class="step-text"><strong>${g.t}</strong>${g.d}</div>
    </div>`
  ).join('');
}

/* ════════════════════════════════════════
   RESET / START OVER
   ════════════════════════════════════════ */
function resetAll() {
  kicksCount = 0;
  Object.assign(state, {
    gestWeek: 0, gravida: '', painLevel: 0, headache: 0,
    contractions: 'none', bleeding: 'none', fluid: 'none',
    fetalMovement: 'normal', kickCount: 0, swelling: 'none',
    vision: 'none', upperPain: 'no', breathing: 'none',
    pre: [], other: []
  });

  document.getElementById('results').style.display = 'none';
  document.getElementById('heroSection').style.display = 'block';

  // Reset all symptom cards
  document.querySelectorAll('.sym-card').forEach(c => (c.className = 'sym-card'));

  // Reset pain scales
  document.querySelectorAll('.pain-btn').forEach(b => b.classList.remove('sel'));
  document.querySelector('#painScale .pain-btn').classList.add('sel');
  document.querySelector('#headScale .pain-btn').classList.add('sel');

  // Reset kick counter
  document.getElementById('kickNum').textContent = '0';
  document.getElementById('kickBar').style.width = '0%';
  document.getElementById('kickMsg').textContent = 'Start tapping every time you feel baby move 💝';

  // Reset week selector
  document.querySelectorAll('.week-btn').forEach(b => b.classList.remove('sel'));
  document.getElementById('weekDisplay').textContent = 'Not selected';

  // Reset YN buttons
  document.querySelectorAll('.yn-btn').forEach(b => (b.className = 'yn-btn'));
  document.getElementById('upNo').className = 'yn-btn yes';

  // Hide AI advice
  document.getElementById('aiAdviceCard').style.display = 'none';

  goStep(0);
}
