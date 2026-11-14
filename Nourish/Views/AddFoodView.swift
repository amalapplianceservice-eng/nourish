import SwiftUI
import SwiftData

struct AddFoodView: View {
    let day: Date
    @State private var meal: MealType
    @State private var tab: Tab = .search
    @Environment(\.dismiss) private var dismiss

    enum Tab: String, CaseIterable, Identifiable {
        case search = "Search", ai = "AI Meal", create = "Create"
        var id: String { rawValue }
    }

    init(day: Date, initialMeal: MealType) {
        self.day = day
        _meal = State(initialValue: initialMeal)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Mode", selection: $tab) {
                    ForEach(Tab.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.vertical, 8)

                Group {
                    switch tab {
                    case .search: FoodSearchView(day: day, meal: meal, onLogged: { dismiss() })
                    case .ai: AIMealView(day: day, meal: meal, onLogged: { dismiss() })
                    case .create: CreateFoodView(day: day, meal: meal, onLogged: { dismiss() })
                    }
                }
                .frame(maxHeight: .infinity)
            }
            .background(Theme.background)
            .inlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .principal) {
                    Menu {
                        Picker("Meal", selection: $meal) {
                            ForEach(MealType.allCases) { m in
                                Label(m.title, systemImage: m.icon).tag(m)
                            }
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: meal.icon).foregroundStyle(meal.tint)
                            Text(meal.title).font(.headline).foregroundStyle(.primary)
                            Image(systemName: "chevron.down")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Search

struct FoodSearchView: View {
    let day: Date
    let meal: MealType
    let onLogged: () -> Void

    @Environment(\.modelContext) private var context
    @Query(sort: \CustomFood.createdAt, order: .reverse) private var customFoods: [CustomFood]
    @Query(FoodSearchView.recentDescriptor) private var recentEntries: [FoodEntry]

    @State private var query = ""
    @State private var online: [FoodItem] = []
    @State private var isLoadingOnline = false
    @State private var onlineFailed = false
    @State private var justAdded: Set<String> = []
    @FocusState private var searchFocused: Bool

    static var recentDescriptor: FetchDescriptor<FoodEntry> {
        var d = FetchDescriptor<FoodEntry>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        d.fetchLimit = 100
        return d
    }

    private var trimmedQuery: String { query.trimmingCharacters(in: .whitespacesAndNewlines) }

    private var recentItems: [FoodItem] {
        var seen = Set<String>()
        return recentEntries
            .filter { seen.insert($0.name.lowercased() + $0.servingLabel).inserted }
            .prefix(15)
            .map(\.asFoodItem)
    }

    private var myMatches: [FoodItem] {
        let q = trimmedQuery.lowercased()
        return customFoods.filter { $0.name.lowercased().contains(q) }.map(\.asFoodItem)
    }

    var body: some View {
        VStack(spacing: 0) {
            searchField
            List {
                if trimmedQuery.isEmpty {
                    emptyStateSections
                } else {
                    resultSections
                }
            }
            .insetGroupedList()
            .scrollContentBackground(.hidden)
            .scrollDismissesKeyboard(.immediately)
        }
        .navigationDestination(for: FoodItem.self) { item in
            FoodDetailView(mode: .add(item, day: day, meal: meal), onDone: onLogged)
        }
        .task(id: trimmedQuery) { await searchOnline() }
        .sensoryFeedback(.success, trigger: justAdded.count)
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search foods & brands", text: $query)
                .focused($searchFocused)
                .autocorrectionDisabled()
                .submitLabel(.search)
            if !query.isEmpty {
                Button { query = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .padding(.horizontal)
        .padding(.bottom, 4)
    }

    @ViewBuilder private var emptyStateSections: some View {
        if !recentItems.isEmpty {
            Section("Recent") { ForEach(recentItems) { row($0) } }
        }
        if !customFoods.isEmpty {
            Section("My foods & meals") { ForEach(customFoods.prefix(10).map(\.asFoodItem)) { row($0) } }
        }
        Section("Popular") {
            ForEach(FoodDatabase.popular.compactMap { name in FoodDatabase.all.first { $0.name == name } }) { row($0) }
        }
    }

    @ViewBuilder private var resultSections: some View {
        let local = FoodDatabase.search(trimmedQuery)
        if !myMatches.isEmpty {
            Section("My foods & meals") { ForEach(myMatches) { row($0) } }
        }
        if !local.isEmpty {
            Section("Common foods") { ForEach(local) { row($0) } }
        }
        Section {
            if isLoadingOnline && online.isEmpty {
                HStack(spacing: 10) {
                    ProgressView()
                    Text("Searching 3M+ products…").foregroundStyle(.secondary)
                }
            } else if onlineFailed && online.isEmpty {
                Label("Couldn't reach the online database.", systemImage: "wifi.exclamationmark")
                    .foregroundStyle(.secondary)
            } else if online.isEmpty {
                Text("No branded matches. Try the AI Meal tab — just describe it.")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(online) { row($0) }
            }
        } header: {
            Text("Brands & packaged")
        } footer: {
            Text("Product data from Open Food Facts (ODbL).")
        }
    }

    private func row(_ item: FoodItem) -> some View {
        NavigationLink(value: item) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                    Text([item.brand, item.servingLabel].compactMap { $0 }.joined(separator: " · "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 0) {
                    Text(item.calories.kcal).font(.headline).monospacedDigit()
                    Text("kcal").font(.caption2).foregroundStyle(.secondary)
                }
                Button {
                    quickAdd(item)
                } label: {
                    Image(systemName: justAdded.contains(item.id) ? "checkmark.circle.fill" : "plus.circle.fill")
                        .font(.title2)
                        .foregroundStyle(Color.accentColor)
                        .contentTransition(.symbolEffect(.replace))
                }
                .buttonStyle(.borderless)
                .accessibilityLabel("Quick add one serving")
            }
        }
    }

    private func quickAdd(_ item: FoodItem) {
        context.insert(FoodEntry(item: item, servings: 1, loggedInGrams: false, meal: meal, day: day))
        withAnimation { _ = justAdded.insert(item.id) }
    }

    private func searchOnline() async {
        let q = trimmedQuery
        online = []
        onlineFailed = false
        guard q.count >= 2 else { return }
        try? await Task.sleep(for: .milliseconds(450))   // debounce typing
        guard !Task.isCancelled else { return }
        isLoadingOnline = true
        defer { isLoadingOnline = false }
        do {
            let results = try await OpenFoodFactsService.search(q)
            guard !Task.isCancelled else { return }
            online = results
        } catch {
            if !Task.isCancelled { onlineFailed = true }
        }
    }
}
