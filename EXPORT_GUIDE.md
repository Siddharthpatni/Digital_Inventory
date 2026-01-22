# How to Export Presentation to PowerPoint/PDF

## Option 1: Using Pandoc (Recommended)

### Install Pandoc:
```bash
# macOS
brew install pandoc

# After installation:
cd /Users/siddharthpatni/antigravity/scratch/digital-inventory
pandoc PRESENTATION.md -o StockFlow_Presentation.pptx
```

This will create a PowerPoint file from the markdown.

## Option 2: Using Google Slides

1. Open Google Slides
2. Create a new presentation
3. Copy content from `PRESENTATION.md`
4. Each `---` separator = new slide
5. Format manually
6. File → Download → Microsoft PowerPoint (.pptx)
7. Or File → Download → PDF Document (.pdf)

## Option 3: Using Microsoft PowerPoint

1. Open PowerPoint
2. Create slides manually using content from `PRESENTATION.md`
3. Each section between `---` is one slide
4. Save as .pptx or export as PDF

## Option 4: Convert to PDF Directly

```bash
# Install if needed:
brew install pandoc
brew install --cask basictex

# Convert to PDF:
pandoc PRESENTATION.md -t beamer -o StockFlow_Presentation.pdf
```

## Files Ready for Export:
- `PRESENTATION.md` - Student/academic format (23 slides)
- `PITCH_DECK.md` - Investor format (23 slides)
- `Financial_Model.csv` - Import to Excel
- `COST_ESTIMATION.md` - Detailed financials

## Quick Command:
```bash
cd /Users/siddharthpatni/antigravity/scratch/digital-inventory

# To PowerPoint:
pandoc PRESENTATION.md -o StockFlow_Presentation.pptx

# To PDF:
pandoc PRESENTATION.md -t beamer -o StockFlow_Presentation.pdf
```
