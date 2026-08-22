import { Puzzle } from '../Puzzle';
import { GameScene } from '../../scenes/GameScene';
import { Mutation } from './Mutation';
import { MemoryProjection } from '../memory/MemoryProjection';
import { vestigeStore } from '../storage/VestigeStore';
import { MemoryAnalyzer } from '../memory/MemoryAnalyzer';

export class MemoryFragment implements Mutation {
  id = 'memory_fragment';
  name = 'Memory Fragment Detected';
  description = 'A piece of your past behavior has surfaced.';
  
  async activate(puzzle: Puzzle, scene: GameScene): Promise<void> {
    try {
      const allVestiges = await vestigeStore.getAllVestiges();
      let metrics = MemoryAnalyzer.analyze(allVestiges, puzzle.chamberData.width, puzzle.chamberData.height);
      
      if (!metrics) {
         metrics = {
           centerPreference: 0.5, edgePreference: 0.5,
           straightPreference: 0.5, zigzagPreference: 0.5,
           fastExecution: 0.5, hesitantExecution: 0.5,
           highPlanning: 0.5, lowPlanning: 0.5,
           efficientRouting: 0.5, highBacktracking: 0.5,
           colorPriority: Array.from({length: puzzle.chamberData.pairs.length}, (_, i) => i)
         };
      }
      
      const projections = MemoryProjection.generate(puzzle.chamberData, metrics);
      await puzzle.playMemoryFragment(projections);
    } catch (e) {
       console.error(e);
    }
  }

  deactivate(puzzle: Puzzle, scene: GameScene): void {}
}
