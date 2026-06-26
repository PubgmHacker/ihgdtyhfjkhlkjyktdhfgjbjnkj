import SwiftUI

struct BackgroundView: View {
    @State private var animateGlow = false

    var body: some View {
        ZStack {
            // Base dark gradient
            LinearGradient(
                colors: [
                    Color(red: 0.21, green: 0.24, blue: 0.32),  // #363d52
                    Color(red: 0.13, green: 0.15, blue: 0.20),  // #212532
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Animated ambient glow orbs
            ZStack {
                ambientOrb(
                    color: Color.accentRed,
                    size: 300,
                    offset: CGSize(width: -100, height: -80),
                    duration: 5.0
                )
                ambientOrb(
                    color: Color.accentYellow,
                    size: 250,
                    offset: CGSize(width: 150, height: 120),
                    duration: 6.5
                )
                ambientOrb(
                    color: Color(red: 0.2, green: 0.4, blue: 0.8),
                    size: 200,
                    offset: CGSize(width: -50, height: 200),
                    duration: 4.5
                )
            }
            .allowsHitTesting(false)

            // Subtle grid pattern overlay
            gridOverlay

            // Floating particles
            FloatingParticles()
                .allowsHitTesting(false)
        }
    }

    // MARK: - Ambient Orb

    private func ambientOrb(color: Color, size: CGFloat, offset: CGSize, duration: Double) -> some View {
        Circle()
            .fill(
                RadialGradient(
                    colors: [
                        color.opacity(0.15),
                        color.opacity(0.05),
                        Color.clear,
                    ],
                    center: .center,
                    startRadius: 0,
                    endRadius: size / 2
                )
            )
            .frame(width: size, height: size)
            .blur(radius: 40)
            .offset(offset)
            .scaleEffect(animateGlow ? 1.15 : 0.9)
            .animation(
                .easeInOut(duration: duration)
                    .repeatForever(autoreverses: true),
                value: animateGlow
            )
    }

    // MARK: - Grid Overlay

    private var gridOverlay: some View {
        Canvas { context, size in
            let spacing: CGFloat = 50
            var gridPath = Path()

            // Vertical lines
            var x: CGFloat = 0
            while x < size.width {
                gridPath.move(to: CGPoint(x: x, y: 0))
                gridPath.addLine(to: CGPoint(x: x, y: size.height))
                x += spacing
            }

            // Horizontal lines
            var y: CGFloat = 0
            while y < size.height {
                gridPath.move(to: CGPoint(x: 0, y: y))
                gridPath.addLine(to: CGPoint(x: size.width, y: y))
                y += spacing
            }

            context.opacity = 0.03
            context.stroke(
                gridPath,
                with: .color(.white),
                style: StrokeStyle(lineWidth: 0.5)
            )
        }
        .ignoresSafeArea()
    }
}

// MARK: - Floating Particles

struct FloatingParticles: View {
    @State private var particles: [Particle] = []

    struct Particle: Identifiable {
        let id = UUID()
        let x: CGFloat          // 0...1 (fraction of width)
        let startY: CGFloat     // 0...1 (fraction of height)
        let size: CGFloat
        let speed: Double       // pixels per second downward
        let opacity: Double
        let color: Color
    }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            Canvas { context, size in
                let t = timeline.date.timeIntervalSinceReferenceDate
                for particle in particles {
                    // Drift downward, wrap around height
                    let drift = CGFloat(t * particle.speed)
                    let wrapped = (particle.startY * size.height + drift).truncatingRemainder(dividingBy: size.height + 40)
                    let px = particle.x * size.width

                    context.opacity = particle.opacity
                    context.fill(
                        Circle().path(in: CGRect(
                            x: px - particle.size / 2,
                            y: wrapped - particle.size / 2,
                            width: particle.size,
                            height: particle.size
                        )),
                        with: .color(particle.color)
                    )
                }
            }
        }
        .onAppear {
            generateParticles()
        }
    }

    private func generateParticles() {
        let colors: [Color] = [
            Color.accentRed,
            Color.accentYellow,
            Color.white,
        ]

        particles = (0..<30).map { _ in
            Particle(
                x: CGFloat.random(in: 0...1),
                startY: CGFloat.random(in: 0...1),
                size: CGFloat.random(in: 1...3),
                speed: Double.random(in: 5...15),
                opacity: Double.random(in: 0.1...0.3),
                color: colors.randomElement()!
            )
        }
    }
}
