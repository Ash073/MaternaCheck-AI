/* ============================================================
   MaternaCheck — Supabase-Backed Submissions Store
   Stores anonymized symptom check results for doctor research
   ============================================================ */

const supabase = require('./supabase');

async function addSubmission(symptoms, result) {
  const row = {
    symptoms: {
      gestWeek: symptoms.gestWeek,
      gravida: symptoms.gravida,
      painLevel: symptoms.painLevel,
      headache: symptoms.headache,
      contractions: symptoms.contractions,
      bleeding: symptoms.bleeding,
      fluid: symptoms.fluid,
      fetalMovement: symptoms.fetalMovement,
      kickCount: symptoms.kickCount,
      swelling: symptoms.swelling,
      vision: symptoms.vision,
      upperPain: symptoms.upperPain,
      breathing: symptoms.breathing,
      pre: symptoms.pre || [],
      other: symptoms.other || []
    },
    result: {
      riskLevel: result.riskLevel,
      score: result.score,
      emergencyReasons: result.emergencyReasons
    }
  };

  const { error } = await supabase.from('submissions').insert(row);
  if (error) console.error('Supabase insert error:', error.message);
}

async function getSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error('Supabase select error:', error.message); return []; }

  return (data || []).map(r => ({
    id: r.id,
    timestamp: r.created_at,
    symptoms: r.symptoms,
    result: r.result
  }));
}

async function getStats() {
  const submissions = await getSubmissions();
  const total = submissions.length;

  if (total === 0) {
    return {
      total: 0,
      riskDistribution: { normal: 0, monitor: 0, emergency: 0 },
      avgScore: 0,
      weekDistribution: {},
      commonSymptoms: {},
      preConditions: {},
      otherSymptoms: {},
      recentSubmissions: []
    };
  }

  // Risk level distribution
  const riskDistribution = { normal: 0, monitor: 0, emergency: 0 };
  submissions.forEach(s => { riskDistribution[s.result.riskLevel]++; });

  // Average score
  const avgScore = Math.round(submissions.reduce((sum, s) => sum + s.result.score, 0) / total);

  // Week distribution
  const weekDistribution = {};
  submissions.forEach(s => {
    const w = s.symptoms.gestWeek || 'unknown';
    weekDistribution[w] = (weekDistribution[w] || 0) + 1;
  });

  // Common symptoms frequency
  const commonSymptoms = {
    contractions: {}, bleeding: {}, fluid: {},
    fetalMovement: {}, swelling: {}, vision: {}, breathing: {}
  };
  submissions.forEach(s => {
    for (const key of Object.keys(commonSymptoms)) {
      const val = s.symptoms[key] || 'none';
      commonSymptoms[key][val] = (commonSymptoms[key][val] || 0) + 1;
    }
  });

  // Pre-existing conditions frequency
  const preConditions = {};
  submissions.forEach(s => {
    (s.symptoms.pre || []).forEach(p => {
      preConditions[p] = (preConditions[p] || 0) + 1;
    });
  });

  // Other symptoms frequency
  const otherSymptoms = {};
  submissions.forEach(s => {
    (s.symptoms.other || []).forEach(o => {
      otherSymptoms[o] = (otherSymptoms[o] || 0) + 1;
    });
  });

  // Recent submissions (last 20, newest first)
  const recentSubmissions = submissions.slice(-20).reverse().map(s => ({
    id: s.id,
    timestamp: s.timestamp,
    gestWeek: s.symptoms.gestWeek,
    riskLevel: s.result.riskLevel,
    score: s.result.score,
    emergencyReasons: s.result.emergencyReasons
  }));

  return {
    total,
    riskDistribution,
    avgScore,
    weekDistribution,
    commonSymptoms,
    preConditions,
    otherSymptoms,
    recentSubmissions
  };
}

module.exports = { addSubmission, getSubmissions, getStats };
