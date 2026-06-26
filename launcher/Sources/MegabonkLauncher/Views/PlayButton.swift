import SwiftUI

struct PlayButtonView: View {
    let isGameRunning: Bool
    let action: () -> Void

    @State private var isHovering = false
    @State private var isPressed = false
    @State private var glowPulse = false

    var body: some View {
        Button(action: {
            isPressed = true
            withAnimation(.easeOut(duration: 0.15)) {
                isPressed = false
            }
            action()
        }) {
            HStack(spacing: 14) {
                ZStack {
                    // Animated ring
                    Circle()
                        .trim(from: 0, to: glowPulse ? 1 : 0.85)
                        .stroke(
                            AngularGradient(
                                colors: [
                                    Color.accentRed.opacity(0.8),
                                    Color.accentYellow.opacity(0.8),
                                    Color.accentRed.opacity(0.8),
                                ],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 2)
                        )
                        .frame(width: 48, height: 48)
                        .rotationEffect(.degrees(glowPulse ? 360 : 0))

                    Image(systemName: isGameRunning ? "stop.fill" : "play.fill")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                        .offset(x: isGameRunning ? 0 : 2)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(isGameRunning ? "ЗАПУЩЕНО" : "ИГРАТЬ")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .tracking(2)

                    Text(isGameRunning ? "Megabonk Clone работает" : "Запустить Megabonk Clone")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
            .padding(.horizontal, 36)
            .padding(.vertical, 18)
            .background(
                ZStack {
                    // Glow effect behind button
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.accentRed,
                                    Color.accentRed.opacity(0.7),
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .blur(radius: isHovering ? 30 : 15)
                        .opacity(isHovering ? 0.6 : 0.3)
                        .scaleEffect(isPressed ? 0.95 : 1.0)

                    // Main button background
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: isGameRunning
                                    ? [Color.gray.opacity(0.8), Color.gray.opacity(0.6)]
                                    : [
                                        Color(red: 0.85, green: 0.22, blue: 0.22),
                                        Color(red: 0.65, green: 0.12, blue: 0.12),
                                    ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .scaleEffect(isPressed ? 0.97 : (isHovering ? 1.03 : 1.0))

                    // Inner shine
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [
                                    .white.opacity(0.15),
                                    .white.opacity(0.0),
                                ],
                                startPoint: .top,
                                endPoint: .center
                            )
                        )
                        .scaleEffect(isPressed ? 0.97 : (isHovering ? 1.03 : 1.0))

                    // Border
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(
                            LinearGradient(
                                colors: [
                                    .white.opacity(isHovering ? 0.3 : 0.15),
                                    .white.opacity(0.05),
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                        .scaleEffect(isPressed ? 0.97 : (isHovering ? 1.03 : 1.0))
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            withAnimation(.easeOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: false)) {
                glowPulse.toggle()
            }
        }
        .disabled(isGameRunning)
    }
}

// MARK: - Cursor Helper

extension View {
    /// Show a pointing hand cursor on hover.
    func pointingHandCursor() -> some View {
        onHover { hovering in
            if hovering {
                NSCursor.pointingHand.push()
            } else {
                NSCursor.pop()
            }
        }
    }
}
