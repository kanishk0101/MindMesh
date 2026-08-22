import { Cell } from './Cell';

export class Path {
  color: number;
  cells: Cell[] = [];

  constructor(color: number, startCell: Cell) {
    this.color = color;
    this.cells.push(startCell);
  }

  add(cell: Cell) {
    this.cells.push(cell);
  }

  clear() {
    this.cells = [];
  }

  popUntil(cell: Cell) {
    const idx = this.cells.indexOf(cell);
    if (idx !== -1) {
      this.cells.splice(idx + 1);
    }
  }

  contains(cell: Cell): boolean {
    return this.cells.includes(cell);
  }

  get length(): number {
    return this.cells.length;
  }

  get lastCell(): Cell {
    return this.cells[this.cells.length - 1];
  }
}
