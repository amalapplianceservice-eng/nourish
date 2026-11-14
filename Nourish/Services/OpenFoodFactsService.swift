import Foundation

/// Searches the Open Food Facts database (3M+ packaged and branded products, free, no API key).
/// Data © Open Food Facts contributors, available under the Open Database License.
enum OpenFoodFactsService {
    private static let userAgent = "Nourish/1.0 (iOS calorie tracker)"

    static func search(_ query: String) async throws -> [FoodItem] {
        var components = URLComponents(string: "https://search.openfoodfacts.org/search")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "page_size", value: "30"),
            URLQueryItem(name: "fields", value: "code,product_name,brands,nutriments,serving_size,serving_quantity"),
        ]
        var request = URLRequest(url: components.url!, timeoutInterval: 15)
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        let decoded = try JSONDecoder().decode(SearchResponse.self, from: data)

        var seen = Set<String>()
        return decoded.hits.compactMap { $0.foodItem }.filter { seen.insert($0.name.lowercased() + ($0.brand ?? "")).inserted }
    }

    // MARK: - Decoding

    private struct SearchResponse: Decodable {
        let hits: [Product]
    }

    private struct Product: Decodable {
        let code: String?
        let productName: String?
        let brands: StringOrArray?
        let nutriments: Nutriments?
        let servingSize: String?
        let servingQuantity: FlexibleDouble?

        enum CodingKeys: String, CodingKey {
            case code, brands, nutriments
            case productName = "product_name"
            case servingSize = "serving_size"
            case servingQuantity = "serving_quantity"
        }

        var foodItem: FoodItem? {
            guard let name = productName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty,
                  let n = nutriments, let kcal100 = n.kcalPer100g, kcal100 >= 0, kcal100 < 950
            else { return nil }

            let grams: Double
            let label: String
            if let q = servingQuantity?.value, q > 0, q < 2000 {
                grams = q
                label = servingSize.map { "1 serving (\($0))" } ?? "1 serving (\(q.clean) g)"
            } else {
                grams = 100
                label = "100 g"
            }
            let f = grams / 100
            return FoodItem(
                id: "off-\(code ?? UUID().uuidString)",
                name: name.prefix(1).uppercased() + name.dropFirst(),
                brand: brands?.first,
                servingLabel: label,
                servingGrams: grams,
                calories: kcal100 * f,
                protein: (n.protein?.value ?? 0) * f,
                carbs: (n.carbs?.value ?? 0) * f,
                fat: (n.fat?.value ?? 0) * f,
                source: .openFoodFacts
            )
        }
    }

    private struct Nutriments: Decodable {
        let kcal: FlexibleDouble?
        let kj: FlexibleDouble?
        let protein: FlexibleDouble?
        let carbs: FlexibleDouble?
        let fat: FlexibleDouble?

        enum CodingKeys: String, CodingKey {
            case kcal = "energy-kcal_100g"
            case kj = "energy_100g"
            case protein = "proteins_100g"
            case carbs = "carbohydrates_100g"
            case fat = "fat_100g"
        }

        var kcalPer100g: Double? { kcal?.value ?? kj.map { $0.value / 4.184 } }
    }

    /// OFF fields are sometimes numbers and sometimes strings.
    private struct FlexibleDouble: Decodable {
        let value: Double
        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let d = try? c.decode(Double.self) { value = d }
            else if let s = try? c.decode(String.self), let d = Double(s.replacingOccurrences(of: ",", with: ".")) { value = d }
            else { throw DecodingError.dataCorruptedError(in: c, debugDescription: "Not a number") }
        }
    }

    private struct StringOrArray: Decodable {
        let first: String?
        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let arr = try? c.decode([String].self) { first = arr.first }
            else if let s = try? c.decode(String.self) { first = s.split(separator: ",").first.map { String($0).trimmingCharacters(in: .whitespaces) } }
            else { first = nil }
        }
    }
}
