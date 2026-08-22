import Phaser from 'phaser';
import { Grid } from './Grid';
import { Path } from './Path';
import { Cell } from './Cell';
import { ChamberData } from '../data/chambers';

export class Puzzle extends Phaser.GameObjects.Container {
  grid: Grid;
  paths: Map<number, Path> = new Map();
  pairs: ChamberData['pairs'];
  
  cellSize: number;
  projectionGraphics: Phaser.GameObjects.Graphics;
  gridGraphics: Phaser.GameObjects.Graphics;
  pathGraphics: Phaser.GameObjects.Graphics;
  endpointGraphics: Phaser.GameObjects.Graphics;

  activePathColor: number | null = null;
  
  onMoveCallback?: () => void;
  onSolveCallback?: () => void;
  
  isSolved: boolean = false;
  moves: number = 0;
  
  startTimestamp: number;
  firstMoveDelayMs: number = -1;
  solveTimeMs: number = -1;
  backtracks: number = 0;
  stepCounter: number = 0;
  pathOrder: import('./vestige/Vestige').PathNode[] = [];
  inputEnabled: boolean = true;
  onSolveCallback: (() => void) | null = null;
  onMoveCallback: (() => void) | null = null;
  onMoveHook: ((lastCell: Cell, nextCell: Cell, color: number, isTruncate: boolean) => void) | null = null;

  constructor(scene: Phaser.Scene, data: ChamberData, cellSize: number = 60) {
    super(scene, 0, 0);
    this.startTimestamp = Date.now();
    this.cellSize = cellSize;
    this.pairs = data.pairs;
    this.grid = new Grid(data.width, data.height);

    this.projectionGraphics = scene.add.graphics();
    this.gridGraphics = scene.add.graphics();
    this.pathGraphics = scene.add.graphics();
    this.endpointGraphics = scene.add.graphics();

    this.add(this.projectionGraphics);
    this.add(this.gridGraphics);
    this.add(this.pathGraphics);
    this.add(this.endpointGraphics);

    scene.add.existing(this);

    this.initPairs();
    this.drawGrid();
    this.drawEndpoints();
    this.setupInput();
  }

  async playMemoryFragment(projections: Map<number, {x:number, y:number}[]>) {
    this.inputEnabled = false;
    
    // Pause 300ms
    await new Promise(r => setTimeout(r, 300));
    
    // Draw sequentially
    const colors = Array.from(projections.keys());
    for (const color of colors) {
      this.drawProjectionPath(projections.get(color)!, color);
      await new Promise(r => setTimeout(r, 300));
    }
    
    // Hold to read the fragment
    await new Promise(r => setTimeout(r, 1200));
    
    // Subtle corruption flicker and dissolve
    this.projectionGraphics.setAlpha(0.5);
    await new Promise(r => setTimeout(r, 60));
    this.projectionGraphics.setAlpha(1.2);
    await new Promise(r => setTimeout(r, 60));
    this.projectionGraphics.setAlpha(0.3);
    await new Promise(r => setTimeout(r, 60));
    this.projectionGraphics.setAlpha(0.8);
    
    // Fade out completely
    return new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: this.projectionGraphics,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          this.projectionGraphics.clear();
          this.projectionGraphics.setAlpha(1);
          this.inputEnabled = true;
          this.startTimestamp = Date.now();
          resolve();
        }
      });
    });
  }

  async playFalseInstinct(projections: Map<number, {x:number, y:number}[]>) {
    this.inputEnabled = false;
    
    // Pause 300ms
    await new Promise(r => setTimeout(r, 300));
    
    // Draw only one (False Instinct)
    const colors = Array.from(projections.keys());
    if (colors.length > 0) {
      this.drawProjectionPath(projections.get(colors[0])!, colors[0]);
    }
    
    // Hold to read
    await new Promise(r => setTimeout(r, 1500));
    
    // Fade out cleanly, NO corruption
    return new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: this.projectionGraphics,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          this.projectionGraphics.clear();
          this.projectionGraphics.setAlpha(1);
          this.inputEnabled = true;
          this.startTimestamp = Date.now();
          resolve();
        }
      });
    });
  }

  drawProjectionPath(path: {x:number, y:number}[], color: number) {
    this.projectionGraphics.lineStyle(6, color, 0.30); // 30% opacity fragile stroke
    
    for (let i = 0; i < path.length - 1; i++) {
       const p1 = path[i];
       const p2 = path[i+1];
       const x1 = p1.x * this.cellSize + this.cellSize/2;
       const y1 = p1.y * this.cellSize + this.cellSize/2;
       const x2 = p2.x * this.cellSize + this.cellSize/2;
       const y2 = p2.y * this.cellSize + this.cellSize/2;
       
       const steps = 4;
       for (let j = 0; j < steps; j++) {
         const t1 = j / steps;
         const t2 = (j + 0.6) / steps;
         const sx = x1 + (x2 - x1) * t1;
         const sy = y1 + (y2 - y1) * t1;
         const ex = x1 + (x2 - x1) * t2;
         const ey = y1 + (y2 - y1) * t2;
         
         this.projectionGraphics.beginPath();
         this.projectionGraphics.moveTo(sx, sy);
         this.projectionGraphics.lineTo(ex, ey);
         this.projectionGraphics.strokePath();
       }
    }
  }

  initPairs() {
    for (const pair of this.pairs) {
      const startCell = this.grid.getCell(pair.start.x, pair.start.y);
      const endCell = this.grid.getCell(pair.end.x, pair.end.y);
      if (startCell && endCell) {
        startCell.isEndpoint = true;
        startCell.color = pair.color;
        endCell.isEndpoint = true;
        endCell.color = pair.color;
      }
    }
  }

  drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(2, 0x333333);
    
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        this.gridGraphics.strokeRoundedRect(
          x * this.cellSize + 2, 
          y * this.cellSize + 2, 
          this.cellSize - 4, 
          this.cellSize - 4, 
          8
        );
      }
    }
  }

  drawEndpoints() {
    this.endpointGraphics.clear();
    for (const cell of this.grid.getCells()) {
      if (cell.isEndpoint && cell.color !== null) {
        this.endpointGraphics.fillStyle(cell.color, 1);
        this.endpointGraphics.fillCircle(
          cell.x * this.cellSize + this.cellSize / 2,
          cell.y * this.cellSize + this.cellSize / 2,
          this.cellSize * 0.3
        );
      }
    }
  }

  drawPaths() {
    this.pathGraphics.clear();
    
    for (const path of Array.from(this.paths.values())) {
      if (path.cells.length === 0) continue;
      
      this.pathGraphics.lineStyle(this.cellSize * 0.3, path.color, 1);
      this.pathGraphics.fillStyle(path.color, 1);
      
      this.pathGraphics.beginPath();
      
      const startCell = path.cells[0];
      this.pathGraphics.moveTo(
        startCell.x * this.cellSize + this.cellSize / 2,
        startCell.y * this.cellSize + this.cellSize / 2
      );
      
      for (let i = 1; i < path.cells.length; i++) {
        const cell = path.cells[i];
        this.pathGraphics.lineTo(
          cell.x * this.cellSize + this.cellSize / 2,
          cell.y * this.cellSize + this.cellSize / 2
        );
      }
      
      this.pathGraphics.strokePath();

      for (const cell of path.cells) {
        if (!cell.isEndpoint) {
          this.pathGraphics.fillCircle(
            cell.x * this.cellSize + this.cellSize / 2,
            cell.y * this.cellSize + this.cellSize / 2,
            this.cellSize * 0.15
          );
        }
      }
    }
    
    this.drawMutations();
  }

  drawMutations() {
    for (const cell of this.grid.getCells()) {
      const cx = cell.x * this.cellSize;
      const cy = cell.y * this.cellSize;
      
      if ((cell as any).isLocked) {
        this.pathGraphics.lineStyle(2, 0xffbb00, 0.8);
        this.pathGraphics.strokeRect(cx + 2, cy + 2, this.cellSize - 4, this.cellSize - 4);
        this.pathGraphics.fillStyle(0xffbb00, 0.2);
        this.pathGraphics.fillRect(cx + 2, cy + 2, this.cellSize - 4, this.cellSize - 4);
        
        // lock icon (small square + arch)
        this.pathGraphics.fillStyle(0xffbb00, 1);
        this.pathGraphics.fillRect(cx + this.cellSize/2 - 4, cy + this.cellSize/2 + 2, 8, 6);
        this.pathGraphics.lineStyle(2, 0xffbb00, 1);
        this.pathGraphics.beginPath();
        this.pathGraphics.arc(cx + this.cellSize/2, cy + this.cellSize/2 + 2, 3, Math.PI, 0);
        this.pathGraphics.strokePath();
      }
      
      if ((cell as any).isBlocked) {
        this.pathGraphics.lineStyle(2, 0xff0000, 0.5);
        this.pathGraphics.beginPath();
        this.pathGraphics.moveTo(cx + 10, cy + 10);
        this.pathGraphics.lineTo(cx + this.cellSize - 10, cy + this.cellSize - 10);
        this.pathGraphics.moveTo(cx + this.cellSize - 10, cy + 10);
        this.pathGraphics.lineTo(cx + 10, cy + this.cellSize - 10);
        this.pathGraphics.strokePath();
      }
    }
  }

  setupInput() {
    const width = this.grid.width * this.cellSize;
    const height = this.grid.height * this.cellSize;
    
    const zone = this.scene.add.zone(width / 2, height / 2, width, height);
    zone.setInteractive();
    this.add(zone);

    zone.on('pointerdown', this.onPointerDown, this);
    zone.on('pointermove', this.onPointerMove, this);
    zone.on('pointerup', this.onPointerUp, this);
    zone.on('pointerout', this.onPointerOut, this);
  }

  getCellFromPointer(pointer: Phaser.Input.Pointer): Cell | null {
    const x = pointer.x - this.x;
    const y = pointer.y - this.y;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return this.grid.getCell(col, row);
  }

  clearPathCells(path: Path) {
    for (const cell of path.cells) {
      cell.clear();
    }
  }

  truncatePath(path: Path, cell: Cell): boolean {
    const idx = path.cells.indexOf(cell);
    if (idx === -1) return false;
    
    for (let i = idx + 1; i < path.cells.length; i++) {
      if ((path.cells[i] as any).isLocked) return false;
    }
    
    for (let i = idx + 1; i < path.cells.length; i++) {
      path.cells[i].clear();
    }
    path.cells.splice(idx + 1);
    return true;
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.inputEnabled || this.isSolved) return;
    
    const cell = this.getCellFromPointer(pointer);
    if (!cell || cell.color === null || (cell as any).isBlocked) return;
    
    this.activePathColor = cell.color;
    let path = this.paths.get(this.activePathColor);
    
    if (!path) {
      path = new Path(this.activePathColor, cell);
      this.paths.set(this.activePathColor, path);
    } else {
      if (path.contains(cell)) {
        this.truncatePath(path, cell);
      } else if (cell.isEndpoint && cell.color === this.activePathColor) {
        // Can only clear path if no locked cells
        let hasLocked = false;
        for (const c of path.cells) { if ((c as any).isLocked && !c.isEndpoint) hasLocked = true; }
        if (!hasLocked) {
          this.clearPathCells(path);
          path.clear();
          path.add(cell);
        }
      }
    }
    
    this.drawPaths();
  }

  onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isSolved || this.activePathColor === null) return;
    
    const targetCell = this.getCellFromPointer(pointer);
    if (!targetCell) {
      this.activePathColor = null;
      return;
    }
    
    let path = this.paths.get(this.activePathColor);
    if (!path) return;
    
    let lastCell = path.lastCell;
    
    while (targetCell !== lastCell) {
      let nextX = lastCell.x;
      let nextY = lastCell.y;
      
      const dx = targetCell.x - lastCell.x;
      const dy = targetCell.y - lastCell.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        nextX += Math.sign(dx);
      } else if (dy !== 0) {
        nextY += Math.sign(dy);
      } else {
        break;
      }
      
      const nextCell = this.grid.getCell(nextX, nextY);
      if (!nextCell) break;
      
      const success = this.processCellMove(nextCell);
      if (!success) break;
      
      lastCell = path.lastCell;
      if (!lastCell) break;
    }
  }

  recordMove(lastCell: Cell, targetCell: Cell, color: number, isBacktrack: boolean) {
    if (isBacktrack) {
      this.backtracks++;
    }
    if (this.firstMoveDelayMs === -1) {
      this.firstMoveDelayMs = Date.now() - this.startTimestamp;
    }
    
    if (this.pathOrder.length === 0 || 
        this.pathOrder[this.pathOrder.length - 1].x !== lastCell.x || 
        this.pathOrder[this.pathOrder.length - 1].y !== lastCell.y ||
        this.pathOrder[this.pathOrder.length - 1].color !== color) {
       this.stepCounter++;
       this.pathOrder.push({ x: lastCell.x, y: lastCell.y, color, step: this.stepCounter });
    }
    
    this.stepCounter++;
    this.pathOrder.push({ x: targetCell.x, y: targetCell.y, color, step: this.stepCounter });
    
    this.moves++;
    if (this.onMoveCallback) {
      this.onMoveCallback();
    }
    if (this.onMoveHook) {
      this.onMoveHook(lastCell, targetCell, color, isBacktrack);
    }
  }

  processCellMove(cell: Cell): boolean {
    const path = this.paths.get(this.activePathColor!);
    if (!path) return false;
    
    if ((cell as any).isBlocked) return false;
    
    const lastCell = path.lastCell;
    if (cell === lastCell) return true;

    if (lastCell.isEndpoint && path.length > 1) {
      if (cell === path.cells[path.length - 2]) {
        if (!this.truncatePath(path, cell)) return false;
        this.recordMove(lastCell, cell, this.activePathColor!, true);
        this.drawPaths();
        this.checkWin();
        return true;
      }
      return false; 
    }
    
    const dx = Math.abs(cell.x - lastCell.x);
    const dy = Math.abs(cell.y - lastCell.y);
    if (dx + dy !== 1) return false; 
    
    if (path.contains(cell)) {
      if (!this.truncatePath(path, cell)) return false;
      this.recordMove(lastCell, cell, this.activePathColor!, true);
      this.drawPaths();
      this.checkWin();
      return true;
    }
    
    if (cell.isEndpoint && cell.color !== this.activePathColor) return false;
    if (cell.isEndpoint && cell.color === this.activePathColor && cell === path.cells[0]) return false;
    
    if (cell.color !== null && cell.color !== this.activePathColor) {
      return false;
    }
    
    cell.color = this.activePathColor;
    path.add(cell);
    this.recordMove(lastCell, cell, this.activePathColor!, false);
    this.drawPaths();
    this.checkWin();
    return true;
  }

  onPointerUp() {
    this.activePathColor = null;
  }

  onPointerOut() {
    this.activePathColor = null;
  }

  checkWin() {
    if (this.isSolved) return;
    
    let allConnected = true;
    for (const pair of this.pairs) {
      const path = this.paths.get(pair.color);
      if (!path) {
        allConnected = false;
        break;
      }
      const startCell = path.cells[0];
      const endCell = path.cells[path.length - 1];
      
      if (!startCell || !endCell) {
        allConnected = false; break;
      }
      
      const isStartEnd = (startCell.x === pair.start.x && startCell.y === pair.start.y && endCell.x === pair.end.x && endCell.y === pair.end.y);
      const isEndStart = (startCell.x === pair.end.x && startCell.y === pair.end.y && endCell.x === pair.start.x && endCell.y === pair.start.y);
      
      if (!isStartEnd && !isEndStart) {
        allConnected = false;
        break;
      }
    }
    
    if (!allConnected) return;
    
    const allFilled = this.grid.getCells().every(cell => cell.color !== null || (cell as any).isBlocked);
    if (allFilled) {
      this.isSolved = true;
      this.solveTimeMs = Date.now() - this.startTimestamp;
      
      // Completion pulse
      this.scene.tweens.add({
        targets: [this.pathGraphics, this.endpointGraphics],
        alpha: 0.5,
        yoyo: true,
        duration: 200,
        repeat: 1,
        onComplete: () => {
          if (this.onSolveCallback) this.onSolveCallback();
        }
      });
    }
  }

  destroy(fromScene?: boolean) {
    this.gridGraphics.destroy();
    this.pathGraphics.destroy();
    this.endpointGraphics.destroy();
    super.destroy(fromScene);
  }
}
