import SwiftUI

/// The big daily calorie ring shown on the Diary screen.
struct CalorieRing: View {
    var eaten: Double
    var goal: Double

    private var progress: Double { goal > 0 ? eaten / goal : 0 }
    private var remaining: Double { goal - eaten }
    private var isOver: Bool { remaining < 0 }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.accentColor.opacity(0.14), lineWidth: 18)
            Circle()
                .trim(from: 0, to: min(progress, 1))
                .stroke(isOver ? AnyShapeStyle(Theme.over) : AnyShapeStyle(Theme.ringGradient),
                        style: StrokeStyle(lineWidth: 18, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.smooth(duration: 0.8), value: progress)

            VStack(spacing: 2) {
                Text(abs(remaining).kcal)
                    .font(.system(size: 38, weight: .bold, design: .rounded))
                    .contentTransition(.numericText(value: remaining))
                    .animation(.smooth, value: remaining)
                Text(isOver ? "kcal over" : "kcal left")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(isOver ? Theme.over : .secondary)
            }
        }
        .frame(width: 168, height: 168)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(abs(remaining).kcal) calories \(isOver ? "over" : "remaining") of \(goal.kcal)")
    }
}

/// A slim horizontal macro progress bar with label.
struct MacroBar: View {
    var title: String
    var value: Double
    var goal: Double
    var color: Color

    private var progress: Double { goal > 0 ? min(value / goal, 1) : 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.16))
                    Capsule().fill(color)
                        .frame(width: max(6, geo.size.width * progress))
                        .animation(.smooth(duration: 0.7), value: progress)
                }
            }
            .frame(height: 7)
            HStack(spacing: 0) {
                Text(value.grams).fontWeight(.semibold)
                Text(" / \(Int(goal)) g").foregroundStyle(.secondary)
            }
            .font(.caption)
            .monospacedDigit()
        }
    }
}

/// Small donut showing the macro split of a food (calories from P/C/F).
struct MacroDonut: View {
    var nutrition: Nutrition
    var lineWidth: CGFloat = 8

    private var parts: [(Double, Color)] {
        let p = nutrition.protein * 4, c = nutrition.carbs * 4, f = nutrition.fat * 9
        let total = p + c + f
        guard total > 0 else { return [] }
        return [(p / total, Theme.protein), (c / total, Theme.carbs), (f / total, Theme.fat)]
    }

    var body: some View {
        ZStack {
            Circle().stroke(Color.secondary.opacity(0.15), lineWidth: lineWidth)
            ForEach(Array(parts.enumerated()), id: \.offset) { index, part in
                let start = parts.prefix(index).reduce(0) { $0 + $1.0 }
                Circle()
                    .trim(from: start, to: start + part.0)
                    .stroke(part.1, style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
                    .rotationEffect(.degrees(-90))
            }
        }
    }
}

/// "P 12g" style pill.
struct MacroPill: View {
    var letter: String
    var grams: Double
    var color: Color

    var body: some View {
        HStack(spacing: 3) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text("\(letter) \(grams.grams)g")
        }
        .font(.caption2.weight(.medium))
        .foregroundStyle(.secondary)
        .monospacedDigit()
    }
}

struct MacroPills: View {
    var nutrition: Nutrition
    var body: some View {
        HStack(spacing: 10) {
            MacroPill(letter: "P", grams: nutrition.protein, color: Theme.protein)
            MacroPill(letter: "C", grams: nutrition.carbs, color: Theme.carbs)
            MacroPill(letter: "F", grams: nutrition.fat, color: Theme.fat)
        }
    }
}
