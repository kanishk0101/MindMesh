# MindMesh

**MindMesh** is a psychological, behavior-adaptive puzzle game. On the surface, it is a grid-based logic puzzle where players must draw continuous paths to connect matching nodes without crossing lines. Beneath the surface, it is an engine that watches, analyzes, and adapts to how you think.

## 🧠 The Psychological Mirror
As you play, the game silently records your **Vestiges**—deep telemetry tracking your every hesitation, backtrack, speed, and spatial routing preference. 

At the end of every Act, you are presented with a **Cognitive Report**: a generated profile scoring you on:
* **Planning:** How long you wait before making your first move.
* **Commitment:** Your confidence in drawing paths without backtracking.
* **Adaptability:** Your reaction times and flexibility.
* **Speed:** Raw solve time.
* **Efficiency:** Your move count vs. the theoretical optimal path.
* **Dominant Scar:** A calculation of your most rigid behavioral flaw (e.g., *High Planning Latency*, *Center Corridor Preference*, *Commitment Instability*).

## ⚙️ The AI Director & Mutations
Starting in Act III (Chamber 10+), an offline **AI Director** takes over. It reads your rolling Cognitive Report and actively deploys **Mutations** into the puzzle logic specifically designed to exploit your weaknesses:
* **Commitment Lock:** Paths turn gray and cannot be erased. Deployed if you second-guess yourself too often.
* **Time Pressure:** A ticking clock. Deployed if you are overly cautious and take too long to plan.
* **False Instinct:** A fake, tempting path flashes on the screen mimicking your exact routing habits to bait you into a trap.
* **Memory Fragments:** In key narrative chambers, the board literally renders ghost lines of your past routing habits using cinematic corruption effects before letting you play.

## 🛠 Tech Stack
MindMesh is built purely for the client-side browser.
* **Engine:** [Phaser 3](https://phaser.io/)
* **Language:** TypeScript
* **Build Tool:** Vite
* **Persistence:** Native Browser `IndexedDB` (No backend server required. All analytics and telemetry are processed and stored 100% offline).

## 🚀 Running Locally
Because MindMesh uses Vite, running it locally is incredibly fast and simple.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the local address provided (usually `http://localhost:5173` or `http://localhost:3001`).

## 📦 Building for Production
To compile the highly-optimized static files for deployment:
```bash
npm run build
```
This will generate a `dist/` folder. You can deploy this folder to any static hosting service (Netlify, Vercel, GitHub Pages) by simply dropping the folder in. No database or backend setup is required.

## ⌨️ Debug Controls (Developer Mode)
* Press the **`D`** key during any chamber to toggle the Developer Overlay. This renders a live readout of your dynamically shifting Cognitive Report and shows exactly which Mutation the AI Director is planning to use against you.
