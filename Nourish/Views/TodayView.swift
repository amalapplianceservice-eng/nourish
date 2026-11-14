import SwiftUI
import SwiftData

private struct AddContext: Identifiable {
    let id = UUID()
    let meal: MealType
}

struct TodayView: View {
    @State private var selectedDay = Calendar.current.startOfDay(for: .now)
    @State private var addContext: AddContext?
    @State private var editingEntry: FoodEntry?

    private var isToday: Bool { Calendar.current.isDateInToday(selectedDay) }

    private var title: String {
        let cal = Calendar.current
        if cal.isDateInToday(selectedDay) { return "Today" }
        if cal.isDateInYesterday(selectedDay) { return "Yesterday" }
        if cal.isDateInTomorrow(selectedDay) { return "Tomorrow" }
        return selectedDay.formatted(.dateTime.weekday(.wide).month().day())
    }

    var body: some View {
        NavigationStack {
            DiaryList(day: selectedDay,
                      selectedDay: $selectedDay,
                      onAdd: { addContext = AddContext(meal: $0) },
                      onEdit: { editingEntry = $0 })
                .overlay(alignment: .bottomTrailing) {
                    Button {
                        addContext = AddContext(meal: isToday ? .suggested() : .snacks)
                    } label: {
                        Image(systemName: "plus")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                            .frame(width: 60, height: 60)
                            .background(Color.accentColor, in: Circle())
                            .shadow(color: Color.accentColor.opacity(0.4), radius: 12, y: 6)
                    }
                    .padding(.trailing, 20)
                    .padding(.bottom, 16)
                    .accessibilityLabel("Add food")
                }
                .navigationTitle(title)
                .toolbar {
                    if !isToday {
                        ToolbarItem(placement: .primaryAction) {
                            Button("Today") {
                                withAnimation(.smooth) { selectedDay = Calendar.current.startOfDay(for: .now) }
                            }
                        }
                    }
                }
                .sheet(item: $addContext) { ctx in
                    AddFoodView(day: selectedDay, initialMeal: ctx.meal)
                }
                .sheet(item: $editingEntry) { entry in
                    NavigationStack {
                        FoodDetailView(mode: .edit(entry))
                    }
                    .presentationDetents([.large])
                }
        }
    }
}

// MARK: - Diary list (entries for one day)

private struct DiaryList: View {
    @Environment(\.modelContext) private var context
    @Query private var entries: [FoodEntry]
    @Binding var selectedDay: Date
    var onAdd: (MealType) -> Void
    var onEdit: (FoodEntry) -> Void

    @AppStorage(GoalKeys.calories) private var goalCalories = 2000
    @AppStorage(GoalKeys.protein) private var goalProtein = 140
    @AppStorage(GoalKeys.carbs) private var goalCarbs = 220
    @AppStorage(GoalKeys.fat) private var goalFat = 65

    init(day: Date, selectedDay: Binding<Date>, onAdd: @escaping (MealType) -> Void, onEdit: @escaping (FoodEntry) -> Void) {
        let start = Calendar.current.startOfDay(for: day)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start) ?? start
        _entries = Query(filter: #Predicate<FoodEntry> { $0.day >= start && $0.day < end },
                         sort: \FoodEntry.createdAt)
        _selectedDay = selectedDay
        self.onAdd = onAdd
        self.onEdit = onEdit
    }

    private var total: Nutrition { entries.reduce(.zero) { $0 + $1.nutrition } }

    var body: some View {
        List {
            Section {
                WeekStrip(selectedDay: $selectedDay)
                    .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 8, trailing: 0))
                    .listRowBackground(Color.clear)

                summaryCard
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
            }
            .listSectionSeparator(.hidden)

            ForEach(MealType.allCases) { meal in
                let mealEntries = entries.filter { $0.meal == meal }
                Section {
                    ForEach(mealEntries) { entry in
                        EntryRow(entry: entry)
                            .contentShape(Rectangle())
                            .onTapGesture { onEdit(entry) }
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    withAnimation { context.delete(entry) }
                                } label: { Label("Delete", systemImage: "trash") }
                            }
                            .swipeActions(edge: .leading) {
                                Button {
                                    duplicate(entry)
                                } label: { Label("Again", systemImage: "plus.square.on.square") }
                                .tint(.accentColor)
                            }
                    }
                    Button {
                        onAdd(meal)
                    } label: {
                        Label("Add food", systemImage: "plus.circle.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.accentColor)
                    }
                } header: {
                    MealHeader(meal: meal, calories: mealEntries.reduce(0) { $0 + $1.calories })
                }
            }

            Color.clear.frame(height: 60)
                .listRowBackground(Color.clear)
        }
        .insetGroupedList()
        .scrollContentBackground(.hidden)
        .background(Theme.background)
    }

    private var summaryCard: some View {
        VStack(spacing: 20) {
            HStack(spacing: 24) {
                CalorieRing(eaten: total.calories, goal: Double(goalCalories))
                VStack(alignment: .leading, spacing: 14) {
                    statRow(icon: "flag.fill", title: "Goal", value: Double(goalCalories), color: .secondary)
                    statRow(icon: "fork.knife", title: "Eaten", value: total.calories, color: .accentColor)
                    statRow(icon: "flame.fill", title: "Remaining", value: max(0, Double(goalCalories) - total.calories), color: .orange)
                }
                Spacer(minLength: 0)
            }
            HStack(spacing: 16) {
                MacroBar(title: "Protein", value: total.protein, goal: Double(goalProtein), color: Theme.protein)
                MacroBar(title: "Carbs", value: total.carbs, goal: Double(goalCarbs), color: Theme.carbs)
                MacroBar(title: "Fat", value: total.fat, goal: Double(goalFat), color: Theme.fat)
            }
        }
        .card(padding: 20)
    }

    private func statRow(icon: String, title: String, value: Double, color: Color) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.caption.weight(.bold))
                .foregroundStyle(color)
                .frame(width: 26, height: 26)
                .background(color.opacity(0.14), in: Circle())
            VStack(alignment: .leading, spacing: 0) {
                Text(title).font(.caption).foregroundStyle(.secondary)
                Text(value.kcal)
                    .font(.headline)
                    .monospacedDigit()
                    .contentTransition(.numericText(value: value))
                    .animation(.smooth, value: value)
            }
        }
    }

    private func duplicate(_ entry: FoodEntry) {
        let copy = FoodEntry(item: entry.asFoodItem, servings: entry.servings, loggedInGrams: entry.loggedInGrams,
                             meal: entry.meal, day: entry.day)
        withAnimation { context.insert(copy) }
    }
}

// MARK: - Pieces

private struct MealHeader: View {
    var meal: MealType
    var calories: Double

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: meal.icon)
                .font(.subheadline)
                .foregroundStyle(meal.tint)
            Text(meal.title)
                .font(.headline)
                .foregroundStyle(.primary)
            Spacer()
            if calories > 0 {
                Text("\(calories.kcal) kcal")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
        }
        .textCase(nil)
        .padding(.top, 6)
    }
}

struct EntryRow: View {
    let entry: FoodEntry

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(entry.name)
                        .font(.body.weight(.medium))
                        .lineLimit(1)
                    if entry.source == .ai {
                        Image(systemName: "sparkles")
                            .font(.caption2)
                            .foregroundStyle(Theme.aiGradient)
                    }
                }
                Text([entry.brand, entry.amountDescription].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                MacroPills(nutrition: entry.nutrition)
            }
            Spacer(minLength: 8)
            Text(entry.calories.kcal)
                .font(.headline)
                .monospacedDigit()
        }
        .padding(.vertical, 2)
    }
}

/// Horizontal week selector.
struct WeekStrip: View {
    @Binding var selectedDay: Date
    private let cal = Calendar.current

    private var days: [Date] {
        let weekStart = cal.dateInterval(of: .weekOfYear, for: selectedDay)?.start ?? selectedDay
        return (0..<7).compactMap { cal.date(byAdding: .day, value: $0, to: weekStart) }
    }

    var body: some View {
        HStack(spacing: 4) {
            shiftButton(-7, icon: "chevron.left")
            ForEach(days, id: \.self) { day in
                let selected = cal.isDate(day, inSameDayAs: selectedDay)
                let today = cal.isDateInToday(day)
                Button {
                    withAnimation(.snappy) { selectedDay = cal.startOfDay(for: day) }
                } label: {
                    VStack(spacing: 6) {
                        Text(day.formatted(.dateTime.weekday(.narrow)))
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(selected ? .white.opacity(0.85) : .secondary)
                        Text(day.formatted(.dateTime.day()))
                            .font(.callout.weight(.bold))
                            .foregroundStyle(selected ? .white : (today ? Color.accentColor : .primary))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background {
                        if selected {
                            RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.accentColor)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
            shiftButton(7, icon: "chevron.right")
        }
        .sensoryFeedback(.selection, trigger: selectedDay)
    }

    private func shiftButton(_ days: Int, icon: String) -> some View {
        Button {
            withAnimation(.snappy) {
                selectedDay = cal.date(byAdding: .day, value: days, to: selectedDay) ?? selectedDay
            }
        } label: {
            Image(systemName: icon)
                .font(.caption.weight(.bold))
                .foregroundStyle(.secondary)
                .frame(width: 22, height: 40)
        }
        .buttonStyle(.plain)
    }
}
