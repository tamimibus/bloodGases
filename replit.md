# Blood Gas Interpreter - Clinical ABG Analysis Tool

## Overview

An interactive multi-step blood gas interpretation tool that guides healthcare professionals through arterial blood gas (ABG) analysis. The application follows a clinical decision-support flowchart to diagnose acid-base disorders including respiratory acidosis/alkalosis and metabolic acidosis/alkalosis.

## Current State

**MVP Complete** - All core features are implemented and tested:
- Multi-step wizard with 6 diagnostic steps
- Interactive flowchart visualization
- Real-time calculations (anion gap, osmolar gap, Winter's formula, delta ratio)
- Compensation analysis (acute vs chronic)
- Final diagnosis with causes and educational information
- Dark/Light theme toggle

## Project Architecture

### Frontend (React + TypeScript)
```
client/src/
├── components/
│   ├── blood-gas/           # Main blood gas components
│   │   ├── wizard-context.tsx    # State management for wizard
│   │   ├── wizard.tsx            # Main wizard container
│   │   ├── step-indicator.tsx    # Progress bar component
│   │   ├── flowchart.tsx         # Interactive flowchart SVG
│   │   ├── value-range-indicator.tsx # Visual range bars
│   │   └── steps/
│   │       ├── step-ph.tsx           # Step 1: pH input
│   │       ├── step-gases.tsx        # Step 2: pCO2 & HCO3
│   │       ├── step-anion-gap.tsx    # Step 3: Anion gap calc
│   │       ├── step-osmolar-gap.tsx  # Step 4: Osmolar gap (optional)
│   │       ├── step-compensation.tsx # Step 5: Compensation analysis
│   │       └── step-diagnosis.tsx    # Step 6: Final results
│   ├── theme-provider.tsx    # Dark/light theme context
│   ├── theme-toggle.tsx      # Theme toggle button
│   └── ui/                   # Shadcn UI components
├── lib/
│   ├── blood-gas-logic.ts    # Client-side calculation logic
│   ├── queryClient.ts        # React Query setup
│   └── utils.ts              # Utility functions
└── pages/
    ├── home.tsx              # Main page with wizard
    └── not-found.tsx         # 404 page
```

### Backend (Express + TypeScript)
```
server/
├── routes.ts         # API endpoints for calculations
├── storage.ts        # In-memory storage interface
├── index.ts          # Express server setup
└── vite.ts           # Vite dev server integration
```

### Shared Types
```
shared/
└── schema.ts         # Blood gas types, normal ranges, causes data
```

## Key Features

### 1. Multi-Step Wizard (6 Steps)
- **Step 1: pH Analysis** - Input pH, classify as acidaemia/normal/alkalaemia
- **Step 2: pCO2 & HCO3** - Input values, determine respiratory vs metabolic
- **Step 3: Anion Gap** - Calculate AG = Na - (Cl + HCO3) with albumin correction
- **Step 4: Osmolar Gap** - Optional calculation for toxic alcohols
- **Step 5: Compensation** - Winter's formula, delta ratio analysis
- **Step 6: Diagnosis** - Summary with causes and educational content

### 2. Interactive Flowchart
- Visual representation of diagnostic pathway
- Color-coded nodes (blue=respiratory, orange=metabolic, green=normal)
- Highlights active path through the algorithm
- Clickable nodes to navigate steps

### 3. Clinical Calculations
- **Anion Gap**: AG = [Na+] - ([Cl-] + [HCO3-])
- **Albumin Correction**: Add 2.5 for every 1 g/dL albumin below 4
- **Osmolar Gap**: Measured - Calculated osmolality
- **Winter's Formula**: Expected pCO2 = (1.5 × HCO3) + 8 ± 2
- **Delta Ratio**: (AG-12) / (24-HCO3)

### 4. Clinical Causes Database
- Respiratory Acidosis (acute/chronic causes)
- Metabolic Acidosis (NAGMA "USED CRAP", HAGMA "CAT MUD PILES")
- Respiratory Alkalosis ("CHAMPS" mnemonic)
- Metabolic Alkalosis ("CLEVER PD" mnemonic)

## Color Scheme (Clinical Zones)

The app uses clinical-standard color coding:
- **Red** (`--clinical-red`): Acidaemia, high anion gap, warnings
- **Orange** (`--clinical-orange`): Metabolic disorders, alkalaemia
- **Blue** (`--clinical-blue`): Respiratory disorders
- **Green** (`--clinical-green`): Normal values, appropriate compensation
- **Gray** (`--clinical-gray`): Neutral/calculation nodes
- **Purple** (`--clinical-purple`): Mixed disorders, low AG

## API Endpoints

```
POST /api/interpret          - Full blood gas interpretation
POST /api/calculate/anion-gap      - Calculate anion gap
POST /api/calculate/osmolar-gap    - Calculate osmolar gap
POST /api/calculate/winters        - Winter's formula
POST /api/calculate/delta-ratio    - Delta ratio calculation
GET  /api/causes/:disorder         - Get causes for disorder type
```

## Normal Ranges

| Parameter | Low | High | Unit |
|-----------|-----|------|------|
| pH | 7.35 | 7.45 | - |
| pCO2 | 35 | 45 | mmHg |
| HCO3 | 22 | 26 | mmol/L |
| Na | 135 | 145 | mmol/L |
| Cl | 98 | 106 | mmol/L |
| Anion Gap | 8 | 16 | mEq/L |
| Albumin | 3.5 | 5.0 | g/dL |

## Development

### Running Locally
```bash
npm run dev
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **State**: React Context (wizard state), React Query (API)
- **Build**: Vite
- **Styling**: Tailwind CSS with custom clinical color tokens

## User Preferences

- Clean, professional medical interface
- Step-by-step guided flow (not form-based)
- Visual flowchart matching clinical decision algorithm
- Dark/light theme support
- Educational content at each step

## Recent Changes

- **2024-11-30**: Initial MVP implementation with all 6 wizard steps
- **2024-11-30**: Added interactive flowchart visualization
- **2024-11-30**: Implemented clinical color scheme matching source diagram
- **2024-11-30**: Added comprehensive causes database with mnemonics
