import SwiftUI

// MARK: - Theme Colors
//
// Colors are defined programmatically (not via Asset Catalog) so the project
// builds reliably with Swift Package Manager without Xcode.
// Palette is derived from the game icon (icon.svg):
//   #ff5d5d red, #ffd23f yellow, #363d52 slate, #212532 dark.

extension Color {
    /// #ff5d5d — primary red accent (from game icon)
    static let accentRed = Color(red: 0.85, green: 0.22, blue: 0.22)

    /// #ffd23f — warm yellow accent (from game icon)
    static let accentYellow = Color(red: 1.0, green: 0.82, blue: 0.25)

    /// #212532 — deep background
    static let backgroundColor = Color(red: 0.13, green: 0.15, blue: 0.20)

    /// #1a1d27 — darker sidebar
    static let sidebarDark = Color(red: 0.10, green: 0.11, blue: 0.15)
}
