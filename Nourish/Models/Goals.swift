import Foundation

enum GoalKeys {
    static let hasOnboarded = "hasOnboarded"
    static let calories = "goalCalories"
    static let protein = "goalProtein"
    static let carbs = "goalCarbs"
    static let fat = "goalFat"
    static let usesMetric = "usesMetric"
}

/// Mifflin–St Jeor based daily target calculator.
enum GoalCalculator {
    enum Sex: String, CaseIterable, Identifiable {
        case female, male
        var id: String { rawValue }
        var title: String { rawValue.capitalized }
    }

    enum Activity: String, CaseIterable, Identifiable {
        case sedentary, light, moderate, active, veryActive
        var id: String { rawValue }

        var title: String {
            switch self {
            case .sedentary: "Sedentary"
            case .light: "Lightly active"
            case .moderate: "Moderately active"
            case .active: "Very active"
            case .veryActive: "Athlete"
            }
        }

        var subtitle: String {
            switch self {
            case .sedentary: "Desk job, little exercise"
            case .light: "Exercise 1–3 days a week"
            case .moderate: "Exercise 3–5 days a week"
            case .active: "Hard exercise 6–7 days a week"
            case .veryActive: "Physical job or twice-daily training"
            }
        }

        var multiplier: Double {
            switch self {
            case .sedentary: 1.2
            case .light: 1.375
            case .moderate: 1.55
            case .active: 1.725
            case .veryActive: 1.9
            }
        }
    }

    enum Goal: String, CaseIterable, Identifiable {
        case lose, maintain, gain
        var id: String { rawValue }

        var title: String {
            switch self {
            case .lose: "Lose weight"
            case .maintain: "Maintain"
            case .gain: "Build muscle"
            }
        }

        var icon: String {
            switch self {
            case .lose: "arrow.down.right"
            case .maintain: "equal"
            case .gain: "arrow.up.right"
            }
        }

        var calorieDelta: Double {
            switch self {
            case .lose: -500
            case .maintain: 0
            case .gain: 300
            }
        }
    }

    struct Targets {
        var calories: Int
        var protein: Int
        var carbs: Int
        var fat: Int
    }

    static func targets(sex: Sex, age: Int, weightKg: Double, heightCm: Double,
                        activity: Activity, goal: Goal) -> Targets {
        let base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age) + (sex == .male ? 5 : -161)
        let tdee = base * activity.multiplier
        let floor: Double = sex == .male ? 1500 : 1200
        let calories = max(floor, ((tdee + goal.calorieDelta) / 10).rounded() * 10)

        let proteinPerKg: Double = goal == .maintain ? 1.6 : 2.0
        let protein = (weightKg * proteinPerKg).rounded()
        let fat = (calories * 0.27 / 9).rounded()
        let carbs = max(50, ((calories - protein * 4 - fat * 9) / 4).rounded())

        return Targets(calories: Int(calories), protein: Int(protein), carbs: Int(carbs), fat: Int(fat))
    }
}
