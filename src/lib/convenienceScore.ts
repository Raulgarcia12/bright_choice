import type { Product } from './store';
import type { Language } from './i18n';
import { t } from './i18n';

interface ScoreBreakdown {
  total: number;
  efficiency: number;
  lifespan: number;
  warranty: number;
  availability: number;
  price: number;
  explanations: string[];
}

interface RetailerPriceInfo {
  /** Best (lowest) retailer price for this product in the selected state */
  bestPrice?: number;
  /** Name of the retailer offering the best price */
  retailerName?: string;
}

/**
 * Calculate a weighted Convenience Score for a product.
 *
 * Weights:
 *   Efficiency    30%   Higher lm/W is better
 *   Lifespan      25%   Longer life is better
 *   Price         20%   Lower price vs category avg is better
 *   Warranty      15%   Longer warranty is better
 *   Certifications 10%  More certs = better availability
 *
 * When `retailerPrice` is provided, it overrides the product's list price
 * for the price dimension, enabling vendor-level comparison.
 */
export function calculateConvenienceScore(
  product: Product,
  allProducts: Product[],
  lang: Language,
  retailerPrice?: RetailerPriceInfo,
): ScoreBreakdown {
  const sameCategory = allProducts.filter((p) => p.category === product.category);
  if (sameCategory.length === 0) {
    return { total: 50, efficiency: 15, lifespan: 12, warranty: 8, availability: 5, price: 10, explanations: [] };
  }

  // ── Efficiency score (30%) — higher is better ──
  const effs = sameCategory.map((p) => p.efficiency);
  const minEff = Math.min(...effs);
  const maxEff = Math.max(...effs);
  const effRange = maxEff - minEff || 1;
  const effNorm = (product.efficiency - minEff) / effRange;
  const efficiencyScore = Math.round(effNorm * 30);

  // ── Lifespan score (25%) — higher is better ──
  const lifespans = sameCategory.map((p) => p.lifespan);
  const minLife = Math.min(...lifespans);
  const maxLife = Math.max(...lifespans);
  const lifeRange = maxLife - minLife || 1;
  const lifeNorm = (product.lifespan - minLife) / lifeRange;
  const lifespanScore = Math.round(lifeNorm * 25);

  // ── Price score (20%) — lower is better ──
  const effectivePrice = retailerPrice?.bestPrice ?? product.price;
  const prices = sameCategory.map((p) => p.price).filter((p) => p > 0);
  let priceScoreVal = 10; // neutral default
  if (prices.length > 0 && effectivePrice > 0) {
    const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;
    // Invert: lower price = higher score
    const priceNorm = 1 - Math.max(0, Math.min(1, (effectivePrice - minPrice) / priceRange));
    priceScoreVal = Math.round(priceNorm * 20);
  }

  // ── Warranty score (15%) — higher is better ──
  const warranties = sameCategory.map((p) => p.warranty);
  const minW = Math.min(...warranties);
  const maxW = Math.max(...warranties);
  const wRange = maxW - minW || 1;
  const wNorm = (product.warranty - minW) / wRange;
  const warrantyScore = Math.round(wNorm * 15);

  // ── Certifications score (10%) — more certs is better ──
  const certCount = [product.cert_ul, product.cert_dlc, product.cert_energy_star].filter(Boolean).length;
  const availabilityScore = Math.round((certCount / 3) * 10);

  const total = efficiencyScore + lifespanScore + priceScoreVal + warrantyScore + availabilityScore;

  const explanations: string[] = [];
  if (efficiencyScore >= 20) explanations.push(`${t('efficiencyScore', lang)} (+${efficiencyScore})`);
  if (lifespanScore >= 10) explanations.push(`${t('lifespanScore', lang)} (+${lifespanScore})`);
  if (priceScoreVal >= 14) {
    const label = retailerPrice?.retailerName
      ? `${t('miPriceScore', lang)} (${retailerPrice.retailerName})`
      : t('priceScore', lang);
    explanations.push(`${label} (+${priceScoreVal})`);
  }
  if (warrantyScore >= 8) explanations.push(`${t('warrantyScore', lang)} (+${warrantyScore})`);
  if (availabilityScore >= 7) explanations.push(`${t('availabilityScore', lang)} (+${availabilityScore})`);

  return {
    total,
    efficiency: efficiencyScore,
    lifespan: lifespanScore,
    warranty: warrantyScore,
    availability: availabilityScore,
    price: priceScoreVal,
    explanations,
  };
}

