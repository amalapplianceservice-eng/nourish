import SwiftUI

/// Personal details → recommended daily calorie & macro targets.
struct GoalSetupView: View {
    var buttonTitle: String = "Save goals"
    var onSave: () -> Void

    @AppStorage(GoalKeys.calories) private var goalCalories = 2000
    @AppStorage(GoalKeys.protein) private var goalProtein = 140
    @AppStorage(GoalKeys.carbs) private var goalCarbs = 220
    @AppStorage(GoalKeys.fat) private var goalFat = 65
    @AppStorage(GoalKeys.usesMetric) private var usesMetric = Locale.current.measurementSystem == .metric

    @AppStorage("profileSex") private var sex: String = GoalCalculator.Sex.female.rawValue
    @AppStorage("profileAge") private var age = 30
    @AppStorage("profileHeightCm") private var heightCm = 170.0
    @AppStorage("profileWeightKg") private var weightKg = 70.0
    @AppStorage("profileActivity") private var activity: String = GoalCalculator.Activity.light.rawValue
    @AppStorage("profileGoal") private var goal: String = GoalCalculator.Goal.maintain.rawValue

    private var targets: GoalCalculator.Targets {
        GoalCalculator.targets(sex: GoalCalculator.Sex(rawValue: sex) ?? .female,
                               age: age, weightKg: weightKg, heightCm: heightCm,
                               activity: GoalCalculator.Activity(rawValue: activity) ?? .light,
                               goal: GoalCalculator.Goal(rawValue: goal) ?? .maintain)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                goalPicker
                bodyCard
                activityCard
                resultCard
            }
            .padding()
            .padding(.bottom, 90)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.background)
        .safeAreaInset(edge: .bottom) {
            Button {
                let t = targets
                goalCalories = t.calories
                goalProtein = t.protein
                goalCarbs = t.carbs
                goalFat = t.fat
                onSave()
            } label: {
                Text(buttonTitle)
            }
            .buttonStyle(.primary)
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
    }

    private var goalPicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your goal").font(.headline)
            HStack(spacing: 8) {
                ForEach(GoalCalculator.Goal.allCases) { g in
                    let selected = g.rawValue == goal
                    Button { withAnimation(.snappy) { goal = g.rawValue } } label: {
                        VStack(spacing: 6) {
                            Image(systemName: g.icon).font(.title3.weight(.semibold))
                            Text(g.title).font(.caption.weight(.semibold)).multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .foregroundStyle(selected ? .white : .primary)
                        .background(selected ? Color.accentColor : Theme.fieldBackground,
                                    in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .card()
    }

    private var bodyCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("About you").font(.headline)
                Spacer()
                Picker("Units", selection: $usesMetric) {
                    Text("kg/cm").tag(true)
                    Text("lb/ft").tag(false)
                }
                .pickerStyle(.segmented)
                .frame(width: 140)
            }

            Picker("Sex", selection: $sex) {
                ForEach(GoalCalculator.Sex.allCases) { Text($0.title).tag($0.rawValue) }
            }
            .pickerStyle(.segmented)

            Stepper(value: $age, in: 13...100) {
                field("Age", "\(age)", "years")
            }

            if usesMetric {
                Stepper(value: $heightCm, in: 120...230, step: 1) {
                    field("Height", "\(Int(heightCm))", "cm")
                }
                Stepper(value: $weightKg, in: 30...300, step: 0.5) {
                    field("Weight", weightKg.clean, "kg")
                }
            } else {
                let totalInches = Int((heightCm / 2.54).rounded())
                Stepper(value: Binding(get: { Double(totalInches) }, set: { heightCm = $0 * 2.54 }), in: 48...90, step: 1) {
                    field("Height", "\(totalInches / 12)′ \(totalInches % 12)″", "")
                }
                Stepper(value: Binding(get: { (weightKg * 2.20462).rounded() }, set: { weightKg = $0 / 2.20462 }), in: 66...660, step: 1) {
                    field("Weight", "\(Int((weightKg * 2.20462).rounded()))", "lb")
                }
            }
        }
        .card()
    }

    private func field(_ title: String, _ value: String, _ unit: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text(title).foregroundStyle(.secondary)
            Spacer()
            Text(value).font(.headline).monospacedDigit()
            if !unit.isEmpty { Text(unit).font(.caption).foregroundStyle(.secondary) }
        }
        .padding(.trailing, 8)
    }

    private var activityCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Activity level").font(.headline).padding(.bottom, 4)
            ForEach(GoalCalculator.Activity.allCases) { a in
                let selected = a.rawValue == activity
                Button { withAnimation(.snappy) { activity = a.rawValue } } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(a.title).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                            Text(a.subtitle).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                            .font(.title3)
                            .foregroundStyle(selected ? Color.accentColor : .secondary.opacity(0.5))
                    }
                    .padding(12)
                    .background(selected ? Color.accentColor.opacity(0.1) : .clear,
                                in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .card()
    }

    private var resultCard: some View {
        let t = targets
        return VStack(spacing: 14) {
            Text("Your daily target").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(t.calories)")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .contentTransition(.numericText(value: Double(t.calories)))
                    .animation(.smooth, value: t.calories)
                Text("kcal").foregroundStyle(.secondary)
            }
            HStack {
                target("Protein", t.protein, Theme.protein)
                target("Carbs", t.carbs, Theme.carbs)
                target("Fat", t.fat, Theme.fat)
            }
        }
        .frame(maxWidth: .infinity)
        .card(padding: 20)
    }

    private func target(_ title: String, _ grams: Int, _ color: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(grams) g").font(.headline).monospacedDigit()
            Text(title).font(.caption).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }
}

/// First-launch welcome + goal setup.
struct OnboardingView: View {
    var onFinish: () -> Void
    @State private var step = 0

    var body: some View {
        NavigationStack {
            if step == 0 {
                welcome
            } else {
                GoalSetupView(buttonTitle: "Start tracking", onSave: onFinish)
                    .navigationTitle("Set your goals")
            }
        }
    }

    private var welcome: some View {
        VStack(spacing: 28) {
            Spacer()
            ZStack {
                Circle()
                    .fill(Color.accentColor.opacity(0.12))
                    .frame(width: 170, height: 170)
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 118, height: 118)
                    .shadow(color: Color.accentColor.opacity(0.4), radius: 20, y: 10)
                Image(systemName: "leaf.fill")
                    .font(.system(size: 52, weight: .semibold))
                    .foregroundStyle(.white)
            }
            VStack(spacing: 10) {
                Text("Nourish")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                Text("Track what you eat in seconds.\nSearch millions of foods or just describe your meal.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: 16) {
                feature("magnifyingglass", "Huge food database", "Common foods offline, plus 3M+ branded products.")
                feature("sparkles", "AI meal estimates", "Type “chicken bowl with rice” or snap a photo.")
                feature("chart.bar.fill", "See your progress", "Calories, macros, streaks and trends.")
            }
            .padding(.horizontal, 8)
            Spacer()
            Button("Get started") { withAnimation(.smooth) { step = 1 } }
                .buttonStyle(.primary)
        }
        .padding(24)
        .background(Theme.background)
    }

    private func feature(_ icon: String, _ title: String, _ subtitle: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(Color.accentColor)
                .frame(width: 40, height: 40)
                .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}
