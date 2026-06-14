# VectorShift Visual AI Workflow Builder

A production-grade, highly responsive, dark-themed visual Directed Acyclic Graph (DAG) construction kit. Build complex multi-node AI pipelines, optimize layout topologies, and manage persistence on Firebase Firestore out-of-the-box.

---

## 📂 Architecture & Folder Structure

This workspace has been restructured into standardized decoupled modules to align with deployment guidelines and assignment criteria, while keeping the live browser environment running on Google AI Studio:

```text
├── backend/                       # Python FastAPI Backend Services
│   ├── main.py                    # Cycle detection & graph statistics validator
│   └── requirements.txt           # Python backend dependencies list
│
├── frontend/                      # Independent React + Tailwind + Vite Workspace
│   ├── src/                       # Frontend components, assets and state hooks
│   ├── index.html                 # HTML viewport entry-point
│   ├── vite.config.ts             # Vite frontend asset packager
│   ├── tsconfig.json              # TypeScript frontend compilation schema
│   └── package.json               # Independent frontend dependencies list
│
└── src/ (Root Environment)        # Live AI Studio browser deployment environment
    ├── components/                # Modular visual units (Toolbar, Sidebar, Nodes)
    ├── store/                     # Zustand centralized flux workflow states
    ├── lib/                       # Firebase Firestore connectors & auth modules
    └── server.ts                  # Hybrid Full-Stack Node.js applet supervisor
```

---

## 🛠️ Tech Stack & Key Integrations

### Frontend
- **React 19 & Vite**: Ultra-fast hot-rebuild system.
- **@xyflow/react**: Custom Canvas rendering node graphs with responsive zoom & pan, multi-selection, and automatic snaps.
- **Zustand**: Fast state engine controlling topological layouts, node fields, dynamic connection paths.
- **Tailwind CSS**: Premium visual design utilizing dark hues and custom glowing gradients.
- **Lucide Icons**: Unified semantic vector icon set.

### Backend
- **FastAPI (Python)**: Robust, self-documenting routing engine handling JSON schema, validation, and cycle analysis.
- **Node.js Express Middleware**: Production proxy serving the built assets and forwarding DAG parsing computations.

### Database & Authentication
- **Firebase Auth**: Secure login integration via asynchronous Google Sign-in Popups.
- **Google Cloud Firestore**: Real-time database synchronizing workflow graphs, custom configurations, description fields, and node count stats under personal client keys, completely conforming to strict schema guidelines.

---

## 🚀 Running locally

### 1. Backend Server Setup (FastAPI)
Navigate to `/backend` directory and install the package requirements:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Development Setup
Navigate to `/frontend` directory or run from root root directory:
```bash
cd frontend
npm install
npm run dev
```
Vite will serve the app on port `3000` and automatically forward all API traffic `/api/*` to your python server on `8000`.

---

## 🔮 Core Features

1. **Topological Layout (Auto-layout)**: Instantly re-align messy, cluttered canvases horizontally matching Kahn's topological sequencing.
2. **Interactive Node Blocks Creation**: Double-click raw nodes to add, dragging from sidebar palette, or clicking to append immediately on the cursor canvas.
3. **DAG Evaluator Service**: Analyzes directionality and detects cyclic loops, warning you of circular dependencies.
4. **Cloud Database persistence**: Connect your Google Account, type in a custom name, and save workflows to retrieve them instantly from any browser device.
