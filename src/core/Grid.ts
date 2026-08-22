import { Cell } from './Cell';

export class Grid {
  width: number;
  height: number;
  cells: Cell[][] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push(new Cell(x, y));
      }
      this.cells.push(row);
    }
  }

  getCell(x: number, y: number): Cell | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.cells[y][x];
  }

  getCells(): Cell[] {
    const all: Cell[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        all.push(this.cells[y][x]);
      }
    }
    return all;
  }
}
