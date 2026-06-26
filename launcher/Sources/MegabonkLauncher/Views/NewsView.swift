import SwiftUI

struct NewsView: View {
    @State private var animateIn = false

    // Placeholder news items — can be replaced with a remote JSON feed later
    private let newsItems: [NewsItem] = [
        NewsItem(
            date: "26 июня 2026",
            title: "Megabonk Clone v0.1.0",
            body: "Первый релиз! 3D auto-shooter roguelike на Godot 4 + C#. Автоатака, волновая система, VFX и многое другое.",
            tag: "Релиз",
            tagColor: Color.accentRed
        ),
        NewsItem(
            date: "26 июня 2026",
            title: "Система частиц",
            body: "Реализована система частиц с пулом объектов для высокой производительности. Поддержка trailing-эффектов и прокаста.",
            tag: "Обновление",
            tagColor: Color.accentYellow
        ),
        NewsItem(
            date: "25 июня 2026",
            title: "VFX Manager",
            body: "Добавлен менеджер визуальных эффектов: Screen Shake, постпроцессинг и shader-эффекты для атмосферности.",
            tag: "WIP",
            tagColor: .blue
        ),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 32) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: "newspaper.fill")
                        .font(.system(size: 28))
                        .foregroundColor(Color.accentYellow)

                    Text("НОВОСТИ")
                        .font(.system(size: 32, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .tracking(2)

                    Text("Последние обновления и анонсы")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.4))
                }
                .padding(.top, 20)

                // News list
                ForEach(newsItems) { item in
                    NewsCard(item: item)
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

// MARK: - News Item Model

struct NewsItem: Identifiable {
    let id = UUID()
    let date: String
    let title: String
    let body: String
    let tag: String
    let tagColor: Color
}

// MARK: - News Card

struct NewsCard: View {
    let item: NewsItem

    @State private var isHovering = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Tag and date
            HStack(spacing: 12) {
                Text(item.tag.uppercased())
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundColor(item.tagColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        Capsule()
                            .fill(item.tagColor.opacity(0.15))
                    )

                Text(item.date)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.white.opacity(0.3))

                Spacer()
            }

            // Title
            Text(item.title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(.white)

            // Body
            Text(item.body)
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.5))
                .lineSpacing(4)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(isHovering ? 0.06 : 0.03))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(
                    Color.white.opacity(isHovering ? 0.12 : 0.06),
                    lineWidth: 1
                )
        )
        .onHover { hovering in
            withAnimation(.easeOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
}
