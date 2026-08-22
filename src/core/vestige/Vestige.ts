export interface PathNode {
  x: number;
  y: number;
  color: number;
  step: number;
}

export interface Vestige {
  id: string; // UUID
  chamberId: number;
  act: string;
  timestamp: number;
  solveTimeMs: number;
  firstMoveDelayMs: number;
  totalMoves: number;
  backtracks: number;
  completed: boolean;
  pathOrder: PathNode[];
}
