import AppKit
import SwiftUI

// Static design review only. Controls have no actions and never access Things.
struct Palette {
    let dark: Bool
    static let ink = Color(red: 21 / 255, green: 23 / 255, blue: 19 / 255)
    static let cream = Color(red: 252 / 255, green: 252 / 255, blue: 253 / 255)
    var background: Color { dark ? Self.ink : Self.cream }
    var foreground: Color { dark ? Self.cream : Self.ink }
}

struct SetupWindow: View {
    let ready: Bool
    let palette: Palette

    func connection(_ name: String, detail: String, connected: Bool) -> some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(name).font(.headline)
                Text(detail).font(.body)
            }
            Spacer()
            Button(connected ? "Manage…" : "Connect") {}
                .controlSize(.large)
                .accessibilityLabel("\(connected ? "Manage" : "Connect") \(name)")
        }
        .frame(minHeight: 64)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack {
                Text("THINGS MCP").font(.headline).tracking(1)
                Spacer()
                Button {} label: { Image(systemName: "gearshape") }
                    .accessibilityLabel("Settings")
            }
            VStack(alignment: .leading, spacing: 8) {
                Text(ready ? "You're connected." : "Connect your apps.")
                    .font(.largeTitle).fontWeight(.semibold)
                Text(ready ? "Your tasks are ready to use in a conversation." : "Choose where you want to use Things.")
                    .font(.body)
            }
            Label("Things is available on this Mac", systemImage: "checkmark.circle")
                .font(.body)
            VStack(spacing: 8) {
                connection("Claude Desktop", detail: ready ? "Connected · Read only" : "Install the desktop extension", connected: ready)
                connection("ChatGPT", detail: "Desktop and browser", connected: false)
            }
            VStack(alignment: .leading, spacing: 8) {
                Toggle("Allow task changes", isOn: .constant(false))
                    .toggleStyle(.checkbox).font(.headline)
                Text("Lets connected apps create, edit, schedule and complete tasks. Applies to all connections.")
                    .font(.body).fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
            HStack {
                Button("Check connection") {}.controlSize(.large)
                Spacer()
                Button(ready ? "Open Claude" : "Done") {}.controlSize(.large)
            }
        }
        .padding(24)
        .frame(width: 520, height: 550)
        .foregroundStyle(palette.foreground)
        .tint(palette.foreground)
        .background(palette.background)
        .environment(\.colorScheme, palette.dark ? .dark : .light)
    }
}

struct BrowserSetup: View {
    let palette: Palette
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack {
                Button("Back") {}.controlSize(.large)
                Spacer()
                Text("CHATGPT").font(.headline).tracking(1)
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Connect your account.").font(.largeTitle).fontWeight(.semibold)
                Text("Set up browser access once. This app keeps the connection running.")
                    .font(.body).fixedSize(horizontal: false, vertical: true)
            }
            VStack(alignment: .leading, spacing: 12) {
                Text("1. Set up access with OpenAI").font(.headline)
                Text("Enable developer mode and create a private connection for your ChatGPT workspace.")
                    .font(.body).fixedSize(horizontal: false, vertical: true)
                Button("Open account setup…") {}.controlSize(.large)
            }
            VStack(alignment: .leading, spacing: 12) {
                Text("2. Enter your connection details").font(.headline)
                TextField("Tunnel ID", text: .constant("")).textFieldStyle(.roundedBorder)
                    .accessibilityLabel("Tunnel ID from OpenAI account setup")
                SecureField("API key", text: .constant("")).textFieldStyle(.roundedBorder)
                    .accessibilityLabel("Runtime API key from OpenAI account setup")
                Text("Your key is saved in this Mac's Keychain.")
                    .font(.body)
            }
            Spacer(minLength: 0)
            HStack {
                Button("Set up later") {}.controlSize(.large)
                Spacer()
                Button("Connect and check") {}.controlSize(.large)
            }
        }
        .padding(24)
        .frame(width: 520, height: 550)
        .foregroundStyle(palette.foreground)
        .tint(palette.foreground)
        .background(palette.background)
        .environment(\.colorScheme, palette.dark ? .dark : .light)
    }
}

struct Artboard: View {
    let dark: Bool
    var palette: Palette { Palette(dark: dark) }
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Things MCP · Setup proposal").font(.largeTitle).fontWeight(.semibold)
                Text("\(dark ? "Ink" : "Cream") · Native macOS controls · Preview states, not live connections")
                    .font(.body)
            }
            HStack(alignment: .top, spacing: 32) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("1. Choose an app").font(.headline)
                    SetupWindow(ready: false, palette: palette)
                }
                VStack(alignment: .leading, spacing: 12) {
                    Text("2. ChatGPT browser access").font(.headline)
                    BrowserSetup(palette: palette)
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Install → Connect → Approve access → Test").font(.headline)
                Text("System type · Native buttons and checkbox · Read-only by default · No configuration editor")
                    .font(.body)
                Text("Both desktop and browser access are required. Browser account setup is shown explicitly above.")
                    .font(.body)
            }
        }
        .padding(32)
        .foregroundStyle(palette.foreground)
        .background(palette.background)
        .environment(\.colorScheme, dark ? .dark : .light)
    }
}

@MainActor
func render() throws {
    let output = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Downloads/Things-MCP-setup-artboards", isDirectory: true)
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    for dark in [false, true] {
        let view = NSHostingView(rootView: Artboard(dark: dark))
        let size = view.fittingSize
        view.frame = NSRect(origin: .zero, size: size)
        let window = NSWindow(contentRect: view.frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.contentView = view
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        view.layoutSubtreeIfNeeded()
        window.display()
        guard let bitmap = view.bitmapImageRepForCachingDisplay(in: view.bounds) else {
            throw NSError(domain: "Artboard", code: 1)
        }
        view.cacheDisplay(in: view.bounds, to: bitmap)
        guard let png = bitmap.representation(using: .png, properties: [:]) else {
            throw NSError(domain: "Artboard", code: 2)
        }
        let file = output.appendingPathComponent(dark ? "setup-ink.png" : "setup-cream.png")
        try png.write(to: file)
        print(file.path)
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
try MainActor.assumeIsolated { try render() }
