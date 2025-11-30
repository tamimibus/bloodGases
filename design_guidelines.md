# Blood Gas Interpretation App - Design Guidelines

## Design Approach
**System-Based Approach** - This is a clinical decision-support tool requiring clarity, precision, and professional credibility. Drawing from modern medical software interfaces (Epic, UpToDate) with Material Design principles for structured data presentation.

## Core Design Principles
1. **Clinical Clarity**: Every element serves diagnostic accuracy
2. **Guided Navigation**: Users should never feel lost in the diagnostic flow
3. **Professional Trust**: Visual design reinforces medical authority
4. **Data Prominence**: Numbers and results are the hero, not decoration

## Typography
**Font Stack**: Inter (via Google Fonts CDN) for its exceptional readability at all sizes and professional medical feel
- **Headings**: 
  - Page titles: text-2xl font-semibold
  - Step titles: text-xl font-medium
  - Section headers: text-lg font-medium
- **Body Text**: text-base (16px) for labels and descriptions
- **Medical Values**: text-3xl font-bold for primary measurements (pH, pCO2), text-xl font-semibold for secondary values
- **Small Text**: text-sm for helper text, units, and footnotes

## Layout System
**Spacing Primitives**: Use Tailwind units of 3, 4, 6, 8, and 12 (e.g., p-4, gap-6, m-8)
- Container: max-w-5xl mx-auto for main content area
- Step cards: p-6 to p-8 for content padding
- Section spacing: mb-8 between major sections, mb-4 between related elements
- Form inputs: h-12 with px-4 for comfortable touch targets

## Component Library

### A. Navigation & Progress
- **Multi-step Progress Bar**: Horizontal stepper showing all diagnostic steps (6 steps total)
  - Active step: prominent with clinical blue indicator
  - Completed steps: checkmark icons with connecting lines
  - Future steps: muted with dashed connectors
  - Position: fixed top of page, always visible

- **Step Container**: Card-based design with subtle elevation
  - White background with shadow-md
  - Rounded corners (rounded-lg)
  - Clear step number badge in top-left

### B. Input Components
- **Numeric Input Fields**: Large, clear inputs for medical values
  - Height h-14 with text-xl for easy reading
  - Unit labels positioned inline (e.g., "pH: [input]")
  - Real-time validation with inline error states
  - Helper text below showing normal ranges (text-sm, muted)

- **Range Indicators**: Visual bars showing where entered value falls
  - Color zones matching flowchart: blue (acidaemia), green (normal), orange (alkalaemia)
  - Marker showing current value position
  - Appears below relevant inputs (pH, pCO2, HCO3)

### C. Flowchart Visualization
- **Interactive Diagram**: SVG-based flowchart matching the provided image
  - Nodes: Rectangular decision points with rounded corners
  - Active pathway: highlighted with thicker borders and accent color
  - Completed path: subtle green outline
  - Inactive branches: reduced opacity (opacity-40)
  - Current position: pulsing glow effect on active node

- **Color Coding** (matching flowchart zones):
  - Blue zone (#3B82F6): Respiratory disorders
  - Orange zone (#F97316): Metabolic disorders  
  - Gray zone (#64748B): Decision points
  - Green zone (#10B981): Normal/compensation

### D. Results Display
- **Diagnosis Card**: Prominent result summary
  - Large heading with diagnosis name
  - Color-coded border-l-4 matching disorder type
  - Key values displayed in grid (2-column on desktop)
  - Expandable "Causes" section with bulleted list

- **Calculation Breakdown**: Accordion-style sections showing:
  - Anion Gap calculation with formula
  - Winter's formula comparison
  - Delta ratio analysis
  - Each with "Show calculation" toggle

### E. Action Buttons
- **Primary CTA**: "Next Step" / "Calculate" / "View Results"
  - Full width on mobile, auto width on desktop
  - Height h-12, px-8
  - Positioned bottom-right of step cards
  
- **Secondary Actions**: "Back" / "Reset"
  - Outlined variant with hover states
  - Positioned bottom-left

### F. Data Tables
- **Value Summary Table**: Clean rows showing input/calculated values
  - Alternating row backgrounds for readability
  - Right-aligned numbers with proper spacing
  - "Normal Range" column for reference

## Visual Treatment
- **Elevation**: Use shadow-sm for cards, shadow-md for active elements, shadow-lg for modals
- **Borders**: border-gray-200 for subtle divisions, accent colors for clinical states
- **Background**: bg-gray-50 for page, bg-white for cards
- **Animations**: Minimal - only for pathway progression (fade transitions, 200ms duration)

## Responsive Behavior
- **Desktop (lg:)**: Side-by-side layout for flowchart + inputs, 2-column grids
- **Tablet (md:)**: Stacked flowchart above inputs, single column
- **Mobile**: Full-width single column, collapsible flowchart, sticky progress bar

## Icons
**Heroicons** (via CDN) for medical and UI icons:
- Check circle (completed steps)
- Exclamation triangle (warnings)
- Information circle (helper tooltips)
- Chevrons (navigation)
- Calculator (for calculation sections)

## Images
No hero images needed - this is a clinical tool prioritizing data and functionality over marketing visuals.