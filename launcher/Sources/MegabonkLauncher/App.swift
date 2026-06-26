import SwiftUI
import AppKit

@main
struct MegabonkLauncherApp: App {
    @StateObject private var gameLauncher = GameLauncher()
    @StateObject private var settingsStore = SettingsStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(gameLauncher)
                .environmentObject(settingsStore)
                .frame(minWidth: 900, minHeight: 600)
                .background(Color.backgroundColor)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultSize(width: 1000, height: 650)
    }
}
