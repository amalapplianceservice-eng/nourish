import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

enum Theme {
    static let protein = Color(red: 0.96, green: 0.39, blue: 0.45)
    static let carbs = Color(red: 0.99, green: 0.67, blue: 0.22)
    static let fat = Color(red: 0.36, green: 0.53, blue: 0.98)
    static let over = Color(red: 0.95, green: 0.33, blue: 0.30)

    static let ringGradient = AngularGradient(
        colors: [Color.accentColor.opacity(0.75), Color.accentColor, Color(red: 0.13, green: 0.80, blue: 0.75), Color.accentColor.opacity(0.75)],
        center: .center
    )

    static let aiGradient = LinearGradient(
        colors: [Color(red: 0.55, green: 0.36, blue: 0.96), Color(red: 0.93, green: 0.36, blue: 0.62)],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    #if canImport(UIKit)
    static let background = Color(uiColor: .systemGroupedBackground)
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    static let fieldBackground = Color(uiColor: .tertiarySystemFill)
    #else
    static let background = Color(nsColor: .windowBackgroundColor)
    static let card = Color(nsColor: .controlBackgroundColor)
    static let fieldBackground = Color(nsColor: .quaternaryLabelColor)
    #endif
}

struct CardModifier: ViewModifier {
    var padding: CGFloat = 16
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

extension View {
    func card(padding: CGFloat = 16) -> some View { modifier(CardModifier(padding: padding)) }

    /// iOS-only modifiers wrapped so the code also typechecks on macOS.
    @ViewBuilder func inlineNavigationTitle() -> some View {
        #if os(iOS)
        navigationBarTitleDisplayMode(.inline)
        #else
        self
        #endif
    }

    @ViewBuilder func insetGroupedList() -> some View {
        #if os(iOS)
        listStyle(.insetGrouped)
        #else
        listStyle(.inset)
        #endif
    }

    @ViewBuilder func decimalKeyboard() -> some View {
        #if os(iOS)
        keyboardType(.decimalPad)
        #else
        self
        #endif
    }

    @ViewBuilder func numberKeyboard() -> some View {
        #if os(iOS)
        keyboardType(.numberPad)
        #else
        self
        #endif
    }
}

/// Primary call-to-action button style used across the app.
struct PrimaryButtonStyle: ButtonStyle {
    var background: AnyShapeStyle = AnyShapeStyle(Color.accentColor)

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.snappy(duration: 0.2), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
    static var ai: PrimaryButtonStyle { PrimaryButtonStyle(background: AnyShapeStyle(Theme.aiGradient)) }
}
