const fs = require('fs');

function generatePuzzle(w, h, targetColors) {
    let attempts = 0;
    while (attempts < 100000) {
        attempts++;
        let grid = Array.from({length: h}, () => Array(w).fill(-1));
        let paths = [];
        let emptyCells = w * h;
        
        let color = 0;
        while (emptyCells > 0) {
            let candidates = [];
            for (let r=0; r<h; r++) {
                for (let c=0; c<w; c++) {
                    if (grid[r][c] === -1) candidates.push([c, r]);
                }
            }
            if (candidates.length === 0) break;
            let start = candidates[Math.floor(Math.random()*candidates.length)];
            
            let path = [start];
            grid[start[1]][start[0]] = color;
            emptyCells--;
            
            let curr = start;
            // More aggressive wandering to make paths snake around
            let maxLen = Math.floor((w*h) / targetColors * 1.5);
            let targetLength = 3 + Math.floor(Math.random() * maxLen);
            
            while (path.length < targetLength) {
                let neighbors = [];
                let [cx, cy] = curr;
                if (cx > 0 && grid[cy][cx-1] === -1) neighbors.push([cx-1, cy]);
                if (cx < w-1 && grid[cy][cx+1] === -1) neighbors.push([cx+1, cy]);
                if (cy > 0 && grid[cy-1][cx] === -1) neighbors.push([cx, cy-1]);
                if (cy < h-1 && grid[cy+1][cx] === -1) neighbors.push([cx, cy+1]);
                
                if (neighbors.length === 0) break;
                
                let next = neighbors[Math.floor(Math.random()*neighbors.length)];
                path.push(next);
                grid[next[1]][next[0]] = color;
                emptyCells--;
                curr = next;
            }
            paths.push({ color, cells: path });
            color++;
        }
        
        if (paths.some(p => p.cells.length < 2)) continue;
        if (Math.abs(paths.length - targetColors) > 2) continue;
        
        return paths;
    }
    throw new Error("Could not generate for " + w + "x" + h);
}

const acts = [
  { 
    act: "Act I", 
    w: 6, h: 6, colors: 5, 
    diffs: [1,1,2,2,3], 
    titles: ["Calibration Start", "Parallel Logic", "L-Systems", "U-Turns", "Compartments"] 
  },
  { 
    act: "Act II", 
    w: 6, h: 6, colors: 6, 
    diffs: [2,3,3,4,4], 
    titles: ["Emergence", "Intersections", "Divided Paths", "The Maze", "Complex Maneuver"] 
  },
  { 
    act: "Act III", 
    w: 7, h: 7, colors: 7, 
    diffs: [3,3,4,4,4,5], 
    titles: ["Misdirection", "Bottleneck", "Multiple Choice", "Elegant Route", "Constrained", "Open Space"] 
  },
  { 
    act: "Act IV", 
    w: 8, h: 8, colors: 9, 
    diffs: [3,3,3,3,4,4,5], 
    titles: ["Dense Board", "Long Dependencies", "Minimal Waste", "High Planning", "Expert Layout", "The Crossing", "Quiet Current"] 
  },
  { 
    act: "Act V", 
    w: 9, h: 9, colors: 11, 
    diffs: [4,4,5,5,5], 
    titles: ["Echo Junction", "Fractured Hall", "Reckoning", "Silent Engine", "MindMesh Master"] 
  }
];

const COLORS = [
  0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 
  0xff8800, 0x88ff00, 0x0088ff, 0x8800ff, 0xff0088, 0x00ff88,
  0xaaaaaa, 0xffffff, 0x888888, 0x444444
];

let out = `export interface ChamberData {
  id: number;
  act: string;
  title: string;
  difficulty: number;
  vestigeSource?: number;
  width: number;
  height: number;
  pairs: { color: number; start: { x: number; y: number }; end: { x: number; y: number } }[];
  solution: { color: number; path: { x: number; y: number }[] }[];
}

export const CHAMBERS: ChamberData[] = [\n`;

let id = 1;
for (let actIdx = 0; actIdx < acts.length; actIdx++) {
  const act = acts[actIdx];
  for (let i = 0; i < act.diffs.length; i++) {
    let w = act.w;
    let h = act.h;
    if (id === 28) { w = 10; h = 10; }
    
    let targetCols = act.colors;
    if (id === 28) targetCols = 14;

    const paths = generatePuzzle(w, h, targetCols);
    
    let vestigeSource = '';
    if (actIdx === 1) {
       vestigeSource = `    vestigeSource: ${id - 5},\n`;
    }

    out += `  {\n`;
    out += `    id: ${id},\n`;
    out += `    act: "${act.act}",\n`;
    out += `    title: "${act.titles[i]}",\n`;
    out += `    difficulty: ${act.diffs[i]},\n`;
    if (vestigeSource) out += vestigeSource;
    out += `    width: ${w},\n`;
    out += `    height: ${h},\n`;
    
    out += `    pairs: [\n`;
    paths.forEach((p, pIdx) => {
      let start = p.cells[0];
      let end = p.cells[p.cells.length-1];
      out += `      { color: ${COLORS[pIdx]}, start: {x:${start[0]}, y:${start[1]}}, end: {x:${end[0]}, y:${end[1]}} },\n`;
    });
    out += `    ],\n`;

    out += `    solution: [\n`;
    paths.forEach((p, pIdx) => {
      out += `      { color: ${COLORS[pIdx]}, path: [${p.cells.map(c => `{x:${c[0]}, y:${c[1]}}`).join(', ')}] },\n`;
    });
    out += `    ]\n`;
    out += `  }${id === 28 ? '' : ','}\n`;
    id++;
  }
}

out += `];\n`;

fs.writeFileSync('src/data/chambers.ts', out);
console.log('Successfully generated 28 chambers.');
