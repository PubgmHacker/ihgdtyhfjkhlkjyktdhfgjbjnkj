#!/usr/bin/env bash
#
# create_app_bundle.sh — Package the compiled launcher binary into a macOS .app bundle
#                         with the embedded game and ad-hoc code signature.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCHER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$LAUNCHER_DIR")"

APP_NAME="Megabonk Launcher"
APP_DIR="${LAUNCHER_DIR}/build/${APP_NAME}.app"
BIN_NAME="MegabonkLauncher"
BUILD_BIN="${LAUNCHER_DIR}/.build/release/${BIN_NAME}"

# ── 1. Verify binary exists ──────────────────────────────────────────────────
if [[ ! -f "$BUILD_BIN" ]]; then
    echo "ERROR: Binary not found at $BUILD_BIN"
    echo "       Run 'swift build -c release' first."
    exit 1
fi

# ── 2. Recreate .app bundle structure ────────────────────────────────────────
echo "==> Creating .app bundle: $APP_DIR"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Copy binary
cp "$BUILD_BIN" "$APP_DIR/Contents/MacOS/MegabonkLauncher"
chmod +x "$APP_DIR/Contents/MacOS/MegabonkLauncher"

# ── 3. Info.plist ────────────────────────────────────────────────────────────
cat > "$APP_DIR/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Megabonk Launcher</string>
    <key>CFBundleDisplayName</key>
    <string>Megabonk Launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.megabonk.launcher</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>0.1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>MegabonkLauncher</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.games</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
</dict>
</plist>
PLIST

# PkgInfo
echo -n "APPL????" > "$APP_DIR/Contents/PkgInfo"

# ── 4. Icon ──────────────────────────────────────────────────────────────────
ICON_SRC="${LAUNCHER_DIR}/Resources/icon.icns"
if [[ -f "$ICON_SRC" ]]; then
    cp "$ICON_SRC" "$APP_DIR/Contents/Resources/icon.icns"
    echo "==> Copied icon"
else
    echo "==> No icon.icns found at $ICON_SRC (skipping)"
fi

# ── 5. Embed the game ───────────────────────────────────────────────────────
GAME_EMBED="${LAUNCHER_DIR}/GameEmbed/Megabonk Clone.app"
if [[ -d "$GAME_EMBED" ]]; then
    echo "==> Embedding game into Resources/Game/..."
    mkdir -p "$APP_DIR/Contents/Resources/Game"
    cp -R "$GAME_EMBED" "$APP_DIR/Contents/Resources/Game/"
    echo "    Game embedded ($(du -sh "$APP_DIR/Contents/Resources/Game" | cut -f1))"
else
    echo "==> WARNING: Game not embedded. Run scripts/embed_game.sh first."
    echo "    Launcher will report 'game not found' at runtime."
fi

# ── 6. Ad-hoc code signature ────────────────────────────────────────────────
echo "==> Code signing (ad-hoc)..."
codesign --force --deep --sign - "$APP_DIR" 2>/dev/null || {
    echo "    WARNING: codesign failed (continuing). Game may be blocked by Gatekeeper."
    echo "    Run manually: xattr -dr com.apple.quarantine \"$APP_DIR\""
}

TOTAL_SIZE=$(du -sh "$APP_DIR" | cut -f1)
echo ""
echo "==> ✓ Launcher built: $APP_DIR"
echo "    Total size: $TOTAL_SIZE"
echo ""
echo "Run with: open \"$APP_DIR\""
