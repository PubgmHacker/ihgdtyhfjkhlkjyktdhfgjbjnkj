import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var settingsStore: SettingsStore

    @State private var animateIn = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 32) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: "gearshape.fill")
                        .font(.system(size: 28))
                        .foregroundColor(Color.accentYellow)

                    Text("НАСТРОЙКИ")
                        .font(.system(size: 32, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .tracking(2)

                    Text("Настройте параметры графики и звука")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.4))
                }
                .padding(.top, 20)

                // Display section
                SettingsSection(title: "Экран", icon: "display") {
                    // Resolution picker
                    SettingsRow(label: "Разрешение") {
                        Picker("Разрешение", selection: $settingsStore.resolution) {
                            ForEach(GameResolution.allResolutions, id: \.self) { res in
                                Text(res.label).tag(res)
                            }
                        }
                        .pickerStyle(.menu)
                        .labelsHidden()
                    }

                    // Fullscreen toggle
                    SettingsRow(label: "Полный экран") {
                        Toggle("", isOn: $settingsStore.fullscreen)
                            .labelsHidden()
                            .toggleStyle(.switch)
                            .tint(Color.accentRed)
                    }
                }

                // Quality section
                SettingsSection(title: "Качество графики", icon: "paintbrush") {
                    SettingsRow(label: "Качество") {
                        Picker("Качество", selection: $settingsStore.quality) {
                            ForEach(RenderQuality.allCases, id: \.rawValue) { quality in
                                HStack {
                                    Text(quality.label)
                                    Spacer()
                                    Text(quality.description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .tag(quality)
                            }
                        }
                        .pickerStyle(.menu)
                        .labelsHidden()
                    }
                }

                // Audio section
                SettingsSection(title: "Звук", icon: "speaker.wave.2.fill") {
                    SettingsRow(label: "Музыка") {
                        VStack(alignment: .trailing) {
                            Slider(value: $settingsStore.musicVolume, in: 0...1)
                                .frame(width: 200)
                            Text("\(Int(settingsStore.musicVolume * 100))%")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.white.opacity(0.4))
                        }
                    }

                    SettingsRow(label: "Эффекты") {
                        VStack(alignment: .trailing) {
                            Slider(value: $settingsStore.sfxVolume, in: 0...1)
                                .frame(width: 200)
                            Text("\(Int(settingsStore.sfxVolume * 100))%")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.white.opacity(0.4))
                        }
                    }
                }

                Spacer(minLength: 40)
            }
            .padding(.horizontal, 40)
        }
        .opacity(animateIn ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.1)) {
                animateIn = true
            }
        }
    }
}

// MARK: - Settings Section

struct SettingsSection<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color.accentRed)

                Text(title.uppercased())
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(.white.opacity(0.6))
                    .tracking(1.5)
            }

            VStack(spacing: 0) {
                content
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.04))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
            )
        }
    }
}

// MARK: - Settings Row

struct SettingsRow<Content: View>: View {
    let label: String
    @ViewBuilder let content: Content

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.7))

            Spacer()

            content
        }
        .padding(.vertical, 4)
    }
}
