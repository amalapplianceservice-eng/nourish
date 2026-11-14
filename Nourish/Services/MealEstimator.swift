import Foundation

/// One food component of an AI-estimated meal.
struct EstimatedItem: Identifiable, Hashable {
    let id = UUID()
    var name: String
    var portion: String
    var grams: Double
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double

    var asFoodItem: FoodItem {
        FoodItem(id: "ai-\(id)", name: name, brand: nil, servingLabel: portion,
                 servingGrams: grams > 0 ? grams : nil,
                 calories: calories, protein: protein, carbs: carbs, fat: fat, source: .ai)
    }
}

struct MealEstimate {
    var mealName: String
    var items: [EstimatedItem]
    var assumptions: String
    var confidence: String
}

enum MealEstimatorError: LocalizedError {
    case missingKey, invalidKey, rateLimited, overloaded, refused, badResponse, server(String)

    var errorDescription: String? {
        switch self {
        case .missingKey: "Add your Anthropic API key in Settings to use AI estimates."
        case .invalidKey: "Your API key was rejected. Double-check it in Settings."
        case .rateLimited: "Too many requests right now. Try again in a moment."
        case .overloaded: "The AI service is busy. Try again in a few seconds."
        case .refused: "The AI couldn't estimate this one. Try describing the meal differently."
        case .badResponse: "Got an unexpected response. Please try again."
        case .server(let message): message
        }
    }
}

/// Estimates calories and macros for a free-text meal description (and optional photo) using Claude.
/// Calls the Messages API over HTTPS directly — there is no official Anthropic SDK for Swift.
enum MealEstimator {
    static let apiKeyAccount = "anthropic-api-key"
    private static let endpoint = URL(string: "https://api.anthropic.com/v1/messages")!
    private static let model = "claude-opus-5-5"

    static var hasKey: Bool { !(KeychainStore.string(for: apiKeyAccount) ?? "").isEmpty }

    private static let systemPrompt = """
    You are the nutrition engine inside a calorie-tracking app. The user describes what they ate \
    (and may attach a photo). Break the meal into its individual food components and estimate each \
    one's portion and nutrition.

    Rules:
    - If the user states a quantity or size ("200 g", "2 slices", "a large bowl"), honor it exactly and scale nutrition to it.
    - If the size is vague, assume a typical home or restaurant portion, and say what you assumed.
    - Include cooking oil, butter, sauces, dressings, toppings and drinks when mentioned or clearly implied by the dish.
    - Use standard reference values (USDA FoodData Central style). For named restaurant or packaged items, use their published values when you know them.
    - Keep item names short (2–5 words, title case not required). Portion is a short human label such as "2 large eggs (100 g)".
    - grams is the estimated edible weight of that component (use ml ≈ g for drinks).
    - Round calories to whole numbers and macros to one decimal.
    - meal_name is a short friendly title for the whole meal.
    - assumptions is one or two short sentences on portion or ingredient assumptions; empty string if none.
    - If the input is not food, return an empty items array and explain in assumptions.
    """

    private static let schema: [String: Any] = [
        "type": "object",
        "properties": [
            "meal_name": ["type": "string"],
            "items": [
                "type": "array",
                "items": [
                    "type": "object",
                    "properties": [
                        "name": ["type": "string"],
                        "portion": ["type": "string"],
                        "grams": ["type": "number"],
                        "calories": ["type": "number"],
                        "protein_g": ["type": "number"],
                        "carbs_g": ["type": "number"],
                        "fat_g": ["type": "number"],
                    ],
                    "required": ["name", "portion", "grams", "calories", "protein_g", "carbs_g", "fat_g"],
                    "additionalProperties": false,
                ],
            ],
            "assumptions": ["type": "string"],
            "confidence": ["type": "string", "enum": ["low", "medium", "high"]],
        ],
        "required": ["meal_name", "items", "assumptions", "confidence"],
        "additionalProperties": false,
    ]

    static func estimate(description: String, imageJPEG: Data?) async throws -> MealEstimate {
        guard let apiKey = KeychainStore.string(for: apiKeyAccount), !apiKey.isEmpty else {
            throw MealEstimatorError.missingKey
        }

        var content: [[String: Any]] = []
        if let imageJPEG {
            content.append([
                "type": "image",
                "source": ["type": "base64", "media_type": "image/jpeg", "data": imageJPEG.base64EncodedString()],
            ])
        }
        let text = description.trimmingCharacters(in: .whitespacesAndNewlines)
        content.append(["type": "text", "text": text.isEmpty ? "Estimate the meal in this photo." : text])

        let body: [String: Any] = [
            "model": model,
            "max_tokens": 16000,
            "system": systemPrompt,
            // Low effort keeps estimates fast; thinking is adaptive (always on) for this model.
            "output_config": [
                "effort": "low",
                "format": ["type": "json_schema", "schema": schema],
            ],
            // If a safety classifier declines, the API retries on a fallback model in the same call.
            "fallbacks": "default",
            "messages": [["role": "user", "content": content]],
        ]

        var request = URLRequest(url: endpoint, timeoutInterval: 120)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2026-10-21", forHTTPHeaderField: "anthropic-version")
        request.setValue("server-side-fallback-2026-07-01", forHTTPHeaderField: "anthropic-beta")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw MealEstimatorError.badResponse }

        switch http.statusCode {
        case 200: break
        case 401, 403: throw MealEstimatorError.invalidKey
        case 429: throw MealEstimatorError.rateLimited
        case 500...599: throw MealEstimatorError.overloaded
        default:
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])
                .flatMap { $0["error"] as? [String: Any] }
                .flatMap { $0["message"] as? String }
            throw MealEstimatorError.server(message ?? "Request failed (\(http.statusCode)).")
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw MealEstimatorError.badResponse
        }
        if (json["stop_reason"] as? String) == "refusal" { throw MealEstimatorError.refused }

        // Structured output arrives as JSON text in the text block(s); skip thinking/fallback blocks.
        let blocks = json["content"] as? [[String: Any]] ?? []
        let outputText = blocks.filter { ($0["type"] as? String) == "text" }.compactMap { $0["text"] as? String }.joined()
        guard let outputData = outputText.data(using: .utf8),
              let result = try JSONSerialization.jsonObject(with: outputData) as? [String: Any]
        else { throw MealEstimatorError.badResponse }

        let items = (result["items"] as? [[String: Any]] ?? []).map { item in
            EstimatedItem(
                name: item["name"] as? String ?? "Food",
                portion: item["portion"] as? String ?? "1 serving",
                grams: number(item["grams"]),
                calories: number(item["calories"]),
                protein: number(item["protein_g"]),
                carbs: number(item["carbs_g"]),
                fat: number(item["fat_g"])
            )
        }
        return MealEstimate(
            mealName: result["meal_name"] as? String ?? "Meal",
            items: items,
            assumptions: result["assumptions"] as? String ?? "",
            confidence: result["confidence"] as? String ?? "medium"
        )
    }

    private static func number(_ value: Any?) -> Double {
        (value as? NSNumber)?.doubleValue ?? 0
    }
}
