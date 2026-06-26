#!/usr/bin/env bash
#
# embed_game.sh — Extract the Godot game build into the launcher's GameEmbed/ folder.
#
# The launcher looks for the embedded game at:
#   - <App>/Contents/Resources/Game/Megabonk Clone.app    (packaged mode)
#   - launcher/GameEmbed/Megabonk Clone.app               (development mode)
#
# This script populates GameEmbed/ from builds/MegabonkClone.zip.
#
set -euo pipefail

# Resolve project root (parent of launcher/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCHER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$LAUNCHER_DIR")"

ZIP_PATH="${PROJECT_ROOT}/builds/MegabonkClone.zip"
EMBED_DIR="${LAUNCHER_DIR}/GameEmbed"
GAME_APP_NAME="Megabonk Clone.app"

echo "==> Embedding game into launcher"
echo "    Source ZIP : $ZIP_PATH"
echo "    Target dir : $EMBED_DIR"

if [[ ! -f "$ZIP_PATH" ]]; then
    echo "ERROR: Game ZIP not found at $ZIP_PATH"
    echo "       Run a Godot export first to produce builds/MegabonkClone.zip"
    exit 1
fi

# Clean previous embed
rm -rf "$EMBED_DIR"
mkdir -p "$EMBED_DIR"

# Extract
echo "==> Extracting..."
unzip -q -o "$ZIP_PATH" -d "$EMBED_DIR"

# Verify
if [[ ! -d "$EMBED_DIR/$GAME_APP_NAME" ]]; then
    echo "ERROR: $GAME_APP_NAME not found after extraction."
    ls -la "$EMBED_DIR"
    exit 1
fi

# Make the game binary executable (in case zip permissions are off)
chmod +x "$EMBED_DIR/$GAME_APP_NAME/Contents/MacOS/Megabonk Clone" || true

SIZE=$(du -sh "$EMBED_DIR/$GAME_APP_NAME" | cut -f1)
echo "==> Done. Embedded game size: $SIZE"
