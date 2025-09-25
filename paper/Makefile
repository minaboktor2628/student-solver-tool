TEX = main
BUILD = build

.PHONY: all watch clean clean-all open help

# Default: build the PDF
all:
	latexmk

# Live preview (rebuild on save)
watch:
	latexmk -pvc

clean:
	latexmk -c

clean-all:
	latexmk -C

# Open the PDF with the default viewer (cross-platform attempt)
open: $(BUILD)/$(TEX).pdf
	@xdg-open $< 2>/dev/null || open $< 2>/dev/null || start $< 2>/dev/null || true

# Show available targets
help:
	@echo "Makefile for LaTeX project"
	@echo
	@echo "Usage:"
	@echo "  make           Build the PDF ($(TEX).pdf)"
	@echo "  make watch     Rebuild automatically on changes"
	@echo "  make clean     Remove auxiliary files (keep PDF)"
	@echo "  make clean-all Remove aux files AND the PDF"
	@echo "  make open      Open the PDF with default viewer"
	@echo "  make help      Show this help message"
	@echo
	@echo "Example: in one terminal, run 'make watch', and then in another terminal, run 'make open'."

