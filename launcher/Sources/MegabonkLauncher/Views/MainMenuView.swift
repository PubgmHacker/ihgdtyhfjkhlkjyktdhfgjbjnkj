import SwiftUI

struct MainMenuView: View {
    @EnvironmentObject var gameLauncher: GameLauncher
    @EnvironmentObject var settingsStore: SettingsStore
    @Binding var isHoveringPlay: Bool

    @State private var showGlow = false
    @State private var logoScale: CGFloat = 0.8
    @State private var contentOpacity: Double = 0

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Title area with logo
            VStack(spacing: 16) {
                // Game icon
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.accentRed.opacity(0.3),
                                    Color.accentRed.opacity(0.05),
                                ],
                                center: .center,
                                startRadius: 20,
                                endRadius: 60
                            )
                        )
                        .frame(width: 120, height: 120)
                        .blur(radius: 20)

                    Image(systemName: "gamecontroller.fill")
                        .font(.system(size: 52))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.accentRed, Color.accentYellow],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                .scaleEffect(logoScale)

                Text("MEGABONK")
                    .font(.system(size: 42, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                    .shadow(color: Color.accentRed.opacity(0.6), radius: 10, x: 0, y: 2)
                    .tracking(3)

                Text("CLONE")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundColor(Color.accentYellow)
                    .tracking(12)
                    .shadow(color: Color.accentYellow.opacity(0.4), radius: 8, x: 0, y: 2)

                Text("v0.1.0")
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.3))
                    .padding(.top, 4)
            }

            Spacer()
                .frame(height: 40)

            // Play button
            PlayButtonView(isGameRunning: gameLauncher.isGameRunning) {
                let settings = GameSettings(
                    width: settingsStore.resolution.width,
                    height: settingsStore.resolution.height,
                    fullscreen: settingsStore.fullscreen
                )
                gameLauncher.launch(settings: settings)
            }

            Spacer()
                .frame(height: 24)

            // Status / error display
            if let error = gameLauncher.launchError {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text(error.errorDescription ?? "Неизвестная ошибка")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.red.opacity(0.15)))
            }

            if !gameLauncher.hasGame {
                HStack(spacing: 8) {
                    Image(systemName: "questionmark.folder.fill")
                        .foregroundColor(Color.accentYellow)
                    Text("Игра не найдена. Убедитесь что Megabonk Clone.app встроена в launcher.")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.5))
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.accentYellow.opacity(0.1)))
            }

            Spacer()

            // Bottom info bar
            bottomInfoBar
        }
        .opacity(contentOpacity)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.75)) {
                logoScale = 1.0
                contentOpacity = 1.0
            }
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                showGlow.toggle()
            }
        }
    }

    private var bottomInfoBar: some View {
        HStack(spacing: 24) {
            Label("Godot 4.7 + C#", systemImage: "chevron.left.forwardslash.chevron.right")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.25))

            Label("macOS", systemImage: "desktopcomputer")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.25))

            if gameLauncher.isGameRunning {
                Label("Игра запущена", systemImage: "circle.fill")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(Color.green.opacity(0.5))
                    .symbolRenderingMode(.multicolor)
            }
        }
        .padding(.bottom, 16)
    }
}
