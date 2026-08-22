import { Vestige } from '../vestige/Vestige';

export interface MemoryMetrics {
  edgePreference: number;
  centerPreference: number;
  longCorridorPreference: number;
}

export class MemoryAnalyzer {
  static analyze(vestiges: Vestige[], width: number, height: number): MemoryMetrics | null {
    if (vestiges.length === 0) return null;

    let edgeCount = 0;
    let centerCount = 0;
    let totalNodes = 0;
    let straightLines = 0;
    let turns = 0;

    for (const v of vestiges) {
      for (let i = 0; i < v.pathOrder.length; i++) {
        const node = v.pathOrder[i];
        totalNodes++;

        const isEdgeX = node.x === 0 || node.x === width - 1;
        const isEdgeY = node.y === 0 || node.y === height - 1;
        
        if (isEdgeX || isEdgeY) edgeCount++;
        else centerCount++;

        if (i > 1) {
          const prev1 = v.pathOrder[i-1];
          const prev2 = v.pathOrder[i-2];
          
          if (prev1.color === node.color && prev2.color === node.color) {
            const dx1 = prev1.x - prev2.x;
            const dy1 = prev1.y - prev2.y;
            const dx2 = node.x - prev1.x;
            const dy2 = node.y - prev1.y;
            
            if (dx1 === dx2 && dy1 === dy2) straightLines++;
            else turns++;
          }
        }
      }
    }

    if (totalNodes === 0) return null;

    return {
      edgePreference: edgeCount / totalNodes,
      centerPreference: centerCount / totalNodes,
      longCorridorPreference: (straightLines + turns > 0) ? (straightLines / (straightLines + turns)) : 0.5
    };
  }
}
