/* ============================================================
   MaternaCheck — Risk Calculation Logic
   Extracted from the original app.js analysis engine
   ============================================================ */

function analyzeSymptoms(symptoms) {
  const s = symptoms;
  const week = s.gestWeek || 36;
  const preterm = week < 37;
  let score = 0;
  let trail = [];
  let emergencyReasons = [];

  /* ── Gestational Age Context ── */
  trail.push({
    type: 'ok', icon: '🗓',
    title: `Week ${week} pregnancy`,
    detail: preterm
      ? `You are at ${week} weeks — before full term (37 wks). Any labor symptoms need urgent evaluation.`
      : `You are at term (${week} weeks). Your baby is ready. Signs of labor are expected soon.`
  });

  /* ── Contractions ── */
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

  /* ── Bleeding ── */
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

  /* ── Fluid / Membrane Rupture ── */
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

  /* ── Fetal Movement ── */
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

  /* ── Preeclampsia Cluster ── */
  let peFlags = 0;
  if (s.headache >= 7)                                     peFlags++;
  if (s.vision === 'flashing' || s.vision === 'blurred')   peFlags++;
  if (s.swelling === 'severe' || s.swelling === 'moderate') peFlags++;
  if (s.upperPain === 'yes')                               peFlags++;
  if (s.pre && s.pre.includes('hypertension'))             peFlags += 0.5;

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

  /* ── Breathing ── */
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

  /* ── Other Symptoms ── */
  const other = s.other || [];
  if (other.includes('fever')) {
    score += 16;
    trail.push({ type: 'warn', icon: '🌡', title: 'Fever / Chills', detail: 'Fever in pregnancy can indicate chorioamnionitis. Contact your doctor today.' });
  }
  if (other.includes('dizziness')) {
    score += 11;
    trail.push({ type: 'warn', icon: '😵', title: 'Dizziness / Fainting', detail: 'May indicate low BP or anaemia. Sit or lie down, hydrate, and call your provider.' });
  }
  if (other.includes('pelvicPressure') && preterm) {
    score += 16;
    trail.push({ type: 'warn', icon: '⬇️', title: 'Pelvic pressure (preterm)', detail: 'Before 37 weeks, pelvic pressure may signal early cervical dilation. Evaluation recommended.' });
  }
  if (other.includes('nausea')) {
    score += 8;
    trail.push({ type: 'warn', icon: '🤢', title: 'New nausea / vomiting', detail: 'New-onset nausea in late pregnancy can be linked to preeclampsia or infection.' });
  }
  if (other.includes('backPain')) {
    score += 10;
    trail.push({ type: 'warn', icon: '🔙', title: 'Severe back pain', detail: 'Intense back pain in late pregnancy may accompany labor or abruption. Monitor closely.' });
  }

  /* ── Risk Factor Multipliers ── */
  const pre = s.pre || [];
  if (pre.includes('hypertension')) {
    score = Math.min(100, score * 1.2);
    trail.push({ type: 'warn', icon: '🫀', title: 'Risk factor: Hypertension', detail: 'Pre-existing high blood pressure means ALL BP symptoms carry extra clinical weight.' });
  }
  if (pre.includes('twins')) {
    score = Math.min(100, score * 1.1);
    trail.push({ type: 'warn', icon: '👶👶', title: 'Risk factor: Multiple pregnancy', detail: 'Twin/multiple pregnancies have higher baseline risk for preterm labor.' });
  }
  if (s.painLevel >= 8) {
    score += 14;
    trail.push({ type: 'warn', icon: '💊', title: `High pain level: ${s.painLevel}/10`, detail: 'Severe pain always deserves professional evaluation in late pregnancy.' });
  }

  score = Math.round(Math.min(100, score));
  const riskLevel = score >= 55 || emergencyReasons.length > 0 ? 'emergency' : score >= 25 ? 'monitor' : 'normal';

  /* ── Personalised Guidance Steps ── */
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

  return {
    riskLevel,
    score,
    trail,
    emergencyReasons,
    guidance: guides[riskLevel],
    context: { week, preterm }
  };
}

module.exports = { analyzeSymptoms };
