import { Puzzle } from '../Puzzle';
import { GameScene } from '../../scenes/GameScene';
import { Mutation } from './Mutation';

export class TimePressure implements Mutation {
  id = 'time_pressure';
  name = 'Mutation Detected';
  description = 'An unstable corridor will collapse in 8 seconds.\nConnect fast or adapt around it.';
  
  activate(puzzle: Puzzle, scene: GameScene): void {
    // Pick an empty cell as the optional corridor
    // Let's pick a non-endpoint cell that is furthest from the center
    const cx = puzzle.grid.width / 2;
    const cy = puzzle.grid.height / 2;
    
    let targetCell = null;
    let maxDist = -1;
    
    for (const cell of puzzle.grid.getCells()) {
      if (cell.isEndpoint) continue;
      const d = Math.abs(cell.x - cx) + Math.abs(cell.y - cy);
      if (d > maxDist) {
        maxDist = d;
        targetCell = cell;
      }
    }
    
    if (!targetCell) return;
    
    // Collapse timer 8s
    scene.time.delayedCall(8000, () => {
      if (targetCell.color === null) {
        // Collapse animation 4s
        const graphics = scene.add.graphics();
        puzzle.add(graphics);
        
        let alpha = { value: 0 };
        scene.tweens.add({
          targets: alpha,
          value: 1,
          duration: 4000,
          onUpdate: () => {
             graphics.clear();
             graphics.fillStyle(0xffaa00, alpha.value * 0.5);
             graphics.fillRect(
               targetCell.x * puzzle.cellSize, 
               targetCell.y * puzzle.cellSize, 
               puzzle.cellSize, puzzle.cellSize
             );
          },
          onComplete: () => {
             graphics.destroy();
             if (targetCell.color === null) {
                (targetCell as any).isBlocked = true;
                puzzle.drawMutations();
                puzzle.checkWin();
             }
          }
        });
      }
    });
  }

  deactivate(puzzle: Puzzle, scene: GameScene): void {}
}
