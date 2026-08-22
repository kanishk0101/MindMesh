export class Cell {
  x: number;
  y: number;
  color: number | null = null;
  isEndpoint: boolean = false;
  isLocked: boolean = false;
  isBlocked: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clear() {
    if (!this.isEndpoint && !this.isLocked) {
      this.color = null;
    }
  }
}
