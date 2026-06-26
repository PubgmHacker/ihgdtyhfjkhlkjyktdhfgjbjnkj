import SwiftUI

enum LauncherTab: String, CaseIterable {
    case play = "Играть"
    case settings = "Настройки"
    case news = "Новости"
    case quit = "Выход"

    var icon: String {
        switch self {
        case .play: return "play.fill"
        case .settings: return "gearshape.fill"
        case .news: return "newspaper.fill"
        case .quit: return "arrow.right.square"
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var gameLauncher: GameLauncher
    @State private var selectedTab: LauncherTab = .play
    @State private var isHoveringPlay = false

    var body: some View {
        ZStack {
            // Animated background
            BackgroundView()

            // Main content area
            HStack(spacing: 0) {
                // Sidebar navigation
                sidebar

                // Content area
                ZStack {
                    switch selectedTab {
                    case .play:
                        MainMenuView(isHoveringPlay: $isHoveringPlay)
                    case .settings:
                        SettingsView()
                    case .news:
                        NewsView()
                    case .quit:
                        Color.clear
                            .onAppear {
                                NSApplication.shared.terminate(nil)
                            }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    private var sidebar: some View {
        VStack(spacing: 8) {
            // Logo area
            VStack(spacing: 6) {
                Image(systemName: "gamecontroller.fill")
                    .font(.system(size: 36))
                    .foregroundColor(Color.accentRed)
                    .shadow(color: Color.accentRed.opacity(0.5), radius: 8, x: 0, y: 0)

                Text("MEGABONK")
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                    .tracking(4)

                Text("CLONE")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(Color.accentYellow)
                    .tracking(6)
            }
            .padding(.vertical, 24)
            .padding(.horizontal, 12)

            Divider()
                .background(Color.white.opacity(0.1))
                .padding(.horizontal, 16)

            // Navigation items
            VStack(spacing: 4) {
                ForEach(LauncherTab.allCases, id: \.self) { tab in
                    if tab != .quit {
                        NavigationItem(
                            title: tab.rawValue,
                            icon: tab.icon,
                            isSelected: selectedTab == tab
                        ) {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                selectedTab = tab
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 12)

            Spacer()

            // Quit button at bottom
            NavigationItem(
                title: LauncherTab.quit.rawValue,
                icon: LauncherTab.quit.icon,
                isSelected: false
            ) {
                NSApplication.shared.terminate(nil)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 16)
        }
        .frame(width: 180)
        .background(
            LinearGradient(
                colors: [
                    Color.sidebarDark.opacity(0.95),
                    Color.sidebarDark.opacity(0.85),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .overlay(
            Rectangle()
                .frame(width: 1)
                .foregroundColor(Color.white.opacity(0.08)),
            alignment: .trailing
        )
    }
}

// MARK: - Navigation Item Component

struct NavigationItem: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 15))
                    .frame(width: 24)
                Text(title)
                    .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? .white : .white.opacity(0.5))
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color.accentRed.opacity(0.2) : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.accentRed.opacity(0.4) : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
