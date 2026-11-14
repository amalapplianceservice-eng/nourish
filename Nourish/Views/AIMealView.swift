import SwiftUI
import SwiftData
import PhotosUI

/// Describe a meal in plain words (and optionally add a photo); Claude breaks it into foods with calories and macros.
struct AIMealView: View {
    let day: Date
    let meal: MealType
    let onLogged: () -> Void

    @Environment(\.modelContext) private var context

    @State private var text = ""
    @State private var imageData: Data?
    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var isLoading = false
    @State private var estimate: MealEstimate?
    @State private var included: Set<UUID> = []
    @State private var errorMessage: String?
    @State private var saveAsMeal = false
    @State private var hasKey = MealEstimator.hasKey
    @State private var keyDraft = ""
    @FocusState private var textFocused: Bool

    private let examples = [
        "2 scrambled eggs, sourdough toast with butter, oat latte",
        "Chicken burrito bowl: rice, black beans, salsa, guac",
        "3 slices of pepperoni pizza and a cola",
        "Big bowl of Greek yogurt with honey, granola & berries",
    ]

    private var selectedItems: [EstimatedItem] {
        estimate?.items.filter { included.contains($0.id) } ?? []
    }

    private var selectedTotal: Nutrition {
        selectedItems.reduce(.zero) { $0 + $1.asFoodItem.nutrition }
    }

    private var canEstimate: Bool {
        hasKey && !isLoading && (!text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || imageData != nil)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if !hasKey { keyCard }
                inputCard
                if text.isEmpty && estimate == nil { examplesRow }
                estimateButton
                if let errorMessage {
                    Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                        .font(.subheadline)
                        .foregroundStyle(Theme.over)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)
                }
                if let estimate { resultCard(estimate) }
            }
            .padding()
            .padding(.bottom, 24)
        }
        .scrollDismissesKeyboard(.interactively)
        .onAppear { hasKey = MealEstimator.hasKey }
        .onChange(of: photoItem) { _, newItem in loadPhoto(newItem) }
        .sensoryFeedback(.success, trigger: estimate?.mealName)
        #if os(iOS)
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker { image in
                imageData = ImageSupport.preparedJPEG(from: image)
            }
            .ignoresSafeArea()
        }
        #endif
    }

    // MARK: Sections

    private var keyCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Connect AI estimates", systemImage: "key.fill")
                .font(.headline)
            Text("Paste your Anthropic API key once. It's stored only in this iPhone's Keychain.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack {
                SecureField("sk-ant-…", text: $keyDraft)
                    .textContentType(.password)
                    .autocorrectionDisabled()
                    .padding(10)
                    .background(Theme.fieldBackground, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                Button("Save") {
                    KeychainStore.set(keyDraft.trimmingCharacters(in: .whitespacesAndNewlines), for: MealEstimator.apiKeyAccount)
                    keyDraft = ""
                    withAnimation { hasKey = MealEstimator.hasKey }
                }
                .buttonStyle(.borderedProminent)
                .disabled(keyDraft.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            Link("Get a key at console.anthropic.com", destination: URL(string: "https://console.anthropic.com/settings/keys")!)
                .font(.caption.weight(.semibold))
        }
        .card()
    }

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("What did you eat?", systemImage: "sparkles")
                    .font(.headline)
                    .foregroundStyle(Theme.aiGradient)
                Spacer()
            }

            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text("Describe your meal and portion sizes. The more detail, the better the estimate.")
                        .foregroundStyle(.tertiary)
                        .padding(.top, 8)
                        .padding(.leading, 5)
                        .allowsHitTesting(false)
                }
                TextEditor(text: $text)
                    .focused($textFocused)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 110)
            }

            HStack(spacing: 10) {
                if ImageSupport.isCameraAvailable {
                    Button { showCamera = true } label: {
                        Label("Camera", systemImage: "camera.fill").photoChip()
                    }
                    .buttonStyle(.plain)
                }
                PhotosPicker(selection: $photoItem, matching: .images) {
                    Label("Photo", systemImage: "photo.on.rectangle").photoChip()
                }
                .buttonStyle(.plain)

                Spacer()

                if let imageData, let image = ImageSupport.image(from: imageData) {
                    image
                        .resizable()
                        .scaledToFill()
                        .frame(width: 52, height: 52)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(alignment: .topTrailing) {
                            Button {
                                withAnimation { self.imageData = nil; photoItem = nil }
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .symbolRenderingMode(.palette)
                                    .foregroundStyle(.white, .black.opacity(0.6))
                            }
                            .buttonStyle(.plain)
                            .offset(x: 6, y: -6)
                        }
                        .transition(.scale.combined(with: .opacity))
                }
            }
        }
        .card()
    }

    private var examplesRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(examples, id: \.self) { example in
                    Button { text = example } label: {
                        Text(example)
                            .font(.caption.weight(.medium))
                            .lineLimit(1)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.card, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var estimateButton: some View {
        Button(action: runEstimate) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView().tint(.white)
                    Text("Analyzing your meal…")
                } else {
                    Image(systemName: "wand.and.stars")
                    Text(estimate == nil ? "Estimate calories" : "Re-estimate")
                }
            }
        }
        .buttonStyle(.ai)
        .disabled(!canEstimate)
        .opacity(canEstimate || isLoading ? 1 : 0.5)
    }

    private func resultCard(_ estimate: MealEstimate) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .firstTextBaseline) {
                Text(estimate.mealName).font(.title3.weight(.bold))
                Spacer()
                Text("\(estimate.confidence.capitalized) confidence")
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(confidenceColor(estimate.confidence).opacity(0.15), in: Capsule())
                    .foregroundStyle(confidenceColor(estimate.confidence))
            }

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(selectedTotal.calories.kcal)
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .contentTransition(.numericText(value: selectedTotal.calories))
                    .animation(.smooth, value: selectedTotal.calories)
                Text("kcal").foregroundStyle(.secondary)
                Spacer()
                MacroPills(nutrition: selectedTotal)
            }

            VStack(spacing: 0) {
                ForEach(estimate.items) { item in
                    let isOn = included.contains(item.id)
                    Button {
                        withAnimation(.snappy) {
                            if isOn { included.remove(item.id) } else { included.insert(item.id) }
                        }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                                .foregroundStyle(isOn ? Color.accentColor : .secondary)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.name).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                                Text(item.portion).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(item.calories.kcal).font(.subheadline.weight(.semibold)).monospacedDigit()
                                .foregroundStyle(isOn ? .primary : .secondary)
                        }
                        .padding(.vertical, 10)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if item.id != estimate.items.last?.id { Divider() }
                }
            }

            if !estimate.assumptions.isEmpty {
                Label(estimate.assumptions, systemImage: "info.circle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Toggle(isOn: $saveAsMeal) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Save to My Foods").font(.subheadline.weight(.semibold))
                    Text("Log this exact meal again in one tap.").font(.caption).foregroundStyle(.secondary)
                }
            }
            .tint(.accentColor)

            Button(action: logSelected) {
                Label("Log \(selectedItems.count) item\(selectedItems.count == 1 ? "" : "s") to \(meal.title)", systemImage: "plus")
            }
            .buttonStyle(.primary)
            .disabled(selectedItems.isEmpty)
        }
        .card(padding: 20)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func confidenceColor(_ c: String) -> Color {
        switch c {
        case "high": .accentColor
        case "low": .orange
        default: Theme.fat
        }
    }

    // MARK: Actions

    private func loadPhoto(_ item: PhotosPickerItem?) {
        guard let item else { return }
        Task {
            if let data = try? await item.loadTransferable(type: Data.self) {
                let prepared = ImageSupport.preparedJPEG(from: data)
                await MainActor.run { withAnimation { imageData = prepared } }
            }
        }
    }

    private func runEstimate() {
        textFocused = false
        errorMessage = nil
        isLoading = true
        let description = text
        let image = imageData
        Task {
            do {
                let result = try await MealEstimator.estimate(description: description, imageJPEG: image)
                await MainActor.run {
                    withAnimation(.smooth) {
                        estimate = result
                        included = Set(result.items.map(\.id))
                        if result.items.isEmpty {
                            errorMessage = result.assumptions.isEmpty ? "No foods recognized." : result.assumptions
                        }
                    }
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    withAnimation { errorMessage = error.localizedDescription }
                    isLoading = false
                }
            }
        }
    }

    private func logSelected() {
        guard let estimate else { return }
        for item in selectedItems {
            context.insert(FoodEntry(item: item.asFoodItem, servings: 1, loggedInGrams: false, meal: meal, day: day))
        }
        if saveAsMeal {
            let total = selectedTotal
            let grams = selectedItems.reduce(0) { $0 + $1.grams }
            let summary = selectedItems.map(\.name).joined(separator: ", ")
            context.insert(CustomFood(name: estimate.mealName, brand: nil,
                                      servingLabel: "1 meal (\(summary))", servingGrams: grams > 0 ? grams : nil,
                                      calories: total.calories, protein: total.protein, carbs: total.carbs, fat: total.fat))
        }
        try? context.save()
        onLogged()
    }
}

private extension View {
    func photoChip() -> some View {
        self
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Theme.fieldBackground, in: Capsule())
    }
}
