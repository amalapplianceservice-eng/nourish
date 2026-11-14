import SwiftUI
import SwiftData

/// Choose an amount and meal for a food, then log it — or edit an existing entry.
struct FoodDetailView: View {
    enum Mode {
        case add(FoodItem, day: Date, meal: MealType)
        case edit(FoodEntry)
    }

    enum AmountUnit: String, CaseIterable, Identifiable {
        case servings = "Servings", grams = "Grams"
        var id: String { rawValue }
    }

    let mode: Mode
    var onDone: () -> Void = {}

    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    private let item: FoodItem
    @State private var amountText: String
    @State private var unit: AmountUnit
    @State private var meal: MealType
    @State private var saved = false
    @FocusState private var amountFocused: Bool

    init(mode: Mode, onDone: @escaping () -> Void = {}) {
        self.mode = mode
        self.onDone = onDone
        switch mode {
        case .add(let item, _, let meal):
            self.item = item
            _amountText = State(initialValue: "1")
            _unit = State(initialValue: .servings)
            _meal = State(initialValue: meal)
        case .edit(let entry):
            self.item = entry.asFoodItem
            if entry.loggedInGrams, let g = entry.servingGrams {
                _amountText = State(initialValue: (entry.servings * g).rounded().clean)
                _unit = State(initialValue: .grams)
            } else {
                _amountText = State(initialValue: entry.servings.clean)
                _unit = State(initialValue: .servings)
            }
            _meal = State(initialValue: entry.meal)
        }
    }

    private var isEditing: Bool { if case .edit = mode { true } else { false } }
    private var amount: Double { Double(amountText.replacingOccurrences(of: ",", with: ".")) ?? 0 }

    private var servings: Double {
        switch unit {
        case .servings: amount
        case .grams: item.servingGrams.map { amount / $0 } ?? 0
        }
    }

    private var nutrition: Nutrition { item.nutrition * servings }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                header
                nutritionCard
                amountCard
                mealCard
                if isEditing { deleteButton }
            }
            .padding()
            .padding(.bottom, 80)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.background)
        .inlineNavigationTitle()
        .safeAreaInset(edge: .bottom) {
            Button(action: save) {
                Label(isEditing ? "Save changes" : "Add to \(meal.title)",
                      systemImage: isEditing ? "checkmark" : "plus")
            }
            .buttonStyle(.primary)
            .disabled(servings <= 0)
            .padding(.horizontal)
            .padding(.bottom, 8)
            .background(.bar)
        }
        .toolbar {
            if isEditing {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            ToolbarItem(placement: .keyboard) {
                HStack { Spacer(); Button("Done") { amountFocused = false } }
            }
        }
        .sensoryFeedback(.success, trigger: saved)
    }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(item.source.label, systemImage: item.source.icon)
                .font(.caption.weight(.semibold))
                .foregroundStyle(item.source == .ai ? AnyShapeStyle(Theme.aiGradient) : AnyShapeStyle(Color.accentColor))
            Text(item.name)
                .font(.title2.weight(.bold))
            if let brand = item.brand {
                Text(brand).font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 4)
    }

    private var nutritionCard: some View {
        HStack(spacing: 20) {
            ZStack {
                MacroDonut(nutrition: nutrition, lineWidth: 10)
                VStack(spacing: 0) {
                    Text(nutrition.calories.kcal)
                        .font(.title2.weight(.bold))
                        .monospacedDigit()
                        .contentTransition(.numericText(value: nutrition.calories))
                        .animation(.smooth, value: nutrition.calories)
                    Text("kcal").font(.caption).foregroundStyle(.secondary)
                }
            }
            .frame(width: 104, height: 104)

            VStack(spacing: 12) {
                macroLine("Protein", nutrition.protein, Theme.protein)
                macroLine("Carbs", nutrition.carbs, Theme.carbs)
                macroLine("Fat", nutrition.fat, Theme.fat)
            }
        }
        .card(padding: 20)
    }

    private func macroLine(_ title: String, _ grams: Double, _ color: Color) -> some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(title).foregroundStyle(.secondary)
            Spacer()
            Text("\(grams.grams) g").fontWeight(.semibold).monospacedDigit()
        }
        .font(.subheadline)
    }

    private var amountCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Amount").font(.headline)

            HStack(spacing: 12) {
                TextField("0", text: $amountText)
                    .font(.title2.weight(.semibold))
                    .monospacedDigit()
                    .decimalKeyboard()
                    .focused($amountFocused)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .frame(maxWidth: 120)
                    .background(Theme.fieldBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                if item.servingGrams != nil {
                    Picker("Unit", selection: $unit) {
                        ForEach(AmountUnit.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: unit) { old, new in convert(from: old, to: new) }
                } else {
                    Text("servings").foregroundStyle(.secondary)
                    Spacer()
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(quickAmounts, id: \.self) { value in
                        let selected = amount == value
                        Button {
                            amountText = value.clean
                        } label: {
                            Text(unit == .grams ? "\(value.clean) g" : "\(value.clean)×")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(selected ? Color.accentColor : Theme.fieldBackground, in: Capsule())
                                .foregroundStyle(selected ? .white : .primary)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            Text("1 serving = \(item.servingLabel)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .card()
    }

    private var quickAmounts: [Double] {
        unit == .grams ? [50, 100, 150, 200, 250, 300] : [0.5, 1, 1.5, 2, 3]
    }

    private var mealCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Meal").font(.headline)
            HStack(spacing: 8) {
                ForEach(MealType.allCases) { m in
                    let selected = m == meal
                    Button {
                        withAnimation(.snappy) { meal = m }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: m.icon).font(.title3)
                            Text(m.title).font(.caption.weight(.semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .foregroundStyle(selected ? .white : m.tint)
                        .background(selected ? m.tint : m.tint.opacity(0.12),
                                    in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .card()
    }

    private var deleteButton: some View {
        Button(role: .destructive) {
            if case .edit(let entry) = mode {
                context.delete(entry)
                dismiss()
            }
        } label: {
            Label("Remove from diary", systemImage: "trash")
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
        }
        .tint(Theme.over)
    }

    // MARK: Actions

    private func convert(from old: AmountUnit, to new: AmountUnit) {
        guard let g = item.servingGrams, old != new else { return }
        let value = new == .grams ? amount * g : amount / g
        amountText = new == .grams ? value.rounded().clean : ((value * 100).rounded() / 100).clean
    }

    private func save() {
        switch mode {
        case .add(let item, let day, _):
            context.insert(FoodEntry(item: item, servings: servings, loggedInGrams: unit == .grams, meal: meal, day: day))
        case .edit(let entry):
            entry.servings = servings
            entry.loggedInGrams = unit == .grams
            entry.meal = meal
        }
        try? context.save()
        saved.toggle()
        if isEditing { dismiss() } else { onDone() }
    }
}
