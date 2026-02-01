import React from 'react';
import { AuraQualityScoreData, MarketComparisonData } from '../types';
import { Star, TrendingUp, DollarSign } from 'lucide-react';

const dummyAuraScores: AuraQualityScoreData[] = [
  {
    propertyId: '1',
    propertyName: 'Luxury Villa Beachfront',
    overallScore: 85,
    optimizationTips: [
      'Add 2 more high-resolution kitchen photos',
      'Refine description to highlight beachfront access',
    ],
    rankingImprovement: '+10% visibility on search results',
  },
  {
    propertyId: '2',
    propertyName: 'Downtown Penthouse',
    overallScore: 60,
    optimizationTips: [
      'Improve response time to guest inquiries',
      'Update amenities list with recent additions',
    ],
    rankingImprovement: '+5% visibility on search results',
  },
];

const dummyMarketComparison: MarketComparisonData[] = [
  {
    propertyId: '1',
    propertyName: 'Luxury Villa Beachfront',
    yourPrice: 350,
    averageLocalPrice: 380,
    suggestedPrice: 370,
    currency: 'USD',
  },
  {
    propertyId: '2',
    propertyName: 'Downtown Penthouse',
    yourPrice: 200,
    averageLocalPrice: 220,
    suggestedPrice: 210,
    currency: 'USD',
  },
];

const AuraQualityScore: React.FC = () => {
  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">
        The "Aura" Quality Score & Listing Optimization
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Aura Quality Scores */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Property Aura Scores</h2>
          {dummyAuraScores.length > 0 ? (
            dummyAuraScores.map((aura) => (
              <div key={aura.propertyId} className="mb-4 p-4 border border-white/10 rounded-xl">
                <h3 className="font-semibold text-lg text-white flex items-center">
                  <Star size={20} className="mr-2 text-yellow-500" />
                  {aura.propertyName} - Score: {aura.overallScore}/100
                </h3>
                <p className="text-sm text-zinc-400 mt-2">Optimization Tips:</p>
                <ul className="list-disc list-inside text-xs text-white/50">
                  {aura.optimizationTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
                <p className="text-xs text-sky-400 mt-2">
                  Expected Impact: {aura.rankingImprovement}
                </p>
              </div>
            ))
          ) : (
            <p className="text-white/50">No Aura Quality Scores available.</p>
          )}
        </div>

        {/* Market Comparison */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Market Comparison (Bento Tile)</h2>
          {dummyMarketComparison.length > 0 ? (
            dummyMarketComparison.map((comparison) => (
              <div
                key={comparison.propertyId}
                className="mb-4 p-4 border border-white/10 rounded-xl grid grid-cols-2 gap-2"
              >
                <div className="col-span-2">
                  <h3 className="font-semibold text-lg text-white">{comparison.propertyName}</h3>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Your Price:</p>
                  <p className="text-lg font-bold text-sky-400 flex items-center">
                    ₹{comparison.yourPrice}{' '}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Avg. Local Price:</p>
                  <p className="text-lg font-bold text-white flex items-center">
                    ₹{comparison.averageLocalPrice}{' '}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-zinc-400">Suggested Price:</p>
                  <p className="text-xl font-bold text-green-600 flex items-center">
                    <TrendingUp size={20} className="mr-1" /> ₹{comparison.suggestedPrice}{' '}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white/50">No market comparison data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuraQualityScore;
