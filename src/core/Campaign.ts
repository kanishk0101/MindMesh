import { ChamberData, CHAMBERS } from '../data/chambers';

export class Campaign {
  currentChamberId: number = 1;

  constructor(startId: number = 1) {
    this.currentChamberId = startId;
  }

  getCurrentChamber(): ChamberData {
    return this.getChamberById(this.currentChamberId);
  }

  getChamberById(id: number): ChamberData {
    const chamber = CHAMBERS.find(c => c.id === id);
    if (!chamber) {
      throw new Error(`Chamber ${id} not found.`);
    }
    
    this.validateChamber(chamber);
    return chamber;
  }

  nextChamber(): boolean {
    const nextId = this.currentChamberId + 1;
    const exists = CHAMBERS.some(c => c.id === nextId);
    if (exists) {
      this.currentChamberId = nextId;
      return true;
    }
    return false;
  }

  previousChamber(): boolean {
    const prevId = this.currentChamberId - 1;
    const exists = CHAMBERS.some(c => c.id === prevId);
    if (exists) {
      this.currentChamberId = prevId;
      return true;
    }
    return false;
  }

  restartCurrentChamber() {
    // Current chamber ID remains the same
  }

  hasNext(): boolean {
    return CHAMBERS.some(c => c.id === this.currentChamberId + 1);
  }

  validateChamber(chamber: ChamberData) {
    const { width, height, pairs, solution } = chamber;
    
    for (const pair of pairs) {
      const sol = solution.find(s => s.color === pair.color);
      if (!sol) throw new Error(`[Validation] Chamber ${chamber.id}: Solution missing for color ${pair.color}`);
      
      const path = sol.path;
      if (path.length < 2) throw new Error(`[Validation] Chamber ${chamber.id}: Solution path too short for color ${pair.color}`);
      
      const startNode = path[0];
      const endNode = path[path.length - 1];
      
      const matchesStart = startNode.x === pair.start.x && startNode.y === pair.start.y && endNode.x === pair.end.x && endNode.y === pair.end.y;
      const matchesEnd = startNode.x === pair.end.x && startNode.y === pair.end.y && endNode.x === pair.start.x && endNode.y === pair.start.y;
      
      if (!matchesStart && !matchesEnd) {
        throw new Error(`[Validation] Chamber ${chamber.id}: Solution endpoints do not match pairs for color ${pair.color}`);
      }
    }
    
    const cellMap: Record<string, boolean> = {};
    let cellCount = 0;
    
    for (const sol of solution) {
      const path = sol.path;
      for (let i = 0; i < path.length; i++) {
        const node = path[i];
        
        if (node.x < 0 || node.x >= width || node.y < 0 || node.y >= height) {
           throw new Error(`[Validation] Chamber ${chamber.id}: Out of bounds at ${node.x},${node.y}`);
        }
        
        const key = `${node.x},${node.y}`;
        if (cellMap[key]) {
          throw new Error(`[Validation] Chamber ${chamber.id}: Crossings detected at ${key}`);
        }
        
        cellMap[key] = true;
        cellCount++;
        
        if (i > 0) {
          const prev = path[i - 1];
          const dx = Math.abs(node.x - prev.x);
          const dy = Math.abs(node.y - prev.y);
          if (dx + dy !== 1) {
             throw new Error(`[Validation] Chamber ${chamber.id}: Invalid step from ${prev.x},${prev.y} to ${node.x},${node.y}`);
          }
        }
      }
    }
    
    if (cellCount !== width * height) {
      throw new Error(`[Validation] Chamber ${chamber.id}: Not all cells filled! Filled ${cellCount}/${width * height}`);
    }
  }
}
