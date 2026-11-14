import SwiftUI
import SwiftData

@main
struct NourishApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .fontDesign(.rounded)
        }
        .modelContainer(for: [FoodEntry.self, CustomFood.self])
    }
}

/// Shows onboarding the first time, then the main tab interface.
struct RootView: View {
    @AppStorage(GoalKeys.hasOnboarded) private var hasOnboarded = false

    var body: some View {
        Group {
            if hasOnboarded {
                MainTabView()
                    .transition(.opacity)
            } else {
                OnboardingView {
                    withAnimation(.smooth) { hasOnboarded = true }
                }
                .transition(.opacity)
            }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("Diary", systemImage: "fork.knife") }
            ProgressScreen()
                .tabItem { Label("Progress", systemImage: "chart.bar.xaxis") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}
