import SwiftUI
import SwiftData
import Charts

struct ProgressScreen: View {
    enum Range: Int, CaseIterable, Identifiable {
        case week = 7, month = 30
        var id: Int { rawValue }
        var title: String { self == .week ? "7 days" : "30 days" }
    }

    @State private var range: Range = .week

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Picker("Range", selection: $range) {
                        ForEach(Range.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    ProgressContent(days: range.rawValue)
                        .id(range)
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("Progress")
        }
    }
}

private struct DayTotal: Identifiable {
    let day: Date
    let nutrition: Nutrition
    var id: Date { day }
}

private struct ProgressContent: View {
    let days: Int
    @Query private var entries: [FoodEntry]
    @AppStorage(GoalKeys.calories) private var goalCalories = 2000

    init(days: Int) {
        self.days = days
        let today = Calendar.current.startOfDay(for: .now)
        let start = Calendar.current.date(byAdding: .day, value: -(days - 1), to: today) ?? today
        _entries = Query(filter: #Predicate<FoodEntry> { $0.day >= start }, sort: \FoodEntry.day)
    }

    private var dayTotals: [DayTotal] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: .now)
        let grouped = Dictionary(grouping: entries) { cal.startOfDay(for: $0.day) }
        return (0..<days).reversed().compactMap { offset in
            guard let day = cal.date(byAdding: .day, value: -offset, to: today) else { return nil }
            let total = (grouped[day] ?? []).reduce(Nutrition.zero) { $0 + $1.nutrition }
            return DayTotal(day: day, nutrition: total)
        }
    }

    private var loggedDays: [DayTotal] { dayTotals.filter { $0.nutrition.calories > 0 } }

    private var average: Nutrition {
        guard !loggedDays.isEmpty else { return .zero }
        return loggedDays.reduce(Nutrition.zero) { $0 + $1.nutrition } * (1 / Double(loggedDays.count))
    }

    private var daysOnTarget: Int {
        loggedDays.filter { $0.nutrition.calories <= Double(goalCalories) * 1.05 }.count
    }

    private var streak: Int {
        var count = 0
        for day in dayTotals.reversed() {
            if day.nutrition.calories > 0 { count += 1 }
            else if Calendar.current.isDateInToday(day.day) { continue }
            else { break }
        }
        return count
    }

    private var topFoods: [(String, Int)] {
        Dictionary(grouping: entries, by: \.name)
            .map { ($0.key, $0.value.count) }
            .sorted { $0.1 > $1.1 }
            .prefix(5)
            .map { $0 }
    }

    var body: some View {
        VStack(spacing: 16) {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                StatTile(title: "Daily average", value: average.calories.kcal, unit: "kcal", icon: "flame.fill", color: .orange)
                StatTile(title: "Logging streak", value: "\(streak)", unit: streak == 1 ? "day" : "days", icon: "bolt.fill", color: .accentColor)
                StatTile(title: "On target", value: "\(daysOnTarget)/\(loggedDays.count)", unit: "days", icon: "target", color: Theme.fat)
                StatTile(title: "Avg protein", value: average.protein.grams, unit: "g", icon: "dumbbell.fill", color: Theme.protein)
            }

            caloriesChart
            macroCard
            if !topFoods.isEmpty { topFoodsCard }
        }
    }

    private var caloriesChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Calories").font(.headline)
                Spacer()
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 1).fill(.secondary).frame(width: 12, height: 2)
                    Text("Goal \(goalCalories)").font(.caption).foregroundStyle(.secondary)
                }
            }
            Chart {
                ForEach(dayTotals) { d in
                    BarMark(x: .value("Day", d.day, unit: .day),
                            y: .value("kcal", d.nutrition.calories))
                        .foregroundStyle(d.nutrition.calories > Double(goalCalories) * 1.05 ? Theme.over : Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: days > 7 ? 3 : 6, style: .continuous))
                }
                RuleMark(y: .value("Goal", goalCalories))
                    .foregroundStyle(.secondary)
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
            }
            .chartXAxis {
                if days <= 7 {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisValueLabel(format: .dateTime.weekday(.narrow), centered: true)
                    }
                } else {
                    AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
            }
            .frame(height: 200)
        }
        .card()
    }

    private var macroCard: some View {
        let p = average.protein * 4, c = average.carbs * 4, f = average.fat * 9
        let total = max(p + c + f, 1)
        return VStack(alignment: .leading, spacing: 14) {
            Text("Average macros").font(.headline)
            HStack(spacing: 20) {
                MacroDonut(nutrition: average, lineWidth: 14)
                    .frame(width: 96, height: 96)
                VStack(spacing: 10) {
                    macroRow("Protein", average.protein, p / total, Theme.protein)
                    macroRow("Carbs", average.carbs, c / total, Theme.carbs)
                    macroRow("Fat", average.fat, f / total, Theme.fat)
                }
            }
        }
        .card()
    }

    private func macroRow(_ title: String, _ grams: Double, _ share: Double, _ color: Color) -> some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(title).foregroundStyle(.secondary)
            Spacer()
            Text("\(grams.grams) g").fontWeight(.semibold).monospacedDigit()
            Text("\(Int((share * 100).rounded()))%")
                .foregroundStyle(.secondary)
                .monospacedDigit()
                .frame(width: 40, alignment: .trailing)
        }
        .font(.subheadline)
    }

    private var topFoodsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Most logged").font(.headline)
            ForEach(Array(topFoods.enumerated()), id: \.offset) { index, food in
                HStack {
                    Text("\(index + 1)")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(width: 22, height: 22)
                        .background(Color.accentColor.opacity(1 - Double(index) * 0.15), in: Circle())
                    Text(food.0).lineLimit(1)
                    Spacer()
                    Text("\(food.1)×").foregroundStyle(.secondary).monospacedDigit()
                }
                .font(.subheadline)
            }
        }
        .card()
    }
}

private struct StatTile: View {
    var title: String
    var value: String
    var unit: String
    var icon: String
    var color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(color)
                .frame(width: 32, height: 32)
                .background(color.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text(value).font(.title2.weight(.bold)).monospacedDigit()
                    Text(unit).font(.caption).foregroundStyle(.secondary)
                }
                Text(title).font(.caption).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 14)
    }
}
