/* ============================================================
   MaternaCheck — API Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { analyzeSymptoms } = require('../logic/riskLogic');
const { getAIAdvice } = require('../ai/gemini');
const { addSubmission } = require('../logic/store');

/**
 * POST /api/check
 * 
 * Input:  { symptoms: { gestWeek, gravida, painLevel, headache, contractions, 
 *           bleeding, fluid, fetalMovement, kickCount, swelling, vision, 
 *           upperPain, breathing, pre, other } }
 * 
 * Output: { riskLevel, score, trail, emergencyReasons, guidance, context, aiAdvice }
 */
router.post('/check', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid "symptoms" object in request body.' });
    }

    // Run the rule-based risk analysis
    const result = analyzeSymptoms(symptoms);

    // Get AI-generated advice powered by Gemini
    const aiAdvice = await getAIAdvice(
      result.riskLevel,
      result.score,
      result.trail,
      result.context,
      symptoms
    );

    const response = {
      riskLevel: result.riskLevel,
      score: result.score,
      trail: result.trail,
      emergencyReasons: result.emergencyReasons,
      guidance: result.guidance,
      context: result.context,
      aiAdvice
    };

    // Store anonymized submission for doctor research dashboard
    await addSubmission(symptoms, result);

    res.json(response);
  } catch (err) {
    console.error('Error in /api/check:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

module.exports = router;
