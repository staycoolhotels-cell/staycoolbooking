'use server';

import { createServiceClient } from './supabase-server';
import { fetchGeminiJSON } from './gemini';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './data-service';

export interface OptimizationResult {
  overall_score: number;
  optimization_tips: string[];
  ranking_improvement: string;
}

/**
 * Generates AI-powered property optimization suggestions and scores.
 * @param propertyId The UUID of the property to analyze.
 */
export async function generatePropertyOptimization(propertyId: string) {
  const supabase = createServiceClient();

  try {
    // 1. Fetch Property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('title, description, price_per_night, amenities, capacity, bedrooms')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property not found during optimization:', propertyError?.message);
      throw new Error('Property not found');
    }

    // 2. Fetch Recent Reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, comment, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(10);

    const propertyName = property.title || 'this property';
    const reviewsText = reviews && reviews.length > 0 
      ? reviews.map(r => `[Rating: ${r.rating}/5] ${r.comment}`).join('\n')
      : 'No reviews yet.';

    const amenitiesList = Array.isArray(property.amenities) 
      ? property.amenities.map(a => typeof a === 'string' ? a : a.name).join(', ')
      : 'None listed';

    // 3. Construct Prompt
    const prompt = `
      You are an expert hospitality consultant and real estate optimizer. 
      Analyze the following property and guest feedback to provide a "Aura Quality Score" (0-100) and 3 highly actionable optimization tips to improve booking conversion and guest satisfaction.

      PROPERTY DETAILS:
      - Name: ${propertyName}
      - Description: ${property.description || 'No description provided.'}
      - Price: ₹${property.price_per_night} per night
      - Bedrooms: ${property.bedrooms}
      - Amenities: ${amenitiesList}

      GUEST FEEDBACK (SENTIMENT ANALYSIS):
      ${reviewsText}

      INSTRUCTIONS:
      - Provide a "overall_score" reflecting the current state (80-100 is excellent, 60-80 good, <60 needs work).
      - Provide 3 "optimization_tips" that specifically identify a DRAWBACK and a FIX.
      - Format each tip as: "[Drawback] <Description of issue> -> [Fix] <Actionable solution>"
      - Provide a "ranking_improvement" string like "Potential +X% visibility in search." (X should be between 5-25 based on how many improvements are possible).
      
      RESPONSE FORMAT (Strict JSON):
      {
        "overall_score": number,
        "optimization_tips": [string, string, string],
        "ranking_improvement": string
      }
    `;

    // 4. Call Gemini
    let result = await fetchGeminiJSON<OptimizationResult>(prompt);

    // 5. Smart Fallback if Gemini fails (e.g. missing API key or error)
    if (!result) {
      console.warn(`Gemini analysis failed or skipped for ${propertyId}. Using Smart Fallback engine.`);
      result = generateSmartFallback(property, reviews || []);
    }

    // 6. Robust Manual Upsert (Bypasses missing UNIQUE constraint issue)
    const { data: existing } = await supabase
      .from('aura_quality_scores')
      .select('id')
      .eq('property_id', propertyId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('aura_quality_scores')
        .update({
          overall_score: result.overall_score,
          optimization_tips: result.optimization_tips,
          ranking_improvement: result.ranking_improvement
        })
        .eq('id', existing.id);
      
      if (updateError) console.error('Database Update Error:', updateError);
    } else {
      const { error: insertError } = await supabase
        .from('aura_quality_scores')
        .insert({
          property_id: propertyId,
          overall_score: result.overall_score,
          optimization_tips: result.optimization_tips,
          ranking_improvement: result.ranking_improvement
        });
      
      if (insertError) console.error('Database Insert Error:', insertError);
    }

    // 7. Invalidate Cache
    revalidateTag(CACHE_TAGS.properties);

    return { 
      success: true, 
      data: result 
    };

  } catch (error: any) {
    console.error('generatePropertyOptimization error:', error);
    return { 
      success: false, 
      error: 'Failed to generate optimization insights.' 
    };
  }
}

/**
 * A sophisticated rule-based fallback engine to provide high-quality optimizations 
 * when the AI model is unavailable.
 */
function generateSmartFallback(property: any, reviews: any[]): OptimizationResult {
  const tips: string[] = [];
  let score = 75; // Base score

  const price = property.price_per_night || 5000;
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // 1. Rating based logic
  if (avgRating > 4.5) {
    score += 15;
    tips.push("Your guest satisfaction is top-tier. [Advantage] High rating detected -> [Action] Highlight 'Superhost-level' service in your title.");
  } else if (avgRating > 0 && avgRating < 4.0) {
    score -= 10;
    tips.push("[Drawback] Rating is below 4.0 -> [Fix] Address common review complaints regarding cleanliness or communication.");
  }

  // 2. Pricing strategy
  if (price > 12000) {
    tips.push("[Drawback] Premium price point requires high trust -> [Fix] Upload high-resolution photos of luxury amenities in your first 5 images.");
  } else if (price < 3000) {
    tips.push("[Drawback] Budget price point can feel generic -> [Fix] Mention unique proximity to transport or local favorites in description.");
  } else {
    tips.push("Your pricing is market-standard. [Improvement] General appeal -> [Fix] Add a unique 'Local Experience' guide to stand out.");
  }

  // 3. Amenities strategy
  const hasWiFi = amenities.some((a: any) => (typeof a === 'string' ? a : a.name).toLowerCase().includes('wi-fi') || (typeof a === 'string' ? a : a.name).toLowerCase().includes('wifi'));
  if (!hasWiFi) {
    tips.push("[Drawback] No Wi-Fi listed -> [Fix] Install high-speed Wi-Fi to increase search visibility by ~30%.");
  } else {
    tips.push("[Improvement] WiFi present -> [Fix] Ensure your work-friendly desk area is clearly visible in the photo gallery.");
  }

  // 4. Content strategy
  if (!property.description || property.description.length < 100) {
    tips.push("[Drawback] Short description -> [Fix] Expand description to 500+ characters to improve platform SEO.");
  }

  // Ensure we have exactly 3 tips
  const finalTips = tips.slice(0, 3);
  if (finalTips.length < 3) finalTips.push("Enable 'Instant Book' to boost your visibility in guest search results.");
  if (finalTips.length < 3) finalTips.push("Respond to guest inquiries within 1 hour to maintain a high response rate badge.");

  return {
    overall_score: Math.min(Math.max(score, 40), 100),
    optimization_tips: finalTips,
    ranking_improvement: `Potential +${10 + (score % 15)}% visibility in search.`
  };
}

/**
 * Fetch existing aura scores from DB.
 */
export async function getStoredAuraScores(propertyIds: string[]) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('aura_quality_scores')
    .select('*')
    .in('property_id', propertyIds);

  if (error) {
    console.error('getStoredAuraScores error:', error);
    return [];
  }

  return data;
}
