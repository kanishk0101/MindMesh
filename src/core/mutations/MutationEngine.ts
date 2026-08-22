import { Puzzle } from '../Puzzle';
import { GameScene } from '../../scenes/GameScene';
import { Mutation } from './Mutation';
import { CommitmentLock } from './CommitmentLock';
import { TimePressure } from './TimePressure';
import { FalseInstinct } from './FalseInstinct';
import { MemoryFragment } from './MemoryFragment';
import { ChamberData } from '../../data/chambers';
import { progressStore } from '../storage/ProgressStore';

import { AIDirector } from '../ai/AIDirector';
import { vestigeStore } from '../storage/VestigeStore';

export class MutationEngine {
  static async applyMutation(puzzle: Puzzle, scene: GameScene, chamber: ChamberData) {
    // Memory Fragments are fixed narrative events and take precedence
    const memoryFragments = [6, 19, 28];
    
    // Fixed early acts (Chambers 1-9)
    const fixedCommitmentLocks = [8];
    
    let mutation: Mutation | null = null;
    let mutationId = 'none';
    
    if (memoryFragments.includes(chamber.id)) {
      mutationId = 'memory_fragment';
    } else if (chamber.id < 10) {
      if (fixedCommitmentLocks.includes(chamber.id)) {
        mutationId = 'commitment_lock';
      }
    } else {
      // Stage 8: AI Director takes over from Chamber 10+
      const allVestiges = await vestigeStore.getAllVestiges();
      mutationId = AIDirector.evaluate(chamber, allVestiges);
    }
    
    if (mutationId === 'memory_fragment') mutation = new MemoryFragment();
    else if (mutationId === 'commitment_lock') mutation = new CommitmentLock();
    else if (mutationId === 'time_pressure') mutation = new TimePressure();
    else if (mutationId === 'false_instinct') mutation = new FalseInstinct();
    
    if (mutation) {
      const progress = await progressStore.getProgress();
      const tutorials = progress?.viewedTutorials || [];
      
      if (!tutorials.includes(mutation.id)) {
        await scene.showTutorialModal(mutation.name, mutation.description);
        tutorials.push(mutation.id);
        if (progress) {
          progress.viewedTutorials = tutorials;
          await progressStore.saveProgress(progress);
        }
      }
      
      // Part 4: AI Adaptation Banner (only for AI selected mutations)
      if (chamber.id >= 10 && mutationId !== 'memory_fragment') {
        scene.showAIBanner(mutation.name);
      }
      scene.aiSelectedMutation = mutationId;
      
      await mutation.activate(puzzle, scene);
    }
  }
}
