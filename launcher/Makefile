.PHONY: all build embed app run clean help

# ─────────────────────────────────────────────────────────────────────────────
# Megabonk Launcher — build system
# Usage:
#   make            Build launcher + embed game + create .app
#   make run        Build and run the launcher
#   make build      Swift release build only
#   make embed      Extract game into GameEmbed/
#   make clean      Remove build artifacts
# ─────────────────────────────────────────────────────────────────────────────

LAUNCHER_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
APP_PATH     := $(LAUNCHER_DIR)build/Megabonk Launcher.app

all: build embed app

# Swift release build
build:
	@echo "==> Building launcher (release)..."
	cd $(LAUNCHER_DIR) && swift build -c release

# Extract the Godot game build into GameEmbed/
embed:
	@bash $(LAUNCHER_DIR)scripts/embed_game.sh

# Package into .app bundle
app: build embed
	@bash $(LAUNCHER_DIR)scripts/create_app_bundle.sh

# Build and run
run: app
	@echo "==> Launching..."
	@open "$(APP_PATH)"

# Just run the raw binary (fast dev iteration, no .app packaging)
dev:
	@echo "==> Building (debug) and running binary..."
	@cd $(LAUNCHER_DIR) && swift run

# Quick rebuild after code edits without re-extracting game
quick: build
	@bash $(LAUNCHER_DIR)scripts/create_app_bundle.sh

clean:
	@echo "==> Cleaning..."
	rm -rf $(LAUNCHER_DIR).build
	rm -rf $(LAUNCHER_DIR)build
	rm -rf $(LAUNCHER_DIR)GameEmbed
	@echo "==> Done"

help:
	@echo "Megabonk Launcher targets:"
	@echo "  make all    - build + embed + package .app  (default)"
	@echo "  make run    - build everything and launch the .app"
	@echo "  make dev    - fast debug build & run via swift run"
	@echo "  make build  - swift build -c release only"
	@echo "  make embed  - extract Godot game into GameEmbed/"
	@echo "  make app    - package release build into .app (builds+embeds first)"
	@echo "  make quick  - repackage .app without re-extracting game"
	@echo "  make clean  - remove all build artifacts"
