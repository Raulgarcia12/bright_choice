import type { Product } from './store';
import type { Language } from './i18n';
import { t } from './i18n';

interface ScoreBreakdown {
  total: number;
  efficiency: number;
  lifespan: number;
  warranty: number;
  availability: number;
  explanations: string[];
}

export function calculateConvenienceScore(
  product: Product,
  allProducts: Product[],
  lang: Language
): ScoreBreakdown {
  const sameCategory = allProducts.filter((p) => p.category === product.category);
  if (sameCategory.length === 0) {
    return { total: 50, efficiency: 20, lifespan: 15, warranty: 10, availability: 5, explanations: [] };
  }

  // Efficiency score (40%) - higher is better
  const effs = sameCategory.map((p) => p.efficiency);
  const minEff = Math.min(...effs);
  const maxEff = Math.max(...effs);
  const effRange = maxEff - minEff || 1;
  const effNorm = (product.efficiency - minEff) / effRange;
  const efficiencyScore = Math.round(effNorm * 40);

  // Lifespan score (30%) - higher is better
  const lifespans = sameCategory.map((p) => p.lifespan);
  const minLife = Math.min(...lifespans);
  const maxLife = Math.max(...lifespans);
  const lifeRange = maxLife - minLife || 1;
  const lifeNorm = (product.lifespan - minLife) / lifeRange;
  const lifespanScore = Math.round(lifeNorm * 30);

  // Warranty score (20%) - higher is better
  const warranties = sameCategory.map((p) => p.warranty);
  const minW = Math.min(...warranties);
  const maxW = Math.max(...warranties);
  const wRange = maxW - minW || 1;
  const wNorm = (product.warranty - minW) / wRange;
  const warrantyScore = Math.round(wNorm * 20);

  // Availability score (10%) - has certifications
  const certCount = [product.cert_ul, product.cert_dlc, product.cert_energy_star].filter(Boolean).length;
  const availabilityScore = Math.round((certCount / 3) * 10);

  const total = efficiencyScore + lifespanScore + warrantyScore + availabilityScore;

  const explanations: string[] = [];
  if (efficiencyScore >= 25) explanations.push(`${t('efficiencyScore', lang)} (+${efficiencyScore})`);
  if (lifespanScore >= 12) explanations.push(`${t('lifespanScore', lang)} (+${lifespanScore})`);
  if (warrantyScore >= 10) explanations.push(`${t('warrantyScore', lang)} (+${warrantyScore})`);
  if (availabilityScore >= 7) explanations.push(`${t('availabilityScore', lang)} (+${availabilityScore})`);

  return {
    total,
    efficiency: efficiencyScore,
    lifespan: lifespanScore,
    warranty: warrantyScore,
    availability: availabilityScore,
    explanations,
  };
}
