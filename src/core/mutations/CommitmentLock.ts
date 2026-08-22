import { Puzzle } from '../Puzzle';
import { GameScene } from '../../scenes/GameScene';
import { Mutation } from './Mutation';

export class CommitmentLock implements Mutation {
  id = 'commitment_lock';
  name = 'Mutation Detected';
  description = 'Your first 6 placed cells become permanent.\nPlan your opening carefully.';
  
  private count = 0;

  activate(puzzle: Puzzle, scene: GameScene): void {
    this.count = 0;
    
    puzzle.onMoveHook = (lastCell, targetCell, color, isBacktrack) => {
      if (this.count < 6 && !isBacktrack && !targetCell.isEndpoint) {
        (targetCell as any).isLocked = true;
        this.count++;
        puzzle.drawMutations(); // Update visuals
      }
    };
  }

  deactivate(puzzle: Puzzle, scene: GameScene): void {
    puzzle.onMoveHook = null;
  }
}
