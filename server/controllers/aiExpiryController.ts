import { Request, Response } from 'express';
import { predictShelfLife } from '../services/expiryPredictionService.ts';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('[AIExpiry] Gemini initialization skipped:', err);
    }
  }
  return geminiClient;
}

export async function estimateShelfLife(req: Request, res: Response): Promise<void> {
  try {
    const { foodName, category, preparationTime, storageCondition, isVegetarian, ingredients } = req.body;

    if (!foodName || !category) {
      res.status(400).json({ success: false, error: 'Food name and category are required.' });
      return;
    }

    // 1. Run standard rule-based prototype engine
    const basePrediction = predictShelfLife({
      foodName,
      category,
      preparationTime: preparationTime || new Date().toISOString(),
      storageCondition: storageCondition || 'Room temperature ambient (Belagavi)',
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
    });

    let aiEnrichedInsights = null;

    // 2. Optionally enrich with Gemini if available
    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an advisory food science expert for MealBridge in Belagavi, Karnataka, India. 
Evaluate this surplus food item:
Food: ${foodName}
Category: ${category}
Preparation Time: ${preparationTime}
Storage: ${storageCondition}
Vegetarian: ${isVegetarian}
Provide 2 short bullet points on safe temperature handling and 1 specific regional Belagavi climate caution (e.g. ambient monsoon humidity or summer heat). Keep it under 60 words. Never claim to guarantee food safety.`,
        });
        if (response && response.text) {
          aiEnrichedInsights = response.text;
        }
      } catch (err) {
        // Graceful fallback to rule-based prototype
        console.warn('[AIExpiry] Optional Gemini enrichment skipped:', err);
      }
    }

    res.json({
      success: true,
      prediction: basePrediction,
      aiEnrichedInsights,
      disclaimer: 'Prototype shelf-life/risk estimate. This is not a food safety decision. Always inspect organoleptic qualities (smell, visual, texture) prior to consumption.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error generating shelf-life estimate.' });
  }
}
