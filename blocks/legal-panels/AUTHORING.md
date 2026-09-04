# Legal page — authoring the panel images

The **Legal** page (`/legal`) uses the **Legal Panels** block. Each panel is one
"Legal Panel" item with a rich‑text **Panel Content** field plus two image
fields that let you add pictures without touching code:

- **Image Layout** — a dropdown that controls how the pictures are arranged.
- **Panel Images** — an image picker where you select one or more assets.

The live page shows images in **three** panels. This guide lists exactly what to
add to each. Nothing is hardcoded — if you change the layout or swap an image in
the editor, the page updates accordingly.

> Prerequisite: the five source images must exist in the DAM first (see
> [Uploading the images](#uploading-the-images) at the end). Once uploaded, pick
> them in the **Panel Images** field of the panels below.

---

## Image Layout options

| Option | What it does | Use it for |
| --- | --- | --- |
| **None** | No images (text‑only panel) | Every panel that has no picture |
| **Grid (two side by side, third full width)** | 1st + 2nd images sit side by side; a 3rd image spans the full width below them | Video and motion requirements |
| **Half width (single image, aligned left)** | One image at 50% width, left‑aligned | Patient data and consent forms |
| **Beside card (image left of a purple card)** | The image sits to the **left** of the purple panel, side by side | Best practice tips |

---

## Panel 1 — "Video and motion requirements"

- **Image Layout:** `Grid (two side by side, third full width)`
- **Panel Images:** add these **three**, in this order:
  1. `clarify-dl-lesion-detectability-spect-scan`
  2. `clarify-dl-technical-disclaimer-text`
  3. `omni-medical-imaging-scanner-bore`

Result: images 1 and 2 render side by side, image 3 spans full width beneath them.

## Panel 2 — "Patient data and consent forms"

- **Image Layout:** `Half width (single image, aligned left)`
- **Panel Images:** add this **one**:
  1. `bone-spect-ct-clarify-dl-image-reconstruction-comparison`

Result: the Bone SPECT/CT comparison image renders at half width, aligned left,
below the intro paragraph.

## Panel 3 — "Best practice tips"

- **Image Layout:** `Beside card (image left of a purple card)`
- **Panel Images:** add this **one**:
  1. `ge-healthcare-manufacturing-employee-portrait`

Result: the employee portrait renders on the **left**, and the purple "Best
practice tips" card sits beside it on the **right** (they stack on mobile).

> The panel's purple styling is automatic — it's applied whenever the panel's
> heading is "Best practice tips". You do not set a colour anywhere.

---

## Step‑by‑step in the editor

1. Open the Legal page in the editor (Universal Editor).
2. Click into the panel you want (e.g. **Video and motion requirements**).
3. In its properties, set **Image Layout** to the value from the table above.
4. In **Panel Images**, click to add an image, choose the asset from the DAM,
   and repeat for each image the panel needs (mind the order for the Grid panel).
5. Repeat for the other two panels.
6. Preview the page — the images appear in the layout you chose.
7. Publish when it looks right.

To change or remove an image later, just edit the same two fields — no code
change is needed.

---

## Uploading the images

The five images come from the live brand hub. If they are not yet in the DAM,
upload them first, then pick them in the panels above. Source files:

| Panel | Image | Source URL |
| --- | --- | --- |
| Video and motion | clarify-dl-lesion-detectability-spect-scan | `https://brand.gehealthcare.com/wp-content/uploads/2026/05/clarify-dl-lesion-detectability-spect-scan-scaled.jpg` |
| Video and motion | clarify-dl-technical-disclaimer-text | `https://brand.gehealthcare.com/wp-content/uploads/2026/05/clarify-dl-technical-disclaimer-text-scaled.jpg` |
| Video and motion | omni-medical-imaging-scanner-bore | `https://brand.gehealthcare.com/wp-content/uploads/2026/05/omni-medical-imaging-scanner-bore-scaled.jpg` |
| Patient data | bone-spect-ct-clarify-dl-image-reconstruction-comparison | `https://brand.gehealthcare.com/wp-content/uploads/2026/05/bone-spect-ct-clarify-dl-image-reconstruction-comparison-scaled.jpg` |
| Best practice tips | ge-healthcare-manufacturing-employee-portrait | `https://brand.gehealthcare.com/wp-content/uploads/2026/05/ge-healthcare-manufacturing-employee-portrait.jpg` |

Alt text: on the live site these images have empty alt (they are decorative
supporting visuals). Add descriptive alt text if your accessibility standards
require it — the image picker keeps whatever alt you set on the asset.
