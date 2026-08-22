import { Puzzle } from '../Puzzle';
import { GameScene } from '../../scenes/GameScene';

export interface Mutation {
  id: string;
  name: string;
  description: string;
  activate(puzzle: Puzzle, scene: GameScene): Promise<void> | void;
  deactivate(puzzle: Puzzle, scene: GameScene): void;
}
