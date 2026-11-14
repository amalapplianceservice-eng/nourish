import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var context
    @AppStorage(GoalKeys.calories) private var goalCalories = 2000
    @AppStorage(GoalKeys.protein) private var goalProtein = 140
    @AppStorage(GoalKeys.carbs) private var goalCarbs = 220
    @AppStorage(GoalKeys.fat) private var goalFat = 65

    @Query private var customFoods: [CustomFood]

    @State private var showCalculator = false
    @State private var keyDraft = ""
    @State private var hasKey = MealEstimator.hasKey
    @State private var confirmDelete = false

    private var appVersion: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(v) (\(b))"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    goalRow("Calories", value: $goalCalories, unit: "kcal", color: .accentColor)
                    goalRow("Protein", value: $goalProtein, unit: "g", color: Theme.protein)
                    goalRow("Carbs", value: $goalCarbs, unit: "g", color: Theme.carbs)
                    goalRow("Fat", value: $goalFat, unit: "g", color: Theme.fat)
                    Button {
                        showCalculator = true
                    } label: {
                        Label("Recalculate from my profile", systemImage: "wand.and.stars")
                    }
                } header: {
                    Text("Daily goals")
                }

                Section {
                    if hasKey {
                        Label("API key saved in Keychain", systemImage: "checkmark.seal.fill")
                            .foregroundStyle(Color.accentColor)
                        Button("Remove API key", role: .destructive) {
                            KeychainStore.set(nil, for: MealEstimator.apiKeyAccount)
                            hasKey = false
                        }
                    } else {
                        SecureField("Anthropic API key (sk-ant-…)", text: $keyDraft)
                            .textContentType(.password)
                            .autocorrectionDisabled()
                        Button("Save key") {
                            KeychainStore.set(keyDraft.trimmingCharacters(in: .whitespacesAndNewlines), for: MealEstimator.apiKeyAccount)
                            keyDraft = ""
                            hasKey = MealEstimator.hasKey
                        }
                        .disabled(keyDraft.trimmingCharacters(in: .whitespaces).isEmpty)
                        Link("Get a key at console.anthropic.com",
                             destination: URL(string: "https://console.anthropic.com/settings/keys")!)
                    }
                } header: {
                    Text("AI meal estimates")
                } footer: {
                    Text("Powered by Claude. Your meal descriptions and photos are sent to Anthropic only when you tap Estimate. Each estimate typically costs about a cent.")
                }

                Section("Data") {
                    NavigationLink {
                        MyFoodsView()
                    } label: {
                        LabeledContent("My foods & meals", value: "\(customFoods.count)")
                    }
                    Button("Delete all diary entries", role: .destructive) { confirmDelete = true }
                }

                Section {
                    LabeledContent("Version", value: appVersion)
                    Link("Food data: Open Food Facts (ODbL)", destination: URL(string: "https://world.openfoodfacts.org")!)
                } header: {
                    Text("About")
                } footer: {
                    Text("Nutrition values are estimates for general wellness tracking and are not medical advice.")
                }
            }
            .navigationTitle("Settings")
            .onAppear { hasKey = MealEstimator.hasKey }
            .sheet(isPresented: $showCalculator) {
                NavigationStack {
                    GoalSetupView { showCalculator = false }
                        .navigationTitle("Goal calculator")
                        .inlineNavigationTitle()
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("Cancel") { showCalculator = false }
                            }
                        }
                }
            }
            .confirmationDialog("Delete every logged entry? This can't be undone.", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Delete all entries", role: .destructive) {
                    try? context.delete(model: FoodEntry.self)
                    try? context.save()
                }
            }
        }
    }

    private func goalRow(_ title: String, value: Binding<Int>, unit: String, color: Color) -> some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(title)
            Spacer()
            TextField("0", value: value, format: .number)
                .multilineTextAlignment(.trailing)
                .numberKeyboard()
                .frame(maxWidth: 90)
                .monospacedDigit()
            Text(unit).foregroundStyle(.secondary).frame(width: 34, alignment: .leading)
        }
    }
}

struct MyFoodsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CustomFood.createdAt, order: .reverse) private var foods: [CustomFood]

    var body: some View {
        List {
            if foods.isEmpty {
                ContentUnavailableView("No saved foods yet", systemImage: "takeoutbag.and.cup.and.straw",
                                       description: Text("Create a food or save an AI-estimated meal and it will show up here."))
            }
            ForEach(foods) { food in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(food.name).font(.body.weight(.medium))
                        Text(food.servingLabel).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        MacroPills(nutrition: food.asFoodItem.nutrition)
                    }
                    Spacer()
                    Text(food.calories.kcal).font(.headline).monospacedDigit()
                }
            }
            .onDelete { offsets in
                offsets.map { foods[$0] }.forEach(context.delete)
            }
        }
        .navigationTitle("My foods & meals")
    }
}
