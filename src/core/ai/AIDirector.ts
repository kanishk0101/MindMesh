import { Vestige } from '../vestige/Vestige';
import { ChamberData } from '../../data/chambers';
import { BehaviorAnalyzer } from '../analytics/BehaviorAnalyzer';
import { MemoryAnalyzer } from '../memory/MemoryAnalyzer';

export type MutationType = 'commitment_lock' | 'time_pressure' | 'false_instinct' | 'none';

export class AIDirector {
  /**
   * Evaluates the player's behavioral profile and selects exactly ONE mutation.
   * Deterministic. No randomness.
   */
  static evaluate(chamber: ChamberData, vestiges: Vestige[]): MutationType {
    // Stage 8 requirement: AI starts Chamber 10 onward
    if (chamber.id < 10) {
      return 'none';
    }

    // Generate a fresh, up-to-date behavioral profile on every load.
    const profile = BehaviorAnalyzer.generateActReport('dynamic_ai', vestiges);
    const metrics = MemoryAnalyzer.analyze(vestiges, chamber.width, chamber.height);

    // Default to a balanced metric if no vestiges exist (fallback for testing)
    const centerPref = metrics ? metrics.centerPreference : 0.5;

    // Computed weights
    // Commitment Lock: Favors low commitment, excessive backtracking, low efficiency.
    const commitmentLockScore = 
      ((100 - profile.commitment) * 1.5) + 
      ((100 - profile.efficiency) * 1.2);

    // Time Pressure: Favors very high planning, slow solving, cautious players.
    const timePressureScore = 
      (profile.planning * 1.4) + 
      ((100 - profile.speed) * 1.3);

    // False Instinct: Favors center corridor preference, strong dominant scars.
    let falseInstinctScore = 
      (centerPref * 100 * 1.5) + 
      ((100 - profile.adaptability) * 1.0);
      
    if (profile.dominantScar !== 'Balanced Routing' && profile.dominantScar !== 'Instinctive Flow') {
      falseInstinctScore += 40;
    }

    let chosen: MutationType = 'none';
    let maxScore = -1;

    // Score comparison (no randomness, deterministic tie breaking)
    if (commitmentLockScore > maxScore) {
      maxScore = commitmentLockScore;
      chosen = 'commitment_lock';
    }
    
    if (timePressureScore > maxScore) {
      maxScore = timePressureScore;
      chosen = 'time_pressure';
    }
    
    if (falseInstinctScore > maxScore) {
      maxScore = falseInstinctScore;
      chosen = 'false_instinct';
    }

    return chosen;
  }
}
