// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "MegabonkLauncher",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(
            name: "MegabonkLauncher",
            targets: ["MegabonkLauncher"]
        ),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "MegabonkLauncher",
            path: "Sources/MegabonkLauncher"
        ),
    ]
)
