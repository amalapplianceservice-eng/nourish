import SwiftUI
import SwiftData

/// Create a custom food or recipe with your own nutrition values.
struct CreateFoodView: View {
    let day: Date
    let meal: MealType
    let onLogged: () -> Void

    @Environment(\.modelContext) private var context

    @State private var name = ""
    @State private var brand = ""
    @State private var servingLabel = "1 serving"
    @State private var servingGrams = ""
    @State private var calories = ""
    @State private var protein = ""
    @State private var carbs = ""
    @State private var fat = ""
    @State private var savedOnly = false

    private func num(_ s: String) -> Double? { Double(s.replacingOccurrences(of: ",", with: ".")) }

    /// If calories are blank, derive them from macros (4/4/9 kcal per gram).
    private var resolvedCalories: Double? {
        if let c = num(calories) { return c }
        let p = num(protein) ?? 0, c = num(carbs) ?? 0, f = num(fat) ?? 0
        let derived = p * 4 + c * 4 + f * 9
        return derived > 0 ? derived : nil
    }

    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && resolvedCalories != nil
    }

    var body: some View {
        Form {
            Section("Food") {
                TextField("Name (e.g. Mom's lasagna)", text: $name)
                TextField("Brand or note (optional)", text: $brand)
            }

            Section {
                TextField("Serving description", text: $servingLabel)
                numberField("Serving weight", text: $servingGrams, unit: "g", placeholder: "optional")
            } header: {
                Text("Serving")
            } footer: {
                Text("Add the weight to log this food by grams later.")
            }

            Section {
                numberField("Calories", text: $calories, unit: "kcal",
                            placeholder: resolvedCalories.map { $0.kcal } ?? "0")
                numberField("Protein", text: $protein, unit: "g", placeholder: "0")
                numberField("Carbs", text: $carbs, unit: "g", placeholder: "0")
                numberField("Fat", text: $fat, unit: "g", placeholder: "0")
            } header: {
                Text("Nutrition per serving")
            } footer: {
                Text("Leave calories blank to calculate them from macros.")
            }

            Section {
                Button(action: { save(andLog: true) }) {
                    Label("Save & add to \(meal.title)", systemImage: "plus")
                }
                .buttonStyle(.primary)
                .disabled(!isValid)
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)

                Button(action: { save(andLog: false) }) {
                    Text(savedOnly ? "Saved to My Foods ✓" : "Save to My Foods only")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .disabled(!isValid)
                .listRowBackground(Color.clear)
            }
        }
        .scrollContentBackground(.hidden)
        .scrollDismissesKeyboard(.interactively)
        .sensoryFeedback(.success, trigger: savedOnly)
    }

    private func numberField(_ title: String, text: Binding<String>, unit: String, placeholder: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            TextField(placeholder, text: text)
                .multilineTextAlignment(.trailing)
                .decimalKeyboard()
                .frame(maxWidth: 120)
            Text(unit).foregroundStyle(.secondary).frame(width: 36, alignment: .leading)
        }
    }

    private func save(andLog: Bool) {
        guard let kcal = resolvedCalories else { return }
        let food = CustomFood(
            name: name.trimmingCharacters(in: .whitespaces),
            brand: brand.isEmpty ? nil : brand,
            servingLabel: servingLabel.isEmpty ? "1 serving" : servingLabel,
            servingGrams: num(servingGrams),
            calories: kcal,
            protein: num(protein) ?? 0,
            carbs: num(carbs) ?? 0,
            fat: num(fat) ?? 0
        )
        context.insert(food)
        if andLog {
            context.insert(FoodEntry(item: food.asFoodItem, servings: 1, loggedInGrams: false, meal: meal, day: day))
            try? context.save()
            onLogged()
        } else {
            try? context.save()
            savedOnly = true
            name = ""; brand = ""; servingLabel = "1 serving"; servingGrams = ""
            calories = ""; protein = ""; carbs = ""; fat = ""
        }
    }
}
