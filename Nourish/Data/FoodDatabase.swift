import Foundation

/// A built-in, offline database of common foods with typical (USDA-style average) values per serving.
/// Packaged and branded products come from Open Food Facts at search time.
enum FoodDatabase {
    static let all: [FoodItem] = rows.enumerated().map { index, r in
        FoodItem(id: "builtin-\(index)", name: r.0, brand: nil, servingLabel: r.1, servingGrams: r.2,
                 calories: r.3, protein: r.4, carbs: r.5, fat: r.6, source: .builtIn)
    }

    /// Ranks prefix matches first, then word matches, then substring matches.
    static func search(_ query: String, limit: Int = 25) -> [FoodItem] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return [] }
        let terms = q.split(separator: " ").map(String.init)

        return all
            .compactMap { item -> (FoodItem, Int)? in
                let name = item.name.lowercased()
                guard terms.allSatisfy({ name.contains($0) }) else { return nil }
                let score: Int
                if name.hasPrefix(q) { score = 0 }
                else if name.split(whereSeparator: { !$0.isLetter }).contains(where: { $0.hasPrefix(terms[0]) }) { score = 1 }
                else { score = 2 }
                return (item, score)
            }
            .sorted { $0.1 == $1.1 ? $0.0.name.count < $1.0.name.count : $0.1 < $1.1 }
            .prefix(limit)
            .map(\.0)
    }

    static let popular: [String] = ["Banana", "Egg (large, boiled)", "Chicken breast (grilled)", "White rice (cooked)",
                                    "Greek yogurt (plain, nonfat)", "Avocado", "Oatmeal (cooked with water)", "Almonds"]

    // (name, serving, grams, kcal, protein g, carbs g, fat g)
    private typealias Row = (String, String, Double?, Double, Double, Double, Double)

    private static let rows: [Row] = [
        // Fruit
        ("Apple", "1 medium (182 g)", 182, 95, 0.5, 25, 0.3),
        ("Banana", "1 medium (118 g)", 118, 105, 1.3, 27, 0.4),
        ("Orange", "1 medium (131 g)", 131, 62, 1.2, 15.4, 0.2),
        ("Strawberries", "1 cup (152 g)", 152, 49, 1, 11.7, 0.5),
        ("Blueberries", "1 cup (148 g)", 148, 84, 1.1, 21, 0.5),
        ("Raspberries", "1 cup (123 g)", 123, 64, 1.5, 14.7, 0.8),
        ("Grapes", "1 cup (151 g)", 151, 104, 1.1, 27, 0.2),
        ("Watermelon", "1 cup diced (152 g)", 152, 46, 0.9, 11.5, 0.2),
        ("Pineapple", "1 cup chunks (165 g)", 165, 82, 0.9, 21.6, 0.2),
        ("Mango", "1 cup sliced (165 g)", 165, 99, 1.4, 24.7, 0.6),
        ("Avocado", "1/2 fruit (100 g)", 100, 160, 2, 8.5, 14.7),
        ("Pear", "1 medium (178 g)", 178, 101, 0.6, 27, 0.2),
        ("Peach", "1 medium (150 g)", 150, 59, 1.4, 14.3, 0.4),
        ("Kiwi", "1 fruit (69 g)", 69, 42, 0.8, 10.1, 0.4),
        ("Cherries", "1 cup (138 g)", 138, 87, 1.5, 22, 0.3),
        ("Dates (Medjool)", "1 date (24 g)", 24, 66, 0.4, 18, 0),
        ("Raisins", "1 small box (43 g)", 43, 129, 1.3, 34, 0.2),

        // Vegetables
        ("Broccoli (steamed)", "1 cup (156 g)", 156, 55, 3.7, 11.2, 0.6),
        ("Spinach (raw)", "2 cups (60 g)", 60, 14, 1.7, 2.2, 0.2),
        ("Carrot", "1 medium (61 g)", 61, 25, 0.6, 5.8, 0.1),
        ("Cucumber", "1 cup sliced (104 g)", 104, 16, 0.7, 3.8, 0.1),
        ("Tomato", "1 medium (123 g)", 123, 22, 1.1, 4.8, 0.2),
        ("Bell pepper", "1 medium (119 g)", 119, 31, 1, 7.2, 0.4),
        ("Mixed green salad", "2 cups (85 g)", 85, 15, 1.2, 2.9, 0.2),
        ("Sweet potato (baked)", "1 medium (114 g)", 114, 103, 2.3, 23.6, 0.2),
        ("Potato (baked)", "1 medium (173 g)", 173, 161, 4.3, 36.6, 0.2),
        ("Mashed potatoes", "1 cup (210 g)", 210, 237, 4, 35, 9),
        ("Corn on the cob", "1 ear (90 g)", 90, 88, 3.3, 19, 1.4),
        ("Green beans", "1 cup (125 g)", 125, 44, 2.4, 9.9, 0.4),
        ("Onion", "1/2 medium (55 g)", 55, 22, 0.6, 5.1, 0.1),
        ("Mushrooms", "1 cup (70 g)", 70, 15, 2.2, 2.3, 0.2),
        ("Cauliflower", "1 cup (107 g)", 107, 27, 2.1, 5.3, 0.3),
        ("Zucchini", "1 cup (124 g)", 124, 21, 1.5, 3.9, 0.4),
        ("Green peas", "1 cup (160 g)", 160, 134, 8.6, 25, 0.4),
        ("Edamame", "1 cup shelled (155 g)", 155, 188, 18.4, 13.8, 8.1),
        ("Asparagus", "6 spears (90 g)", 90, 18, 2, 3.5, 0.1),

        // Grains & bread
        ("White rice (cooked)", "1 cup (158 g)", 158, 205, 4.3, 44.5, 0.4),
        ("Brown rice (cooked)", "1 cup (195 g)", 195, 216, 5, 44.8, 1.8),
        ("Quinoa (cooked)", "1 cup (185 g)", 185, 222, 8.1, 39.4, 3.6),
        ("Pasta (cooked)", "1 cup (140 g)", 140, 221, 8.1, 43.2, 1.3),
        ("Oatmeal (cooked with water)", "1 cup (234 g)", 234, 166, 5.9, 28, 3.6),
        ("Rolled oats (dry)", "1/2 cup (40 g)", 40, 150, 5, 27, 2.5),
        ("Buckwheat (cooked)", "1 cup (168 g)", 168, 155, 5.7, 33.5, 1),
        ("Couscous (cooked)", "1 cup (157 g)", 157, 176, 6, 36.5, 0.3),
        ("White bread", "1 slice (25 g)", 25, 67, 1.9, 12.7, 0.8),
        ("Whole wheat bread", "1 slice (32 g)", 32, 82, 4, 13.8, 1.1),
        ("Sourdough bread", "1 slice (50 g)", 50, 135, 5.5, 26, 0.9),
        ("Bagel (plain)", "1 medium (105 g)", 105, 277, 11, 55, 1.4),
        ("English muffin", "1 muffin (57 g)", 57, 134, 4.4, 26, 1),
        ("Croissant", "1 medium (57 g)", 57, 231, 4.7, 26, 12),
        ("Flour tortilla", "1 medium, 8\" (49 g)", 49, 146, 3.9, 24.6, 3.6),
        ("Corn tortilla", "1 tortilla (26 g)", 26, 57, 1.5, 11.6, 0.7),
        ("Pita bread", "1 large (60 g)", 60, 165, 5.5, 33.4, 0.7),
        ("Naan", "1 piece (90 g)", 90, 262, 8.7, 45, 5.1),
        ("Pancakes", "2 pancakes, 6\" (154 g)", 154, 350, 9.6, 44, 15),
        ("Waffle", "1 round, 7\" (75 g)", 75, 218, 5.9, 24.7, 10.6),
        ("Granola", "1/2 cup (61 g)", 61, 290, 6.5, 32, 15),
        ("Corn flakes", "1 cup (28 g)", 28, 101, 2, 24, 0.2),

        // Protein
        ("Chicken breast (grilled)", "4 oz (113 g)", 113, 187, 35, 0, 4),
        ("Chicken thigh (roasted, skinless)", "4 oz (113 g)", 113, 236, 29, 0, 12.3),
        ("Rotisserie chicken (with skin)", "4 oz (113 g)", 113, 250, 28, 0, 15),
        ("Ground beef 85% (cooked)", "4 oz (113 g)", 113, 280, 29, 0, 17.5),
        ("Sirloin steak (grilled)", "6 oz (170 g)", 170, 345, 51.6, 0, 13.8),
        ("Salmon (baked)", "6 oz (170 g)", 170, 350, 37.5, 0, 21),
        ("Tuna (canned in water)", "3 oz (85 g)", 85, 99, 21.7, 0, 0.7),
        ("Shrimp (cooked)", "3 oz (85 g)", 85, 84, 20, 0.2, 0.2),
        ("White fish (baked)", "4 oz (113 g)", 113, 145, 30, 0, 3),
        ("Pork chop (grilled)", "4 oz (113 g)", 113, 236, 31, 0, 11.5),
        ("Bacon", "3 slices (24 g)", 24, 129, 9, 0.4, 10),
        ("Breakfast sausage", "2 links (48 g)", 48, 160, 9, 1, 13),
        ("Turkey breast (deli)", "2 oz (56 g)", 56, 60, 10, 2, 1),
        ("Ham (deli)", "2 oz (56 g)", 56, 61, 9.5, 1.5, 1.8),
        ("Egg (large, boiled)", "1 egg (50 g)", 50, 78, 6.3, 0.6, 5.3),
        ("Fried egg", "1 egg (46 g)", 46, 90, 6.3, 0.4, 6.8),
        ("Scrambled eggs", "2 eggs (122 g)", 122, 182, 12.2, 2, 13.4),
        ("Egg whites", "1/2 cup (122 g)", 122, 63, 13.2, 0.9, 0.2),
        ("Tofu (firm)", "1/2 cup (126 g)", 126, 181, 21.8, 3.5, 11),
        ("Lentils (cooked)", "1 cup (198 g)", 198, 230, 17.9, 39.9, 0.8),
        ("Black beans (cooked)", "1 cup (172 g)", 172, 227, 15.2, 40.8, 0.9),
        ("Chickpeas (cooked)", "1 cup (164 g)", 164, 269, 14.5, 45, 4.2),
        ("Hummus", "2 tbsp (30 g)", 30, 70, 2, 4, 5),
        ("Whey protein shake (with water)", "1 scoop (30 g)", 30, 120, 24, 3, 1.5),

        // Dairy & alternatives
        ("Milk (2%)", "1 cup (244 g)", 244, 122, 8.1, 11.7, 4.8),
        ("Milk (whole)", "1 cup (244 g)", 244, 149, 7.7, 11.7, 7.9),
        ("Milk (skim)", "1 cup (245 g)", 245, 83, 8.3, 12.2, 0.2),
        ("Oat milk", "1 cup (240 g)", 240, 120, 3, 16, 5),
        ("Almond milk (unsweetened)", "1 cup (240 g)", 240, 30, 1, 1, 2.5),
        ("Greek yogurt (plain, nonfat)", "1 container (170 g)", 170, 100, 17.3, 6.1, 0.7),
        ("Greek yogurt (plain, whole)", "1 container (170 g)", 170, 165, 15.5, 6.6, 8.6),
        ("Yogurt (flavored, low-fat)", "1 container (170 g)", 170, 150, 6, 28, 2),
        ("Cottage cheese (2%)", "1/2 cup (113 g)", 113, 92, 12, 5, 2.6),
        ("Cheddar cheese", "1 oz (28 g)", 28, 114, 7, 0.4, 9.4),
        ("Mozzarella", "1 oz (28 g)", 28, 85, 6.3, 0.7, 6.3),
        ("Parmesan (grated)", "2 tbsp (10 g)", 10, 42, 3.8, 0.4, 2.8),
        ("Feta cheese", "1 oz (28 g)", 28, 75, 4, 1.2, 6),
        ("Cream cheese", "1 tbsp (15 g)", 15, 51, 0.9, 0.8, 5),
        ("Butter", "1 tbsp (14 g)", 14, 102, 0.1, 0, 11.5),
        ("Ice cream (vanilla)", "1/2 cup (66 g)", 66, 137, 2.3, 15.6, 7.3),

        // Nuts, seeds & oils
        ("Almonds", "1 oz, ~23 nuts (28 g)", 28, 164, 6, 6.1, 14.2),
        ("Walnuts", "1 oz (28 g)", 28, 185, 4.3, 3.9, 18.5),
        ("Peanuts", "1 oz (28 g)", 28, 161, 7.3, 4.6, 14),
        ("Cashews", "1 oz (28 g)", 28, 157, 5.2, 8.6, 12.4),
        ("Sunflower seeds", "1 oz (28 g)", 28, 165, 5.5, 6.8, 14),
        ("Chia seeds", "1 tbsp (12 g)", 12, 58, 2, 5, 3.7),
        ("Peanut butter", "2 tbsp (32 g)", 32, 190, 7, 7, 16),
        ("Almond butter", "2 tbsp (32 g)", 32, 196, 6.7, 6, 17.8),
        ("Olive oil", "1 tbsp (14 g)", 14, 119, 0, 0, 13.5),

        // Drinks
        ("Coffee (black)", "1 cup (240 ml)", 240, 2, 0.3, 0, 0),
        ("Latte (2% milk)", "16 oz (473 ml)", 473, 190, 13, 19, 7),
        ("Cappuccino (2% milk)", "12 oz (355 ml)", 355, 110, 7, 10, 4),
        ("Green tea", "1 cup (240 ml)", 240, 2, 0, 0.5, 0),
        ("Orange juice", "1 cup (248 ml)", 248, 112, 1.7, 25.8, 0.5),
        ("Cola", "1 can (355 ml)", 355, 140, 0, 39, 0),
        ("Sports drink", "1 bottle (591 ml)", 591, 130, 0, 34, 0),
        ("Fruit smoothie", "16 oz (473 ml)", 473, 250, 3, 60, 1),
        ("Beer (regular)", "12 oz (355 ml)", 355, 153, 1.6, 12.6, 0),
        ("Red wine", "5 oz glass (148 ml)", 148, 125, 0.1, 3.8, 0),

        // Meals & dishes
        ("Cheese pizza", "1 slice, 14\" (107 g)", 107, 285, 12.2, 35.7, 10.4),
        ("Pepperoni pizza", "1 slice, 14\" (111 g)", 111, 313, 13, 35.5, 13.2),
        ("Cheeseburger", "1 burger (190 g)", 190, 535, 30, 40, 28),
        ("French fries", "1 medium serving (117 g)", 117, 365, 4, 48, 17),
        ("Hot dog (with bun)", "1 hot dog (98 g)", 98, 290, 10.4, 24, 17),
        ("Chicken nuggets", "6 pieces (96 g)", 96, 270, 15, 16, 16),
        ("Fried chicken drumstick", "1 piece (75 g)", 75, 195, 16, 6, 11),
        ("Chicken burrito", "1 burrito (350 g)", 350, 650, 38, 70, 22),
        ("Chicken burrito bowl", "1 bowl (500 g)", 500, 650, 45, 70, 20),
        ("Beef tacos", "2 tacos (170 g)", 170, 360, 18, 26, 20),
        ("Chicken Caesar salad", "1 bowl (300 g)", 300, 470, 35, 15, 30),
        ("Greek salad", "1 bowl (250 g)", 250, 260, 7, 12, 21),
        ("California roll", "6 pieces (170 g)", 170, 255, 9, 38, 7),
        ("Salmon nigiri", "2 pieces (70 g)", 70, 120, 7, 16, 3),
        ("Salmon poke bowl", "1 bowl (450 g)", 450, 650, 35, 75, 22),
        ("Ramen (restaurant)", "1 bowl (600 g)", 600, 550, 25, 70, 18),
        ("Beef pho", "1 bowl (700 g)", 700, 450, 30, 60, 8),
        ("Chicken pad thai", "1 plate (350 g)", 350, 650, 28, 82, 22),
        ("Chicken fried rice", "1 plate (300 g)", 300, 520, 20, 66, 19),
        ("Spaghetti with meat sauce", "1 plate (350 g)", 350, 560, 28, 70, 18),
        ("Lasagna", "1 piece (250 g)", 250, 400, 24, 32, 19),
        ("Mac and cheese", "1 cup (200 g)", 200, 380, 15, 40, 18),
        ("Chili con carne", "1 cup (253 g)", 253, 290, 20, 25, 12),
        ("Chicken noodle soup", "1 cup (240 g)", 240, 62, 3.2, 7.3, 2.4),
        ("Tomato soup", "1 cup (248 g)", 248, 90, 2, 17, 2),
        ("Borscht", "1 bowl (300 g)", 300, 170, 7, 20, 7),
        ("Plov (beef & rice pilaf)", "1 plate (300 g)", 300, 560, 22, 60, 25),
        ("Pork dumplings (steamed)", "6 pieces (150 g)", 150, 320, 14, 36, 13),
        ("Chicken shawarma wrap", "1 wrap (300 g)", 300, 600, 35, 55, 26),
        ("Chicken curry with rice", "1 plate (400 g)", 400, 620, 32, 70, 22),
        ("Omelette (2 eggs, cheese)", "1 omelette (150 g)", 150, 300, 20, 2, 23),
        ("Avocado toast", "1 slice (130 g)", 130, 240, 6, 24, 14),
        ("Grilled cheese sandwich", "1 sandwich (120 g)", 120, 390, 14, 32, 23),
        ("Turkey sandwich", "1 sandwich (200 g)", 200, 380, 25, 40, 12),
        ("Peanut butter & jelly sandwich", "1 sandwich (100 g)", 100, 350, 12, 45, 15),

        // Snacks & sweets
        ("Potato chips", "1 oz (28 g)", 28, 152, 2, 15, 9.8),
        ("Popcorn (air-popped)", "3 cups (24 g)", 24, 93, 3, 18.6, 1.1),
        ("Pretzels", "1 oz (28 g)", 28, 108, 2.9, 22.6, 0.8),
        ("Rice cakes", "2 cakes (18 g)", 18, 70, 1.4, 14.7, 0.5),
        ("Trail mix", "1/4 cup (38 g)", 38, 175, 5, 17, 11),
        ("Protein bar", "1 bar (60 g)", 60, 210, 20, 23, 7),
        ("Granola bar", "1 bar (24 g)", 24, 100, 2, 17, 3.5),
        ("Dark chocolate (70–85%)", "1 oz (28 g)", 28, 170, 2.2, 13, 12),
        ("Milk chocolate bar", "1 bar (44 g)", 44, 235, 3.4, 26, 13),
        ("Chocolate chip cookie", "1 large (40 g)", 40, 196, 2, 26, 10),
        ("Brownie", "1 square (56 g)", 56, 227, 2.7, 36, 9),
        ("Glazed donut", "1 medium (60 g)", 60, 240, 3, 31, 11),
        ("Blueberry muffin", "1 bakery muffin (113 g)", 113, 426, 6, 60, 18),
        ("Cheesecake", "1 slice (125 g)", 125, 400, 7, 32, 28),
        ("Apple pie", "1 slice (125 g)", 125, 300, 2.4, 43, 14),

        // Condiments & extras
        ("Ketchup", "1 tbsp (17 g)", 17, 17, 0.2, 4.5, 0),
        ("Mayonnaise", "1 tbsp (14 g)", 14, 94, 0.1, 0.1, 10.3),
        ("Ranch dressing", "2 tbsp (30 g)", 30, 129, 0.4, 1.8, 13.4),
        ("Honey", "1 tbsp (21 g)", 21, 64, 0.1, 17.3, 0),
        ("Maple syrup", "2 tbsp (40 g)", 40, 104, 0, 27, 0),
        ("Sugar", "1 tsp (4 g)", 4, 16, 0, 4.2, 0),
        ("Jam", "1 tbsp (20 g)", 20, 56, 0.1, 13.8, 0),
        ("Hazelnut spread", "2 tbsp (37 g)", 37, 200, 2, 22, 11),
        ("Soy sauce", "1 tbsp (16 g)", 16, 9, 1.3, 0.8, 0.1),
        ("Salsa", "2 tbsp (32 g)", 32, 10, 0.5, 2, 0.1),
        ("Guacamole", "2 tbsp (30 g)", 30, 50, 0.6, 2.6, 4.4),
        ("Sour cream", "2 tbsp (24 g)", 24, 47, 0.6, 1.1, 4.6),
    ]
}
