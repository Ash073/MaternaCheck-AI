/* ============================================================
   MaternaCheck — Gemini AI Integration
   Real-time AI-driven pregnancy symptom analysis via Gemini
   ============================================================ */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDpy7xubsf1bazKLJ_Y0GiRI9VfY7hMp8o';
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

function apiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function getAIAdvice(riskLevel, score, trail, context, symptoms) {
  if (!GEMINI_API_KEY) {
    return getDefaultAdvice(riskLevel, score, context);
  }

  const prompt = buildPrompt(riskLevel, score, trail, context, symptoms);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 700,
      topP: 0.9
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  });

  /* Try each model in order; if one is rate-limited, try the next */
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(`${apiUrl(model)}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (response.status === 429) {
        console.warn(`Gemini ${model} rate-limited, trying next model…`);
        continue;
      }
      if (!response.ok) {
        const errBody = await response.text();
        console.error(`Gemini ${model} error:`, response.status, errBody);
        continue;
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) return aiText;
    } catch (err) {
      console.error(`Gemini ${model} call failed:`, err.message);
    }
  }

  return getDefaultAdvice(riskLevel, score, context);
}

function buildPrompt(riskLevel, score, trail, context, symptoms) {
  const s = symptoms || {};

  /* ── Structured symptom summary ── */
  const symptomLines = [
    `Gestational week: ${context.week} (${context.preterm ? 'PRETERM — before 37 weeks' : 'term pregnancy'})`,
    s.gravida          ? `Gravida (pregnancies): ${s.gravida}` : null,
    s.painLevel != null ? `Overall pain level: ${s.painLevel}/10` : null,
    s.headache != null  ? `Headache severity: ${s.headache}/10` : null,
    s.contractions      ? `Contractions: ${s.contractions}` : null,
    s.bleeding          ? `Vaginal bleeding: ${s.bleeding}` : null,
    s.fluid             ? `Fluid loss: ${s.fluid}` : null,
    s.fetalMovement     ? `Fetal movement: ${s.fetalMovement}` : null,
    s.kickCount != null ? `Kick count: ${s.kickCount}` : null,
    s.swelling          ? `Swelling: ${s.swelling}` : null,
    s.vision            ? `Vision changes: ${s.vision}` : null,
    s.upperPain         ? `Upper abdominal pain: ${s.upperPain}` : null,
    s.breathing         ? `Breathing difficulty: ${s.breathing}` : null,
    (s.pre && s.pre.length)   ? `Pre-existing conditions: ${s.pre.join(', ')}` : null,
    (s.other && s.other.length) ? `Other symptoms: ${s.other.join(', ')}` : null
  ].filter(Boolean).join('\n');

  /* ── Clinical findings from rule engine ── */
  const findings = trail
    .filter(t => t.type !== 'ok')
    .map(t => `- [${t.type.toUpperCase()}] ${t.title}: ${t.detail}`)
    .join('\n');

  const reassuring = trail
    .filter(t => t.type === 'ok')
    .map(t => `- ✅ ${t.title}`)
    .join('\n');

  return `You are a compassionate, evidence-based pregnancy wellness AI assistant.

PATIENT SYMPTOM PROFILE:
${symptomLines}

RISK ASSESSMENT (rule-based engine):
- Risk level: ${riskLevel.toUpperCase()}
- Risk score: ${score}/100
- Emergency flags: ${trail.filter(t => t.type === 'crit').length > 0 ? trail.filter(t => t.type === 'crit').map(t => t.title).join('; ') : 'None'}

CLINICAL CONCERNS DETECTED:
${findings || 'No concerning symptoms detected.'}

REASSURING FINDINGS:
${reassuring || 'None recorded.'}

YOUR TASK:
Based on ALL the above factors, provide a personalized, warm response in 4-6 sentences:
1. Acknowledge what looks reassuring first.
2. Address each concern specifically — explain WHY it matters at this gestational week.
3. Give 2-3 concrete, practical next steps she can take right now.
4. If risk is "emergency", strongly urge immediate hospital visit in a caring tone.
5. If risk is "monitor", recommend contacting her provider today with specific talking points.
6. End with an encouraging, empowering sentence.

RULES:
- Do NOT diagnose any condition.
- Do NOT mention medical scores or internal system details.
- Always remind her this is supportive guidance, not a medical diagnosis.
- Use simple, warm language — avoid clinical jargon.
- Be culturally sensitive and gentle.`;
}

function getDefaultAdvice(riskLevel, score, context) {
  const adviceMap = {
    normal: `Your symptoms at week ${context.week} look reassuring. Continue your regular prenatal visits and daily kick counts. Stay hydrated, rest well, and trust your instincts — you're doing a wonderful job caring for yourself and your baby. If anything changes, don't hesitate to contact your healthcare provider.`,
    monitor: `Some of your symptoms at week ${context.week} deserve attention today. Please contact your midwife or doctor to discuss what you're experiencing — don't wait for your next scheduled appointment. In the meantime, rest on your left side, stay hydrated, and have someone nearby who can take you to hospital if needed. You're being proactive by checking, and that's exactly the right thing to do.`,
    emergency: `Your symptoms at week ${context.week} include serious warning signs that need immediate medical attention. Please call emergency services (108/102/112) or go to your nearest maternity hospital right now. Do not drive yourself — have someone take you. While waiting, lie on your left side and avoid eating or drinking. Your safety and your baby's safety are the top priority.`
  };

  return adviceMap[riskLevel] || adviceMap.normal;
}

module.exports = { getAIAdvice };
