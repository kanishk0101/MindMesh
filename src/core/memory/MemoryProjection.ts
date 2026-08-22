import { ChamberData } from '../../data/chambers';
import { MemoryMetrics } from './MemoryAnalyzer';

export class MemoryProjection {
  static generate(chamber: ChamberData, metrics: MemoryMetrics): Map<number, {x:number, y:number}[]> {
    const projections = new Map<number, {x:number, y:number}[]>();
    const { width, height, pairs } = chamber;
    
    const grid = Array.from({length: height}, () => Array(width).fill(false));
    
    // Length: 15-20% of a plausible route. Max width+height.
    const targetLen = Math.max(2, Math.floor((width + height) * 0.18));
    
    for (const pair of pairs) {
      const startX = pair.start.x;
      const startY = pair.start.y;
      grid[startY][startX] = true;
      
      const path = [{x: startX, y: startY}];
      let currX = startX;
      let currY = startY;
      let lastDx = 0;
      let lastDy = 0;
      
      while (path.length < targetLen) {
        const neighbors = [];
        if (currX > 0 && !grid[currY][currX-1]) neighbors.push({x: currX-1, y: currY, dx: -1, dy: 0});
        if (currX < width-1 && !grid[currY][currX+1]) neighbors.push({x: currX+1, y: currY, dx: 1, dy: 0});
        if (currY > 0 && !grid[currY-1][currX]) neighbors.push({x: currX, y: currY-1, dx: 0, dy: -1});
        if (currY < height-1 && !grid[currY+1][currX]) neighbors.push({x: currX, y: currY+1, dx: 0, dy: 1});
        
        // Prevent it from ever touching another endpoint!
        const validNeighbors = neighbors.filter(n => {
          return !pairs.some(p => 
            (p.start.x === n.x && p.start.y === n.y) || 
            (p.end.x === n.x && p.end.y === n.y)
          );
        });
        
        if (validNeighbors.length === 0) break;
        
        let next = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        
        if (lastDx !== 0 || lastDy !== 0) {
          const straights = validNeighbors.filter(n => n.dx === lastDx && n.dy === lastDy);
          const turns = validNeighbors.filter(n => n.dx !== lastDx || n.dy !== lastDy);
          
          if (Math.random() < metrics.longCorridorPreference && straights.length > 0) {
            next = straights[0];
          } else if (turns.length > 0) {
            next = turns[Math.floor(Math.random() * turns.length)];
          }
        }
        
        path.push({x: next.x, y: next.y});
        grid[next.y][next.x] = true;
        currX = next.x;
        currY = next.y;
        lastDx = next.dx;
        lastDy = next.dy;
      }
      
      projections.set(pair.color, path);
    }
    
    return projections;
  }
}
