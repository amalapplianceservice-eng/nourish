import Foundation
import SwiftData
import SwiftUI

// MARK: - Meal type

enum MealType: String, CaseIterable, Codable, Identifiable {
    case breakfast, lunch, dinner, snacks

    var id: String { rawValue }
    var title: String { rawValue.capitalized }

    var icon: String {
        switch self {
        case .breakfast: "sunrise.fill"
        case .lunch: "sun.max.fill"
        case .dinner: "moon.stars.fill"
        case .snacks: "carrot.fill"
        }
    }

    var tint: Color {
        switch self {
        case .breakfast: Color(red: 1.00, green: 0.62, blue: 0.26)
        case .lunch: Color(red: 0.98, green: 0.78, blue: 0.20)
        case .dinner: Color(red: 0.45, green: 0.47, blue: 0.95)
        case .snacks: Color(red: 0.95, green: 0.42, blue: 0.55)
        }
    }

    /// Best guess for which meal the user is logging, based on the time of day.
    static func suggested(for date: Date = .now) -> MealType {
        switch Calendar.current.component(.hour, from: date) {
        case 4..<11: .breakfast
        case 11..<16: .lunch
        case 16..<22: .dinner
        default: .snacks
        }
    }
}

// MARK: - Food source

enum FoodSource: String, Codable {
    case builtIn, openFoodFacts, custom, ai

    var label: String {
        switch self {
        case .builtIn: "Nourish database"
        case .openFoodFacts: "Open Food Facts"
        case .custom: "My food"
        case .ai: "AI estimate"
        }
    }

    var icon: String {
        switch self {
        case .builtIn: "leaf.fill"
        case .openFoodFacts: "globe"
        case .custom: "person.fill"
        case .ai: "sparkles"
        }
    }
}

// MARK: - FoodItem (a food you can log; not persisted)

struct FoodItem: Identifiable, Hashable {
    var id: String
    var name: String
    var brand: String?
    /// Human description of one serving, e.g. "1 cup (240 g)".
    var servingLabel: String
    /// Grams in one serving, when known. Enables logging by weight.
    var servingGrams: Double?
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var source: FoodSource

    var nutrition: Nutrition { Nutrition(calories: calories, protein: protein, carbs: carbs, fat: fat) }
}

struct Nutrition: Hashable {
    var calories: Double = 0
    var protein: Double = 0
    var carbs: Double = 0
    var fat: Double = 0

    static let zero = Nutrition()

    static func + (lhs: Nutrition, rhs: Nutrition) -> Nutrition {
        Nutrition(calories: lhs.calories + rhs.calories,
                  protein: lhs.protein + rhs.protein,
                  carbs: lhs.carbs + rhs.carbs,
                  fat: lhs.fat + rhs.fat)
    }

    static func * (lhs: Nutrition, factor: Double) -> Nutrition {
        Nutrition(calories: lhs.calories * factor,
                  protein: lhs.protein * factor,
                  carbs: lhs.carbs * factor,
                  fat: lhs.fat * factor)
    }
}

// MARK: - Logged entry

@Model
final class FoodEntry {
    var name: String = ""
    var brand: String?
    var servingLabel: String = "1 serving"
    var servingGrams: Double?
    /// Number of base servings eaten (e.g. 1.5). When logged by weight this is grams / servingGrams.
    var servings: Double = 1
    var loggedInGrams: Bool = false
    var kcalPerServing: Double = 0
    var proteinPerServing: Double = 0
    var carbsPerServing: Double = 0
    var fatPerServing: Double = 0
    var mealRaw: String = MealType.snacks.rawValue
    /// Start of the day this entry belongs to.
    var day: Date = Calendar.current.startOfDay(for: .now)
    var createdAt: Date = Date.now
    var sourceRaw: String = FoodSource.builtIn.rawValue

    init(item: FoodItem, servings: Double, loggedInGrams: Bool, meal: MealType, day: Date) {
        self.name = item.name
        self.brand = item.brand
        self.servingLabel = item.servingLabel
        self.servingGrams = item.servingGrams
        self.servings = servings
        self.loggedInGrams = loggedInGrams
        self.kcalPerServing = item.calories
        self.proteinPerServing = item.protein
        self.carbsPerServing = item.carbs
        self.fatPerServing = item.fat
        self.mealRaw = meal.rawValue
        self.day = Calendar.current.startOfDay(for: day)
        self.createdAt = .now
        self.sourceRaw = item.source.rawValue
    }

    var meal: MealType {
        get { MealType(rawValue: mealRaw) ?? .snacks }
        set { mealRaw = newValue.rawValue }
    }

    var source: FoodSource { FoodSource(rawValue: sourceRaw) ?? .custom }

    var nutrition: Nutrition {
        Nutrition(calories: kcalPerServing, protein: proteinPerServing, carbs: carbsPerServing, fat: fatPerServing) * servings
    }

    var calories: Double { kcalPerServing * servings }

    /// The base food, so it can be re-logged from "Recent".
    var asFoodItem: FoodItem {
        FoodItem(id: "recent-\(name)-\(servingLabel)", name: name, brand: brand,
                 servingLabel: servingLabel, servingGrams: servingGrams,
                 calories: kcalPerServing, protein: proteinPerServing,
                 carbs: carbsPerServing, fat: fatPerServing, source: source)
    }

    var amountDescription: String {
        if loggedInGrams, let g = servingGrams {
            return "\((servings * g).clean) g"
        }
        if servings == 1 { return servingLabel }
        return "\(servings.clean) × \(servingLabel)"
    }
}

// MARK: - User-created food or saved meal

@Model
final class CustomFood {
    var name: String = ""
    var brand: String?
    var servingLabel: String = "1 serving"
    var servingGrams: Double?
    var calories: Double = 0
    var protein: Double = 0
    var carbs: Double = 0
    var fat: Double = 0
    var createdAt: Date = Date.now

    init(name: String, brand: String? = nil, servingLabel: String, servingGrams: Double?,
         calories: Double, protein: Double, carbs: Double, fat: Double) {
        self.name = name
        self.brand = brand
        self.servingLabel = servingLabel
        self.servingGrams = servingGrams
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.createdAt = .now
    }

    var asFoodItem: FoodItem {
        FoodItem(id: "custom-\(name)-\(createdAt.timeIntervalSince1970)", name: name, brand: brand,
                 servingLabel: servingLabel, servingGrams: servingGrams,
                 calories: calories, protein: protein, carbs: carbs, fat: fat, source: .custom)
    }
}

// MARK: - Formatting helpers

extension Double {
    /// "1.5", "2", "0.25" — no trailing zeros.
    var clean: String {
        let f = NumberFormatter()
        f.maximumFractionDigits = 2
        f.minimumFractionDigits = 0
        return f.string(from: NSNumber(value: self)) ?? "\(self)"
    }

    var kcal: String { "\(Int(rounded()))" }
    /// Macro grams: one decimal under 10 g, whole numbers above.
    var grams: String { self < 10 ? ((self * 10).rounded() / 10).clean : "\(Int(rounded()))" }
}
