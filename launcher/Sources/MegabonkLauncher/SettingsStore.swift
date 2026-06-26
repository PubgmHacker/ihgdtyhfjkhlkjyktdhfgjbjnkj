import SwiftUI

// MARK: - Settings Store

/// Stores all launcher settings. Uses UserDefaults — can be migrated to Steam Cloud later.
@MainActor
final class SettingsStore: ObservableObject {
    @Published var resolution: GameResolution {
        didSet { save() }
    }
    @Published var fullscreen: Bool {
        didSet { save() }
    }
    @Published var quality: RenderQuality {
        didSet { save() }
    }
    @Published var musicVolume: Double {
        didSet { save() }
    }
    @Published var sfxVolume: Double {
        didSet { save() }
    }

    init() {
        let defaults = UserDefaults.standard

        let savedWidth = defaults.integer(forKey: "resolution_width")
        let savedHeight = defaults.integer(forKey: "resolution_height")

        if savedWidth > 0 && savedHeight > 0 {
            self.resolution = GameResolution(
                width: savedWidth,
                height: savedHeight,
                label: "\(savedWidth)×\(savedHeight)"
            )
        } else {
            self.resolution = .hd720
        }

        self.fullscreen = defaults.bool(forKey: "fullscreen")

        let savedQuality = defaults.integer(forKey: "render_quality")
        self.quality = RenderQuality(rawValue: savedQuality) ?? .high

        // Read volumes, defaulting if unset
        var music = defaults.double(forKey: "music_volume")
        if music == 0 { music = 0.8 }
        self.musicVolume = music

        var sfx = defaults.double(forKey: "sfx_volume")
        if sfx == 0 { sfx = 1.0 }
        self.sfxVolume = sfx
    }

    func save() {
        let defaults = UserDefaults.standard
        defaults.set(resolution.width, forKey: "resolution_width")
        defaults.set(resolution.height, forKey: "resolution_height")
        defaults.set(fullscreen, forKey: "fullscreen")
        defaults.set(quality.rawValue, forKey: "render_quality")
        defaults.set(musicVolume, forKey: "music_volume")
        defaults.set(sfxVolume, forKey: "sfx_volume")
    }
}

// MARK: - Game Resolution

struct GameResolution: Equatable, Hashable {
    let width: Int
    let height: Int
    let label: String

    static let hd720 = GameResolution(width: 1280, height: 720, label: "1280×720 (HD)")
    static let hd1080 = GameResolution(width: 1920, height: 1080, label: "1920×1080 (Full HD)")
    static let hd1440 = GameResolution(width: 2560, height: 1440, label: "2560×1440 (QHD)")
    static let hd4k = GameResolution(width: 3840, height: 2160, label: "3840×2160 (4K)")

    static let allResolutions: [GameResolution] = [.hd720, .hd1080, .hd1440, .hd4k]
}

// MARK: - Render Quality

enum RenderQuality: Int, CaseIterable {
    case low = 0
    case medium = 1
    case high = 2
    case ultra = 3

    var label: String {
        switch self {
        case .low: return "Низкое"
        case .medium: return "Среднее"
        case .high: return "Высокое"
        case .ultra: return "Ультра"
        }
    }

    var description: String {
        switch self {
        case .low: return "Лучше производительность"
        case .medium: return "Баланс качества и FPS"
        case .high: return "Хорошее качество графики"
        case .ultra: return "Максимальное качество"
        }
    }
}
