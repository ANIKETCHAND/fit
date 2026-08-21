# FitTrack — Design Direction

## Three stylistic approaches

| Theme Name | Very Brief Intro | Probability |
| --- | --- | --- |
| Kinetic Anatomy Lab | A dark clinical training studio where anatomical intelligence is rendered through luminous muscle contours and precision instruments. It should feel composed, technical, and athlete-first. | 0.07 |
| Alpine Training Journal | A tactile editorial interface inspired by high-altitude field notebooks, with mineral surfaces, off-white paper notes, and performance signals in safety orange. | 0.04 |
| Velocity Circuit | A forward-leaning performance cockpit using dramatic perspective, electric-lime metrics, and a sculptural central body. It is energetic without becoming a gaming interface. | 0.09 |

## Selected approach: Kinetic Anatomy Lab

### Design Movement

**Neo-brutalist sports instrumentation** tempered with a high-end sports-medicine editorial system. The interface should feel like a performance lab: bold calibrated typography, chart-like inscriptions, technical rulers, and a sculptural anatomical centerpiece.

### Core Principles

1. **The body is the interface.** Every large layout decision directs attention to the interactive body instead of competing dashboard furniture.
2. **Instrument, not admin panel.** Cards carry purpose-specific information and vary in scale; they are not a repetitive grid of rounded containers.
3. **Electric signal on graphite.** Lime marks action, activity, and selected anatomy; restrained white and slate establish calm hierarchy.
4. **Motion communicates physicality.** Rotation, selection, progress, and live data animate with controlled inertia, never decorative overload.

### Color Philosophy

The near-black graphite background creates a focused training-room atmosphere that makes the body and data glow rather than shout. Acid lime (`#C6FF3D`) is deliberately reserved for the athlete's active state, selected muscles, progress, and primary calls to action; smoke, bone, and subdued blue-gray give the secondary information enough quiet contrast.

### Layout Paradigm

An **asymmetrical instrument bay**: a narrow vertical navigation rail anchors the left edge, the body occupies an oversized central stage, and a diagnostic drawer layers information on the right. On smaller screens, the body stage stays first and the clinical data folds into an edge-to-edge bottom sheet rather than collapsing into tiny columns.

### Signature Elements

1. **Lime crosshair halos** behind the body, with measurement ticks that imply anatomical scanning.
2. **Split-spectrum panels**, where charcoal data fields meet a thin fluorescent tracking edge.
3. **Technical micro-labels** in a compact monospace face: set counts, timestamps, and anatomical tags.

### Interaction Philosophy

Controls feel like physical instruments: states clearly change tone and depth; every button has a focused active state. Muscle hover provides lightweight, immediate feedback while a click commits the diagnostic panel to that muscle. Camera view selection is explicit and recoverable with a reset control.

### Animation

Use a crisp `cubic-bezier(0.23, 1, 0.32, 1)` for UI arrivals under 280 ms. The body can idle with a barely perceptible float and controlled auto-rotation; selection gains a measured emission pulse, not an aggressive glow. Metrics animate via SVG stroke offsets and count-up transitions. All non-essential movement is removed under `prefers-reduced-motion`.

### Typography System

**Barlow Condensed** drives all display headings and numerical callouts—wide, athletic, and spatially economical. **DM Sans** handles readable UI copy and labels. **Space Mono** is limited to data coordinates, labels, and controls. Headings run uppercase with tracked lettering; body copy remains sentence case and calm.

### Brand Essence

**FitTrack is the performance command center for athletes who want their training data to be as visible as their effort.** Personality: **precise, kinetic, disciplined**.

### Brand Voice

Headlines are imperative and factual; CTAs are action-based, not generic. Microcopy is short, analytic, and training-literate.

> “Train the system. See the signal.”

> “Chest recovery is ready for volume.”

### Wordmark & Logo

The logo is a **split vertebra / upward pulse mark**: two asymmetric vertical slabs form a stylized `F` and an upward training waveform. It appears as a bold graphical symbol without text; the wordmark uses a custom-spaced Barlow Condensed treatment.

### Signature Brand Color

**Signal Lime — `#C6FF3D`**

## Style Decisions

- The center stage always exposes readable muscle structure, scan geometry, or a selected anatomical signal; it never resolves as an unmarked mannequin silhouette.
- Every product shell includes the split vertebra/upward pulse mark with the custom-spaced Barlow Condensed FitTrack wordmark.
- Primary language reads like a training-lab instrument: imperative, short, and analytic rather than casual wellness copy.
- Athlete-scan coordinates, crosshairs, ruler ticks, and signal paths recur across anatomy, data panels, and workflow pages to make calibration the product’s ownable motif.
- The procedural body uses layered muscle divisions, contour lines, and fiber cues rather than smooth, unmarked mannequin forms.
- Signal Lime remains semantic and scarce: a selected muscle, live physiological state, focused control, or primary commit action.
- Secondary workflows retain a task-specific anatomical or scan-derived signal, not merely an isolated dark-form layout.
- Pixel-art is a supporting fitness-console layer: low-resolution athlete monitors, segmented graphs, and scan-cursor motion sit inside the performance-lab system; it does not replace realistic training data or the 3D anatomy interface.
- Pixel treatments use the product’s graphite, Signal Lime, bone-white, and muted recovery-blue tones, with sharp 1px geometry and no arcade-style rainbow palette.
- Every major workflow retains a non-pixel anatomical signal—such as a segmented muscle map, calibration tile, or scan-derived coordinate rail—so pixel sprites remain supporting evidence rather than the whole interface.
- Signal Lime `#C6FF3D` is reserved for live, selected, or committed states; standard labels, dividers, and inactive instrument details resolve in bone, smoke, slate, or muted recovery-blue.
- Pixel-art is supportive evidence only: each major workflow is compositionally led by a non-pixel anatomical or scan-derived signal, with Signal Lime reserved for active physiology, explicit commitments, and live progress.
- The reference contributes **material language rather than a literal clone**: deep carbon panels, thin technical rules, restrained warm-ember edge signals, and asymmetric diagnostic bays make the product feel manufactured rather than template-driven.
- Display typography now uses **Chakra Petch** for angular, athletic headings and calibrated numbers; **Manrope** handles all readable interface copy. Space Mono remains a narrow technical annotation face only.
- Settings and Support use a command-deck composition: one decisive primary panel, a slimmer intelligence rail, purposeful details, and no generic stacked-card dashboard patterns.
- **Style Decisions:** Calibration screens use baseline-measurement geometry, Support uses trace-routing geometry, and generic body thumbnails are reserved for anatomy-led workflows. The central body always exposes contour, fiber, and muscle-segmentation logic. Signal Lime is limited to active physiology, selected state, commit actions, active progress, and key training numerals; passive instrumentation resolves in bone, smoke, and recovery-blue.
