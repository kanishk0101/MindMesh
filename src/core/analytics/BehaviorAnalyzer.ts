import { Vestige } from '../vestige/Vestige';
import { MemoryAnalyzer } from '../memory/MemoryAnalyzer';
import { ActReport } from '../storage/AnalyticsStore';
import { CHAMBERS } from '../../data/chambers';

export class BehaviorAnalyzer {
  static generateActReport(act: string, vestiges: Vestige[]): ActReport {
    let totalFirstMoveDelay = 0;
    let totalBacktracks = 0;
    let totalTime = 0;
    let totalMoves = 0;
    let optimalMovesSum = 0;
    
    const actChambers = CHAMBERS.filter(c => c.act === act);

    for (const v of vestiges) {
      totalFirstMoveDelay += v.firstMoveDelayMs;
      totalBacktracks += v.backtracks;
      totalTime += v.solveTimeMs;
      totalMoves += v.totalMoves;
      
      const cData = CHAMBERS.find(c => c.id === v.chamberId);
      if (cData) {
        optimalMovesSum += (cData.width * cData.height);
      }
    }
    
    const count = vestiges.length || 1;
    
    // 1. Planning: higher first move delay = higher planning. Let's say 4000ms is 100.
    const avgDelay = totalFirstMoveDelay / count;
    const planning = Math.min(100, Math.floor((avgDelay / 4000) * 100));
    
    // 2. Commitment: fewer backtracks = higher commitment. 0 backtracks = 100. 5+ = 0.
    const avgBacktracks = totalBacktracks / count;
    const commitment = Math.max(0, 100 - Math.floor(avgBacktracks * 20));
    
    // 3. Adaptability: proxy by backtracks + delay.
    const adaptability = Math.min(100, 30 + Math.floor(avgBacktracks * 15) + Math.floor(avgDelay / 1000));
    
    // 4. Speed: lower solve time = higher speed. Say 10s is 100, 60s is 0.
    const avgTime = totalTime / count;
    const speed = Math.max(0, Math.min(100, 100 - Math.floor((avgTime - 10000) / 500)));
    
    // 5. Efficiency: optimal moves / actual moves.
    const efficiencyRatio = optimalMovesSum / (totalMoves || 1);
    const efficiency = Math.min(100, Math.floor(efficiencyRatio * 100));

    // Dominant Scar logic
    let dominantScar = 'Instinctive Flow';
    let maxScarScore = 0;
    const metrics = MemoryAnalyzer.analyze(vestiges, actChambers[0]?.width || 6, actChambers[0]?.height || 6);
    
    if (metrics && count > 0) {
      const scores: Record<string, number> = {
        'High Planning Latency': (avgDelay / 5000) * 100, // Reduced weight
        'Center Corridor Preference': metrics.centerPreference * 150, // High ceiling
        'Edge Routing Preference': metrics.edgePreference * 150, // High ceiling
        'Commitment Instability': (avgBacktracks / 3) * 120, // Very volatile
        'Red Opening Bias': (metrics as any).colorPriority?.length > 0 && (metrics as any).colorPriority[0] === 0 ? 80 : 0
      };
      
      for (const [scar, score] of Object.entries(scores)) {
        if (score > maxScarScore && score > 30) {
          maxScarScore = score;
          dominantScar = scar;
        }
      }
    }
    
    return {
      act,
      planning: planning || 10,
      commitment: commitment || 10,
      adaptability: adaptability || 10,
      speed: speed || 10,
      efficiency: efficiency || 10,
      dominantScar
    };
  }
}
