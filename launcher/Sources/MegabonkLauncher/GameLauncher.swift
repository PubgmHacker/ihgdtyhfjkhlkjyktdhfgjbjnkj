import Foundation
import AppKit

// MARK: - Game Launcher Service

/// Protocol for launching the game — can be replaced with Steam API later
protocol GameLaunching {
    func launchGame(settings: GameSettings) -> Result<Void, LaunchError>
    func gameIsRunning() -> Bool
    func stopGame()
}

enum LaunchError: LocalizedError {
    case gameNotFound(String)
    case launchFailed(String)
    case alreadyRunning

    var errorDescription: String? {
        switch self {
        case .gameNotFound(let path):
            return "Игра не найдена: \(path)"
        case .launchFailed(let reason):
            return "Не удалось запустить игру: \(reason)"
        case .alreadyRunning:
            return "Игра уже запущена"
        }
    }
}

struct GameSettings {
    let width: Int
    let height: Int
    let fullscreen: Bool

    var godotArguments: [String] {
        var args: [String] = []
        args += ["--width", "\(width)"]
        args += ["--height", "\(height)"]
        if fullscreen {
            args += ["--fullscreen"]
        }
        return args
    }
}

@MainActor
final class GameLauncher: ObservableObject {
    @Published var isGameRunning = false
    @Published var launchError: LaunchError?
    @Published var gamePath: URL?

    private var gameProcess: Process?

    init() {
        resolveGamePath()
    }

    /// Locate the embedded game bundle
    private func resolveGamePath() {
        // When running from .app bundle: search in Resources/Game/
        if let bundlePath = Bundle.main.resourceURL?.appendingPathComponent("Game") {
            let gameApp = bundlePath.appendingPathComponent("Megabonk Clone.app")
            if FileManager.default.fileExists(atPath: gameApp.path) {
                gamePath = gameApp
                return
            }
        }

        // Fallback: search next to the launcher binary (development mode)
        let devPaths = [
            URL(fileURLWithPath: "GameEmbed/Megabonk Clone.app"),
            URL(fileURLWithPath: "../GameEmbed/Megabonk Clone.app"),
        ]

        for path in devPaths {
            if FileManager.default.fileExists(atPath: path.path) {
                gamePath = path
                return
            }
        }

        // Last resort: check builds/extracted_test
        let buildPath = URL(fileURLWithPath: #file)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("builds")
            .appendingPathComponent("extracted_test")
            .appendingPathComponent("Megabonk Clone.app")

        if FileManager.default.fileExists(atPath: buildPath.path) {
            gamePath = buildPath
        }
    }

    /// Launch the game with given settings
    func launch(settings: GameSettings) {
        guard !isGameRunning else {
            launchError = .alreadyRunning
            return
        }

        guard let gameURL = gamePath else {
            launchError = .gameNotFound("Megabonk Clone.app")
            return
        }

        launchError = nil

        do {
            let process = Process()
            process.executableURL = gameURL.appendingPathComponent("Contents/MacOS/Megabonk Clone")
            process.arguments = settings.godotArguments
            process.currentDirectoryURL = gameURL.deletingLastPathComponent()

            // Capture output for debugging
            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = pipe

            try process.run()
            gameProcess = process
            isGameRunning = true

            // Monitor process exit
            DispatchQueue.global(qos: .userInitiated).async {
                process.waitUntilExit()
                DispatchQueue.main.async { [weak self] in
                    self?.isGameRunning = false
                    self?.gameProcess = nil
                }
            }
        } catch {
            launchError = .launchFailed(error.localizedDescription)
        }
    }

    /// Stop the running game process
    func stopGame() {
        guard let process = gameProcess, process.isRunning else { return }
        process.terminate()
        gameProcess = nil
        isGameRunning = false
    }

    /// Check if game path is available
    var hasGame: Bool {
        gamePath != nil && FileManager.default.fileExists(atPath: gamePath!.path)
    }
}
