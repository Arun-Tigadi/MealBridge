export interface ExpiryPredictionInput {
  foodName: string;
  category: string;
  preparationTime: string;
  storageCondition: string;
  isVegetarian: boolean;
  ingredients?: string[];
}

export interface ExpiryPredictionResult {
  estimatedShelfLifeHours: number;
  recommendedExpiryTime: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidencePercentage: number;
  modelVersion: string;
  predictionTimestamp: string;
  criticalFactors: string[];
  handlingRecommendations: string[];
  disclaimer: string;
}

export function predictShelfLife(input: ExpiryPredictionInput): ExpiryPredictionResult {
  const prepDate = new Date(input.preparationTime);
  const baseTimestamp = isNaN(prepDate.getTime()) ? new Date() : prepDate;

  let baseHours = 4; // default base for cooked meals
  const criticalFactors: string[] = [];
  const handlingRecommendations: string[] = [];

  const catLower = (input.category || '').toLowerCase();
  const storageLower = (input.storageCondition || '').toLowerCase();

  // 1. Category baseline
  if (catLower.includes('prepared') || catLower.includes('cooked')) {
    baseHours = 5;
    criticalFactors.push('Cooked perishable items carry rapid bacterial growth risks in thermal danger zone (5°C - 60°C).');
    handlingRecommendations.push('Keep heated above 60°C or rapid-chill below 4°C.');
  } else if (catLower.includes('produce') || catLower.includes('fresh')) {
    baseHours = 48;
    criticalFactors.push('Raw produce shelf-life depends heavily on humidity, airflow, and ethylene gas management.');
    handlingRecommendations.push('Store in well-ventilated crates away from direct sunlight.');
  } else if (catLower.includes('packaged') || catLower.includes('sealed')) {
    baseHours = 72;
    criticalFactors.push('Hermetically sealed dry or pasteurized goods provide enhanced microbial stability.');
    handlingRecommendations.push('Maintain unopened manufacturer packaging until distribution.');
  } else if (catLower.includes('specialty') || catLower.includes('dairy')) {
    baseHours = 6;
    criticalFactors.push('Dairy-based confections or dietary mixes are sensitive to temperature abuse.');
    handlingRecommendations.push('Continuous cold chain refrigeration required.');
  } else {
    baseHours = 8;
  }

  // 2. Storage adjustments
  if (storageLower.includes('refrigerat') || storageLower.includes('chilled') || storageLower.includes('cold')) {
    baseHours *= 1.8;
    handlingRecommendations.push('Maintain consistent refrigeration under 4°C.');
  } else if (storageLower.includes('warm') || storageLower.includes('hot') || storageLower.includes('heater')) {
    baseHours = Math.min(baseHours, 4);
    handlingRecommendations.push('Keep insulated heaters active until immediate distribution.');
  } else if (storageLower.includes('room') || storageLower.includes('ambient')) {
    baseHours = Math.min(baseHours, 4.5);
    criticalFactors.push('Ambient tropical Belagavi temperature accelerates microbial doubling time.');
  }

  // 3. Non-veg adjustments
  if (!input.isVegetarian) {
    baseHours = Math.max(3, baseHours * 0.75);
    criticalFactors.push('Non-vegetarian proteins have higher pathogen proliferation rates.');
  }

  // Round estimated hours
  const finalHours = Math.round(baseHours * 10) / 10;
  const expiryDate = new Date(baseTimestamp.getTime() + finalHours * 60 * 60 * 1000);

  // Risk classification
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (finalHours <= 4) {
    riskLevel = 'HIGH';
  } else if (finalHours <= 12) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    estimatedShelfLifeHours: finalHours,
    recommendedExpiryTime: expiryDate.toISOString(),
    riskLevel,
    confidencePercentage: 88,
    modelVersion: 'MealBridge-RuleML-v1.2-BelagaviPrototype',
    predictionTimestamp: new Date().toISOString(),
    criticalFactors,
    handlingRecommendations,
    disclaimer: 'Prototype shelf-life/risk estimate. This is not a food safety decision. Volunteers and NGOs must perform visual, olfactory, and temperature inspection prior to consumption.',
  };
}
