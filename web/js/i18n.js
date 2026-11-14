// Translations: English, Russian, Spanish, Simplified Chinese.
// t('key', { vars }) looks up the current language, falling back to English.
import { getState } from './store.js';

export const LANGS = [
  { id: 'en', label: 'English', locale: 'en-US', aiName: 'English' },
  { id: 'ru', label: 'Русский', locale: 'ru-RU', aiName: 'Russian' },
  { id: 'es', label: 'Español', locale: 'es-ES', aiName: 'Spanish' },
  { id: 'zh', label: '中文', locale: 'zh-CN', aiName: 'Simplified Chinese' },
];

export function detectLang() {
  const l = (navigator.language || 'en').toLowerCase();
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('es')) return 'es';
  if (l.startsWith('zh')) return 'zh';
  return 'en';
}

export const lang = () => getState().settings.lang || detectLang();
export const langInfo = () => LANGS.find((l) => l.id === lang()) || LANGS[0];
export const locale = () => langInfo().locale;

/** Russian plural forms: 1 день, 2 дня, 5 дней. */
const ru = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
};

const DICT = {
  en: {
    done: 'Done', back: 'Back', cancel: 'Cancel', save: 'Save', remove: 'Remove', clear: 'Clear', language: 'Language',
    'tab.diary': 'Diary', 'tab.progress': 'Progress', 'tab.settings': 'Settings',
    'meal.breakfast': 'Breakfast', 'meal.lunch': 'Lunch', 'meal.dinner': 'Dinner', 'meal.snacks': 'Snacks', meal: 'Meal',
    'u.kcal': 'kcal', 'u.g': 'g', 'u.ml': 'ml', 'u.cm': 'cm', 'u.kg': 'kg', 'u.lb': 'lb',
    'm.protein': 'Protein', 'm.carbs': 'Carbs', 'm.fat': 'Fat', 'm.P': 'P', 'm.C': 'C', 'm.F': 'F',
    'src.builtIn': 'Nourish database', 'src.usda': 'USDA FoodData Central', 'src.openFoodFacts': 'Open Food Facts', 'src.custom': 'My food', 'src.ai': 'AI estimate',

    'day.today': 'Today', 'day.yesterday': 'Yesterday', 'day.tomorrow': 'Tomorrow',
    'diary.goal': 'Goal', 'diary.eaten': 'Eaten', 'diary.remaining': 'Remaining', 'diary.addFood': 'Add food',
    'ring.left': 'kcal left', 'ring.over': 'kcal over',
    'week.prev': 'Previous week', 'week.next': 'Next week',
    'install.title': 'Install Nourish on your iPhone', 'install.before': 'Tap', 'install.after': 'Share, then Add to Home Screen.', dismiss: 'Dismiss',

    'add.search': 'Search', 'add.ai': '✦ AI Meal', 'add.create': 'Create',
    'search.placeholder': 'Search foods & brands', 'search.recent': 'Recent', 'search.mine': 'My foods & meals', 'search.popular': 'Popular',
    'search.common': 'Common foods', 'search.brands': 'Brands & packaged', 'search.loading': 'Searching USDA database…',
    'search.none': 'No branded matches. Try the ✦ AI Meal tab — just describe it.',
    'search.rate': 'Free search limit reached for now. Add a free USDA key in Settings for unlimited search.',
    'search.error': "Couldn't reach the online database.", 'search.typing': 'Keep typing to search 400k+ products…',
    'search.footer': 'Branded data from USDA FoodData Central.',
    'search.quickAdd': 'Quick add one serving', 'search.scan': 'Scan a barcode',
    'toast.addedTo': 'Added to {meal}', 'toast.saved': 'Saved', 'toast.removed': 'Removed', 'toast.loggedAgain': 'Logged again today',

    'detail.edit': 'Edit entry', 'detail.amount': 'Amount', 'detail.servings': 'Servings', 'detail.grams': 'Grams', 'detail.servingsWord': 'servings',
    'detail.oneServing': '1 serving = {label}', 'detail.logAgain': 'Log again today', 'detail.remove': 'Remove from diary',
    'detail.save': 'Save changes', 'detail.addTo': 'Add to {meal}',

    'ai.connect': 'Connect AI estimates', 'ai.connectBody': "Paste your Anthropic API key once. It's stored only on this device.",
    'ai.getKey': 'Get a key at console.anthropic.com →', 'ai.question': '✦ What did you eat?',
    'ai.placeholder': 'Describe your meal and portion sizes. The more detail, the better the estimate.',
    'ai.camera': 'Camera', 'ai.photo': 'Photo', 'ai.removePhoto': 'Remove photo', 'ai.estimate': 'Estimate calories', 'ai.reestimate': 'Re-estimate',
    'ai.analyzing': 'Analyzing your meal…', 'conf.high': 'High confidence', 'conf.medium': 'Medium confidence', 'conf.low': 'Low confidence',
    'ai.saveMeal': 'Save to My Foods', 'ai.saveMealSub': 'Log this exact meal again in one tap.',
    'ai.log': ({ n, meal }) => `Log ${n} item${n === 1 ? '' : 's'} to ${meal}`,
    'toast.logged': ({ n }) => `Logged ${n} item${n === 1 ? '' : 's'}`,
    'ai.noFoods': 'No foods recognized.', 'ai.photoError': "Couldn't read that photo.",
    'ai.examples': ['2 scrambled eggs, sourdough toast with butter, oat latte', 'Chicken burrito bowl: rice, black beans, salsa, guac',
      '3 slices of pepperoni pizza and a cola', 'Big bowl of Greek yogurt with honey, granola & berries'],
    'ai.photoOnly': 'Estimate the meal in this photo.',

    'err.noKey': 'Add your Anthropic API key to use AI estimates.', 'err.network': "Couldn't reach the AI service. Check your connection.",
    'err.badKey': 'Your API key was rejected. Check it in Settings.', 'err.rate': 'Too many requests right now. Try again in a moment.',
    'err.busy': 'The AI service is busy. Try again in a few seconds.', 'err.failed': 'Request failed ({status}).',
    'err.refusal': "The AI couldn't estimate this one. Try describing it differently.", 'err.unexpected': 'Got an unexpected response. Please try again.',

    'create.food': 'Food', 'create.name': "Name (e.g. Mom's lasagna)", 'create.brand': 'Brand or note (optional)', 'create.serving': 'Serving',
    'create.servingDesc': 'Serving description', 'create.servingWeight': 'Serving weight', 'create.optional': 'optional',
    'create.weightHint': 'Add the weight to log this food by grams later.', 'create.nutrition': 'Nutrition per serving', 'create.calories': 'Calories',
    'create.caloriesHint': 'Leave calories blank to calculate them from macros.', 'create.saveLog': 'Save & add to {meal}',
    'create.saveOnly': 'Save to My Foods only', 'create.defaultServing': '1 serving', 'toast.savedFoods': 'Saved to My Foods',
    'create.barcodeHint': "Copy the numbers from the nutrition label. Next time you scan this barcode, it'll come up instantly.", 'create.removeBarcode': 'Remove barcode',

    'progress.7': '7 days', 'progress.30': '30 days', 'progress.avg': 'Daily average', 'progress.streak': 'Logging streak',
    'progress.onTarget': 'On target', 'progress.avgProtein': 'Avg protein', 'u.days': ({ n }) => (n === 1 ? 'day' : 'days'),
    'progress.calories': 'Calories', 'progress.goal': 'Goal {n}', 'progress.macros': 'Average macros', 'progress.top': 'Most logged',
    'progress.empty': 'Log a few meals and your trends will appear here.', 'progress.chart': 'Daily calories chart',

    'settings.goals': 'Daily goals', 'settings.recalc': 'Recalculate from my profile', 'settings.ai': 'AI meal estimates',
    'settings.anthropicKey': 'Anthropic API key', 'settings.anthropicPh': 'Anthropic API key (sk-ant-…)', 'settings.keySaved': '{label} saved',
    'settings.aiFooter': 'Powered by Claude. Meal descriptions and photos go to Anthropic only when you tap Estimate; each estimate costs about a cent.',
    'settings.getKey': 'Get a key →', 'settings.search': 'Food search', 'settings.usdaKey': 'USDA key', 'settings.usdaPh': 'Free USDA API key (optional)',
    'settings.usdaFooter': 'Branded search works without a key but is rate-limited. A free key removes the limit.', 'settings.getFreeKey': 'Get a free key →',
    'settings.data': 'Data', 'settings.export': 'Export backup', 'settings.restore': 'Restore from backup', 'settings.deleteAll': 'Delete all diary entries',
    'settings.dataFooter': 'Everything is stored on this device only. Export a backup now and then.', 'settings.about': 'About', 'settings.version': 'Version',
    'settings.installHow': 'Install on iPhone: open in Safari → Share → Add to Home Screen.',
    'settings.aboutFooter': 'Food data: USDA FoodData Central and Open Food Facts. Nutrition values are estimates for general wellness tracking and are not medical advice.',
    'settings.calc': 'Goal calculator', 'confirm.deleteAll': "Delete every logged entry? This can't be undone.", 'toast.cleared': 'Diary cleared',
    'confirm.restore': ({ n }) => `Replace your diary with this backup (${n} entries)?`, 'toast.restored': 'Backup restored',
    'alert.badBackup': "That file isn't a Nourish backup.", 'toast.keySaved': 'Key saved', 'toast.goals': 'Goals updated',
    'myfoods.empty': 'No saved foods yet. Create a food or save an AI-estimated meal and it shows up here.', 'confirm.deleteFood': 'Delete “{name}”?',
    delete: 'Delete',

    'goal.your': 'Your goal', 'goal.lose': 'Lose weight', 'goal.maintain': 'Maintain', 'goal.gain': 'Build muscle', 'goal.about': 'About you',
    'sex.female': 'Female', 'sex.male': 'Male', age: 'Age', height: 'Height', weight: 'Weight', 'goal.activity': 'Activity level',
    'act.sedentary': 'Sedentary', 'act.sedentary.sub': 'Desk job, little exercise', 'act.light': 'Lightly active', 'act.light.sub': 'Exercise 1–3 days a week',
    'act.moderate': 'Moderately active', 'act.moderate.sub': 'Exercise 3–5 days a week', 'act.active': 'Very active', 'act.active.sub': 'Hard exercise 6–7 days a week',
    'act.athlete': 'Athlete', 'act.athlete.sub': 'Physical job or twice-daily training',
    'goal.target': 'Your daily target', 'goal.save': 'Save goals',

    'onb.tagline': 'Track what you eat in seconds.\nSearch foods or just describe your meal.',
    'onb.f1': 'Huge food database', 'onb.f1s': 'Common foods offline, plus 400k+ branded products.',
    'onb.f2': 'AI meal estimates', 'onb.f2s': 'Type “chicken bowl with rice” or snap a photo.',
    'onb.f3': 'See your progress', 'onb.f3s': 'Calories, macros, streaks and trends.',
    'onb.start': 'Get started', 'onb.private': 'Your data stays on this device.', 'onb.setGoals': 'Set your goals', 'onb.track': 'Start tracking',

    'scan.title': 'Scan barcode', 'scan.close': 'Close scanner', 'scan.flash': 'Flashlight', 'scan.starting': 'Starting camera…',
    'scan.point': 'Point at the barcode on the package', 'scan.looking': 'Looking up {code}…', 'scan.noCamera': 'Camera not available',
    'scan.noCameraBody': 'Allow camera access for this site in Safari settings, or type the barcode number below.',
    'scan.notFound': 'Product not found', 'scan.notFoundBody': "No nutrition data for {code} yet. Add it once and it'll be found next time.",
    'scan.offline': "Couldn't reach the food databases. Check your connection.", 'scan.again': 'Scan again', 'scan.addIt': 'Add it',
    'scan.type': 'Type the number instead', 'scan.number': 'Barcode number', 'scan.lookup': 'Look up', 'scan.loadError': 'Could not load the barcode reader.',
  },

  ru: {
    done: 'Готово', back: 'Назад', cancel: 'Отмена', save: 'Сохранить', remove: 'Удалить', clear: 'Очистить', language: 'Язык',
    'tab.diary': 'Дневник', 'tab.progress': 'Прогресс', 'tab.settings': 'Настройки',
    'meal.breakfast': 'Завтрак', 'meal.lunch': 'Обед', 'meal.dinner': 'Ужин', 'meal.snacks': 'Перекусы', meal: 'Приём пищи',
    'u.kcal': 'ккал', 'u.g': 'г', 'u.ml': 'мл', 'u.cm': 'см', 'u.kg': 'кг', 'u.lb': 'фнт',
    'm.protein': 'Белки', 'm.carbs': 'Углеводы', 'm.fat': 'Жиры', 'm.P': 'Б', 'm.C': 'У', 'm.F': 'Ж',
    'src.builtIn': 'База Nourish', 'src.usda': 'USDA FoodData Central', 'src.openFoodFacts': 'Open Food Facts', 'src.custom': 'Мой продукт', 'src.ai': 'Оценка ИИ',

    'day.today': 'Сегодня', 'day.yesterday': 'Вчера', 'day.tomorrow': 'Завтра',
    'diary.goal': 'Цель', 'diary.eaten': 'Съедено', 'diary.remaining': 'Осталось', 'diary.addFood': 'Добавить еду',
    'ring.left': 'ккал осталось', 'ring.over': 'ккал сверх',
    'week.prev': 'Предыдущая неделя', 'week.next': 'Следующая неделя',
    'install.title': 'Установите Nourish на iPhone', 'install.before': 'Нажмите', 'install.after': '«Поделиться», затем «На экран „Домой“».', dismiss: 'Закрыть',

    'add.search': 'Поиск', 'add.ai': '✦ ИИ-блюдо', 'add.create': 'Создать',
    'search.placeholder': 'Поиск продуктов и брендов', 'search.recent': 'Недавние', 'search.mine': 'Мои продукты и блюда', 'search.popular': 'Популярное',
    'search.common': 'Обычные продукты', 'search.brands': 'Бренды и упаковки', 'search.loading': 'Ищем в базе USDA…',
    'search.none': 'Нет совпадений среди брендов. Попробуйте вкладку ✦ ИИ-блюдо — просто опишите еду.',
    'search.rate': 'Лимит бесплатного поиска исчерпан. Добавьте бесплатный ключ USDA в Настройках.',
    'search.error': 'Не удалось подключиться к онлайн-базе.', 'search.typing': 'Продолжайте вводить для поиска среди 400 тыс.+ товаров…',
    'search.footer': 'Данные брендов — USDA FoodData Central (на английском, поэтому ищите бренды по-английски).',
    'search.quickAdd': 'Быстро добавить одну порцию', 'search.scan': 'Сканировать штрихкод',
    'toast.addedTo': 'Добавлено: {meal}', 'toast.saved': 'Сохранено', 'toast.removed': 'Удалено', 'toast.loggedAgain': 'Снова добавлено сегодня',

    'detail.edit': 'Изменить запись', 'detail.amount': 'Количество', 'detail.servings': 'Порции', 'detail.grams': 'Граммы', 'detail.servingsWord': 'порц.',
    'detail.oneServing': '1 порция = {label}', 'detail.logAgain': 'Добавить снова сегодня', 'detail.remove': 'Удалить из дневника',
    'detail.save': 'Сохранить', 'detail.addTo': 'Добавить: {meal}',

    'ai.connect': 'Подключите ИИ-оценку', 'ai.connectBody': 'Вставьте ключ Anthropic API один раз. Он хранится только на этом устройстве.',
    'ai.getKey': 'Получить ключ на console.anthropic.com →', 'ai.question': '✦ Что вы съели?',
    'ai.placeholder': 'Опишите блюдо и размер порции. Чем подробнее, тем точнее оценка.',
    'ai.camera': 'Камера', 'ai.photo': 'Фото', 'ai.removePhoto': 'Удалить фото', 'ai.estimate': 'Оценить калории', 'ai.reestimate': 'Оценить заново',
    'ai.analyzing': 'Анализируем блюдо…', 'conf.high': 'Высокая точность', 'conf.medium': 'Средняя точность', 'conf.low': 'Низкая точность',
    'ai.saveMeal': 'Сохранить в «Мои продукты»', 'ai.saveMealSub': 'Добавляйте это блюдо снова в одно касание.',
    'ai.log': ({ n, meal }) => `Добавить ${n} ${ru(n, 'продукт', 'продукта', 'продуктов')}: ${meal}`,
    'toast.logged': ({ n }) => `Добавлено: ${n} ${ru(n, 'продукт', 'продукта', 'продуктов')}`,
    'ai.noFoods': 'Еда не распознана.', 'ai.photoError': 'Не удалось прочитать фото.',
    'ai.examples': ['2 яйца-болтуньи, тост из хлеба на закваске с маслом, латте на овсяном', 'Гречка с куриной грудкой и огурцом',
      'Тарелка борща со сметаной и кусок чёрного хлеба', '3 куска пиццы пепперони и кола'],
    'ai.photoOnly': 'Оцени блюдо на этом фото.',

    'err.noKey': 'Добавьте ключ Anthropic API, чтобы пользоваться ИИ-оценкой.', 'err.network': 'Не удалось подключиться к ИИ. Проверьте интернет.',
    'err.badKey': 'Ключ API отклонён. Проверьте его в Настройках.', 'err.rate': 'Слишком много запросов. Попробуйте чуть позже.',
    'err.busy': 'Сервис ИИ занят. Попробуйте через несколько секунд.', 'err.failed': 'Ошибка запроса ({status}).',
    'err.refusal': 'ИИ не смог оценить это блюдо. Попробуйте описать иначе.', 'err.unexpected': 'Неожиданный ответ. Попробуйте ещё раз.',

    'create.food': 'Продукт', 'create.name': 'Название (напр. «Мамина лазанья»)', 'create.brand': 'Бренд или заметка (необязательно)', 'create.serving': 'Порция',
    'create.servingDesc': 'Описание порции', 'create.servingWeight': 'Вес порции', 'create.optional': 'необяз.',
    'create.weightHint': 'Укажите вес, чтобы потом добавлять продукт в граммах.', 'create.nutrition': 'Пищевая ценность на порцию', 'create.calories': 'Калории',
    'create.caloriesHint': 'Оставьте калории пустыми — они посчитаются по БЖУ.', 'create.saveLog': 'Сохранить и добавить: {meal}',
    'create.saveOnly': 'Только сохранить в «Мои продукты»', 'create.defaultServing': '1 порция', 'toast.savedFoods': 'Сохранено в «Мои продукты»',
    'create.barcodeHint': 'Перепишите цифры с этикетки. В следующий раз этот штрихкод найдётся сразу.', 'create.removeBarcode': 'Убрать штрихкод',

    'progress.7': '7 дней', 'progress.30': '30 дней', 'progress.avg': 'В среднем за день', 'progress.streak': 'Серия',
    'progress.onTarget': 'В пределах цели', 'progress.avgProtein': 'Белок в среднем', 'u.days': ({ n }) => ru(n, 'день', 'дня', 'дней'),
    'progress.calories': 'Калории', 'progress.goal': 'Цель {n}', 'progress.macros': 'БЖУ в среднем', 'progress.top': 'Чаще всего',
    'progress.empty': 'Добавьте несколько приёмов пищи, и здесь появится статистика.', 'progress.chart': 'График калорий по дням',

    'settings.goals': 'Цели на день', 'settings.recalc': 'Пересчитать по моему профилю', 'settings.ai': 'ИИ-оценка блюд',
    'settings.anthropicKey': 'Ключ Anthropic API', 'settings.anthropicPh': 'Ключ Anthropic API (sk-ant-…)', 'settings.keySaved': '{label} сохранён',
    'settings.aiFooter': 'Работает на Claude. Описания и фото блюд отправляются в Anthropic только при нажатии «Оценить»; одна оценка стоит около цента.',
    'settings.getKey': 'Получить ключ →', 'settings.search': 'Поиск продуктов', 'settings.usdaKey': 'Ключ USDA', 'settings.usdaPh': 'Бесплатный ключ USDA (необязательно)',
    'settings.usdaFooter': 'Поиск брендов работает без ключа, но с лимитом. Бесплатный ключ снимает ограничение.', 'settings.getFreeKey': 'Получить бесплатный ключ →',
    'settings.data': 'Данные', 'settings.export': 'Экспорт резервной копии', 'settings.restore': 'Восстановить из копии', 'settings.deleteAll': 'Удалить все записи дневника',
    'settings.dataFooter': 'Все данные хранятся только на этом устройстве. Время от времени делайте резервную копию.', 'settings.about': 'О приложении', 'settings.version': 'Версия',
    'settings.installHow': 'Установка на iPhone: откройте в Safari → «Поделиться» → «На экран „Домой“».',
    'settings.aboutFooter': 'Данные о продуктах: USDA FoodData Central и Open Food Facts. Значения приблизительные, это не медицинская рекомендация.',
    'settings.calc': 'Калькулятор целей', 'confirm.deleteAll': 'Удалить все записи? Это действие нельзя отменить.', 'toast.cleared': 'Дневник очищен',
    'confirm.restore': ({ n }) => `Заменить дневник этой копией (${n} ${ru(n, 'запись', 'записи', 'записей')})?`, 'toast.restored': 'Копия восстановлена',
    'alert.badBackup': 'Этот файл не является резервной копией Nourish.', 'toast.keySaved': 'Ключ сохранён', 'toast.goals': 'Цели обновлены',
    'myfoods.empty': 'Пока нет сохранённых продуктов. Создайте продукт или сохраните блюдо, оценённое ИИ.', 'confirm.deleteFood': 'Удалить «{name}»?',
    delete: 'Удалить',

    'goal.your': 'Ваша цель', 'goal.lose': 'Похудеть', 'goal.maintain': 'Поддерживать', 'goal.gain': 'Набрать мышцы', 'goal.about': 'О вас',
    'sex.female': 'Женский', 'sex.male': 'Мужской', age: 'Возраст', height: 'Рост', weight: 'Вес', 'goal.activity': 'Уровень активности',
    'act.sedentary': 'Сидячий образ жизни', 'act.sedentary.sub': 'Офисная работа, мало движения', 'act.light': 'Лёгкая активность', 'act.light.sub': 'Тренировки 1–3 раза в неделю',
    'act.moderate': 'Средняя активность', 'act.moderate.sub': 'Тренировки 3–5 раз в неделю', 'act.active': 'Высокая активность', 'act.active.sub': 'Интенсивные тренировки 6–7 раз в неделю',
    'act.athlete': 'Спортсмен', 'act.athlete.sub': 'Физический труд или тренировки дважды в день',
    'goal.target': 'Ваша норма на день', 'goal.save': 'Сохранить цели',

    'onb.tagline': 'Записывайте еду за секунды.\nИщите продукты или просто опишите блюдо.',
    'onb.f1': 'Огромная база продуктов', 'onb.f1s': 'Обычные продукты офлайн и 400 тыс.+ товаров брендов.',
    'onb.f2': 'ИИ-оценка блюд', 'onb.f2s': 'Напишите «гречка с курицей» или сфотографируйте тарелку.',
    'onb.f3': 'Следите за прогрессом', 'onb.f3s': 'Калории, БЖУ, серии и тренды.',
    'onb.start': 'Начать', 'onb.private': 'Ваши данные остаются на этом устройстве.', 'onb.setGoals': 'Ваши цели', 'onb.track': 'Начать отслеживать',

    'scan.title': 'Сканирование штрихкода', 'scan.close': 'Закрыть сканер', 'scan.flash': 'Фонарик', 'scan.starting': 'Включаем камеру…',
    'scan.point': 'Наведите камеру на штрихкод на упаковке', 'scan.looking': 'Ищем {code}…', 'scan.noCamera': 'Камера недоступна',
    'scan.noCameraBody': 'Разрешите доступ к камере для этого сайта в настройках Safari или введите номер штрихкода ниже.',
    'scan.notFound': 'Товар не найден', 'scan.notFoundBody': 'Для {code} пока нет данных. Добавьте его один раз — и в следующий раз он найдётся.',
    'scan.offline': 'Не удалось подключиться к базам продуктов. Проверьте интернет.', 'scan.again': 'Сканировать снова', 'scan.addIt': 'Добавить',
    'scan.type': 'Ввести номер вручную', 'scan.number': 'Номер штрихкода', 'scan.lookup': 'Найти', 'scan.loadError': 'Не удалось загрузить сканер штрихкодов.',
  },

  es: {
    done: 'Listo', back: 'Atrás', cancel: 'Cancelar', save: 'Guardar', remove: 'Quitar', clear: 'Borrar', language: 'Idioma',
    'tab.diary': 'Diario', 'tab.progress': 'Progreso', 'tab.settings': 'Ajustes',
    'meal.breakfast': 'Desayuno', 'meal.lunch': 'Almuerzo', 'meal.dinner': 'Cena', 'meal.snacks': 'Snacks', meal: 'Comida',
    'u.kcal': 'kcal', 'u.g': 'g', 'u.ml': 'ml', 'u.cm': 'cm', 'u.kg': 'kg', 'u.lb': 'lb',
    'm.protein': 'Proteína', 'm.carbs': 'Carbohidratos', 'm.fat': 'Grasa', 'm.P': 'P', 'm.C': 'C', 'm.F': 'G',
    'src.builtIn': 'Base de Nourish', 'src.usda': 'USDA FoodData Central', 'src.openFoodFacts': 'Open Food Facts', 'src.custom': 'Mi alimento', 'src.ai': 'Estimación IA',

    'day.today': 'Hoy', 'day.yesterday': 'Ayer', 'day.tomorrow': 'Mañana',
    'diary.goal': 'Meta', 'diary.eaten': 'Consumido', 'diary.remaining': 'Restante', 'diary.addFood': 'Añadir alimento',
    'ring.left': 'kcal restantes', 'ring.over': 'kcal de más',
    'week.prev': 'Semana anterior', 'week.next': 'Semana siguiente',
    'install.title': 'Instala Nourish en tu iPhone', 'install.before': 'Toca', 'install.after': 'Compartir y luego Añadir a pantalla de inicio.', dismiss: 'Cerrar',

    'add.search': 'Buscar', 'add.ai': '✦ Comida IA', 'add.create': 'Crear',
    'search.placeholder': 'Buscar alimentos y marcas', 'search.recent': 'Recientes', 'search.mine': 'Mis alimentos y comidas', 'search.popular': 'Populares',
    'search.common': 'Alimentos comunes', 'search.brands': 'Marcas y envasados', 'search.loading': 'Buscando en la base de USDA…',
    'search.none': 'Sin coincidencias de marcas. Prueba la pestaña ✦ Comida IA: solo descríbela.',
    'search.rate': 'Se alcanzó el límite de búsqueda gratuita. Añade una clave gratuita de USDA en Ajustes.',
    'search.error': 'No se pudo conectar con la base de datos en línea.', 'search.typing': 'Sigue escribiendo para buscar entre más de 400 mil productos…',
    'search.footer': 'Datos de marcas: USDA FoodData Central (en inglés; busca las marcas en inglés).',
    'search.quickAdd': 'Añadir una porción rápidamente', 'search.scan': 'Escanear un código de barras',
    'toast.addedTo': 'Añadido a {meal}', 'toast.saved': 'Guardado', 'toast.removed': 'Eliminado', 'toast.loggedAgain': 'Registrado de nuevo hoy',

    'detail.edit': 'Editar registro', 'detail.amount': 'Cantidad', 'detail.servings': 'Porciones', 'detail.grams': 'Gramos', 'detail.servingsWord': 'porciones',
    'detail.oneServing': '1 porción = {label}', 'detail.logAgain': 'Registrar de nuevo hoy', 'detail.remove': 'Quitar del diario',
    'detail.save': 'Guardar cambios', 'detail.addTo': 'Añadir a {meal}',

    'ai.connect': 'Conecta las estimaciones con IA', 'ai.connectBody': 'Pega tu clave de API de Anthropic una vez. Solo se guarda en este dispositivo.',
    'ai.getKey': 'Consigue una clave en console.anthropic.com →', 'ai.question': '✦ ¿Qué comiste?',
    'ai.placeholder': 'Describe tu comida y el tamaño de las porciones. Cuanto más detalle, mejor la estimación.',
    'ai.camera': 'Cámara', 'ai.photo': 'Foto', 'ai.removePhoto': 'Quitar foto', 'ai.estimate': 'Estimar calorías', 'ai.reestimate': 'Volver a estimar',
    'ai.analyzing': 'Analizando tu comida…', 'conf.high': 'Confianza alta', 'conf.medium': 'Confianza media', 'conf.low': 'Confianza baja',
    'ai.saveMeal': 'Guardar en Mis alimentos', 'ai.saveMealSub': 'Vuelve a registrar esta comida con un toque.',
    'ai.log': ({ n, meal }) => `Registrar ${n} alimento${n === 1 ? '' : 's'} en ${meal}`,
    'toast.logged': ({ n }) => `${n} alimento${n === 1 ? '' : 's'} registrado${n === 1 ? '' : 's'}`,
    'ai.noFoods': 'No se reconoció ningún alimento.', 'ai.photoError': 'No se pudo leer la foto.',
    'ai.examples': ['2 huevos revueltos, tostada de masa madre con mantequilla, café con leche de avena', 'Bowl de burrito con pollo: arroz, frijoles negros, salsa y guacamole',
      'Paella de mariscos, un plato grande', 'Tazón de yogur griego con miel, granola y frutos rojos'],
    'ai.photoOnly': 'Estima la comida de esta foto.',

    'err.noKey': 'Añade tu clave de API de Anthropic para usar las estimaciones con IA.', 'err.network': 'No se pudo conectar con el servicio de IA. Revisa tu conexión.',
    'err.badKey': 'Tu clave de API fue rechazada. Revísala en Ajustes.', 'err.rate': 'Demasiadas solicitudes. Inténtalo de nuevo en un momento.',
    'err.busy': 'El servicio de IA está ocupado. Inténtalo en unos segundos.', 'err.failed': 'La solicitud falló ({status}).',
    'err.refusal': 'La IA no pudo estimar esto. Prueba a describirlo de otra forma.', 'err.unexpected': 'Respuesta inesperada. Inténtalo de nuevo.',

    'create.food': 'Alimento', 'create.name': 'Nombre (p. ej. Lasaña de mamá)', 'create.brand': 'Marca o nota (opcional)', 'create.serving': 'Porción',
    'create.servingDesc': 'Descripción de la porción', 'create.servingWeight': 'Peso de la porción', 'create.optional': 'opcional',
    'create.weightHint': 'Añade el peso para poder registrarlo en gramos.', 'create.nutrition': 'Nutrición por porción', 'create.calories': 'Calorías',
    'create.caloriesHint': 'Deja las calorías en blanco para calcularlas a partir de los macros.', 'create.saveLog': 'Guardar y añadir a {meal}',
    'create.saveOnly': 'Solo guardar en Mis alimentos', 'create.defaultServing': '1 porción', 'toast.savedFoods': 'Guardado en Mis alimentos',
    'create.barcodeHint': 'Copia los números de la etiqueta nutricional. La próxima vez que escanees este código, aparecerá al instante.', 'create.removeBarcode': 'Quitar código de barras',

    'progress.7': '7 días', 'progress.30': '30 días', 'progress.avg': 'Promedio diario', 'progress.streak': 'Racha',
    'progress.onTarget': 'Dentro de la meta', 'progress.avgProtein': 'Proteína media', 'u.days': ({ n }) => (n === 1 ? 'día' : 'días'),
    'progress.calories': 'Calorías', 'progress.goal': 'Meta {n}', 'progress.macros': 'Macros promedio', 'progress.top': 'Lo más registrado',
    'progress.empty': 'Registra algunas comidas y aquí aparecerán tus tendencias.', 'progress.chart': 'Gráfico de calorías diarias',

    'settings.goals': 'Metas diarias', 'settings.recalc': 'Recalcular con mi perfil', 'settings.ai': 'Estimaciones con IA',
    'settings.anthropicKey': 'Clave de API de Anthropic', 'settings.anthropicPh': 'Clave de API de Anthropic (sk-ant-…)', 'settings.keySaved': '{label} guardada',
    'settings.aiFooter': 'Funciona con Claude. Las descripciones y fotos se envían a Anthropic solo al tocar Estimar; cada estimación cuesta alrededor de un centavo.',
    'settings.getKey': 'Conseguir clave →', 'settings.search': 'Búsqueda de alimentos', 'settings.usdaKey': 'Clave de USDA', 'settings.usdaPh': 'Clave gratuita de USDA (opcional)',
    'settings.usdaFooter': 'La búsqueda de marcas funciona sin clave, pero con límite. Una clave gratuita lo elimina.', 'settings.getFreeKey': 'Conseguir clave gratuita →',
    'settings.data': 'Datos', 'settings.export': 'Exportar copia de seguridad', 'settings.restore': 'Restaurar copia de seguridad', 'settings.deleteAll': 'Borrar todo el diario',
    'settings.dataFooter': 'Todo se guarda solo en este dispositivo. Exporta una copia de vez en cuando.', 'settings.about': 'Acerca de', 'settings.version': 'Versión',
    'settings.installHow': 'Instalar en iPhone: abre en Safari → Compartir → Añadir a pantalla de inicio.',
    'settings.aboutFooter': 'Datos de alimentos: USDA FoodData Central y Open Food Facts. Los valores son estimaciones para bienestar general, no consejo médico.',
    'settings.calc': 'Calculadora de metas', 'confirm.deleteAll': '¿Borrar todos los registros? No se puede deshacer.', 'toast.cleared': 'Diario borrado',
    'confirm.restore': ({ n }) => `¿Reemplazar tu diario con esta copia (${n} registros)?`, 'toast.restored': 'Copia restaurada',
    'alert.badBackup': 'Ese archivo no es una copia de Nourish.', 'toast.keySaved': 'Clave guardada', 'toast.goals': 'Metas actualizadas',
    'myfoods.empty': 'Aún no hay alimentos guardados. Crea uno o guarda una comida estimada con IA y aparecerá aquí.', 'confirm.deleteFood': '¿Eliminar «{name}»?',
    delete: 'Eliminar',

    'goal.your': 'Tu objetivo', 'goal.lose': 'Perder peso', 'goal.maintain': 'Mantener', 'goal.gain': 'Ganar músculo', 'goal.about': 'Sobre ti',
    'sex.female': 'Mujer', 'sex.male': 'Hombre', age: 'Edad', height: 'Altura', weight: 'Peso', 'goal.activity': 'Nivel de actividad',
    'act.sedentary': 'Sedentario', 'act.sedentary.sub': 'Trabajo de oficina, poco ejercicio', 'act.light': 'Poco activo', 'act.light.sub': 'Ejercicio 1–3 días por semana',
    'act.moderate': 'Moderadamente activo', 'act.moderate.sub': 'Ejercicio 3–5 días por semana', 'act.active': 'Muy activo', 'act.active.sub': 'Ejercicio intenso 6–7 días por semana',
    'act.athlete': 'Atleta', 'act.athlete.sub': 'Trabajo físico o entrenamiento dos veces al día',
    'goal.target': 'Tu meta diaria', 'goal.save': 'Guardar metas',

    'onb.tagline': 'Registra lo que comes en segundos.\nBusca alimentos o simplemente describe tu comida.',
    'onb.f1': 'Enorme base de alimentos', 'onb.f1s': 'Alimentos comunes sin conexión y más de 400 mil productos de marca.',
    'onb.f2': 'Estimaciones con IA', 'onb.f2s': 'Escribe «bowl de pollo con arroz» o haz una foto.',
    'onb.f3': 'Mira tu progreso', 'onb.f3s': 'Calorías, macros, rachas y tendencias.',
    'onb.start': 'Empezar', 'onb.private': 'Tus datos se quedan en este dispositivo.', 'onb.setGoals': 'Define tus metas', 'onb.track': 'Empezar a registrar',

    'scan.title': 'Escanear código', 'scan.close': 'Cerrar escáner', 'scan.flash': 'Linterna', 'scan.starting': 'Iniciando cámara…',
    'scan.point': 'Apunta al código de barras del envase', 'scan.looking': 'Buscando {code}…', 'scan.noCamera': 'Cámara no disponible',
    'scan.noCameraBody': 'Permite el acceso a la cámara para este sitio en los ajustes de Safari o escribe el número del código abajo.',
    'scan.notFound': 'Producto no encontrado', 'scan.notFoundBody': 'Aún no hay datos para {code}. Añádelo una vez y la próxima vez aparecerá.',
    'scan.offline': 'No se pudo conectar con las bases de alimentos. Revisa tu conexión.', 'scan.again': 'Escanear de nuevo', 'scan.addIt': 'Añadirlo',
    'scan.type': 'Escribir el número', 'scan.number': 'Número del código', 'scan.lookup': 'Buscar', 'scan.loadError': 'No se pudo cargar el lector de códigos.',
  },

  zh: {
    done: '完成', back: '返回', cancel: '取消', save: '保存', remove: '移除', clear: '清除', language: '语言',
    'tab.diary': '日记', 'tab.progress': '进度', 'tab.settings': '设置',
    'meal.breakfast': '早餐', 'meal.lunch': '午餐', 'meal.dinner': '晚餐', 'meal.snacks': '加餐', meal: '餐次',
    'u.kcal': '千卡', 'u.g': '克', 'u.ml': '毫升', 'u.cm': '厘米', 'u.kg': '公斤', 'u.lb': '磅',
    'm.protein': '蛋白质', 'm.carbs': '碳水', 'm.fat': '脂肪', 'm.P': '蛋白', 'm.C': '碳水', 'm.F': '脂肪',
    'src.builtIn': 'Nourish 数据库', 'src.usda': 'USDA FoodData Central', 'src.openFoodFacts': 'Open Food Facts', 'src.custom': '我的食物', 'src.ai': 'AI 估算',

    'day.today': '今天', 'day.yesterday': '昨天', 'day.tomorrow': '明天',
    'diary.goal': '目标', 'diary.eaten': '已摄入', 'diary.remaining': '剩余', 'diary.addFood': '添加食物',
    'ring.left': '千卡剩余', 'ring.over': '千卡超出',
    'week.prev': '上一周', 'week.next': '下一周',
    'install.title': '将 Nourish 安装到 iPhone', 'install.before': '轻点', 'install.after': '“分享”，然后选择“添加到主屏幕”。', dismiss: '关闭',

    'add.search': '搜索', 'add.ai': '✦ AI 识餐', 'add.create': '创建',
    'search.placeholder': '搜索食物和品牌', 'search.recent': '最近', 'search.mine': '我的食物和餐食', 'search.popular': '常用',
    'search.common': '常见食物', 'search.brands': '品牌与包装食品', 'search.loading': '正在搜索 USDA 数据库…',
    'search.none': '没有匹配的品牌食品。试试 ✦ AI 识餐，直接描述即可。',
    'search.rate': '免费搜索次数已用完。在设置中添加免费的 USDA 密钥即可无限搜索。',
    'search.error': '无法连接在线数据库。', 'search.typing': '继续输入以搜索 40 万+ 种商品…',
    'search.footer': '品牌数据来自 USDA FoodData Central（英文数据库，请用英文搜索品牌）。',
    'search.quickAdd': '快速添加一份', 'search.scan': '扫描条形码',
    'toast.addedTo': '已添加到{meal}', 'toast.saved': '已保存', 'toast.removed': '已删除', 'toast.loggedAgain': '已再次记录到今天',

    'detail.edit': '编辑记录', 'detail.amount': '数量', 'detail.servings': '份', 'detail.grams': '克', 'detail.servingsWord': '份',
    'detail.oneServing': '1 份 = {label}', 'detail.logAgain': '今天再记录一次', 'detail.remove': '从日记中删除',
    'detail.save': '保存更改', 'detail.addTo': '添加到{meal}',

    'ai.connect': '连接 AI 估算', 'ai.connectBody': '粘贴一次你的 Anthropic API 密钥。它只保存在这台设备上。',
    'ai.getKey': '在 console.anthropic.com 获取密钥 →', 'ai.question': '✦ 你吃了什么？',
    'ai.placeholder': '描述你吃的食物和分量。越详细，估算越准确。',
    'ai.camera': '相机', 'ai.photo': '照片', 'ai.removePhoto': '删除照片', 'ai.estimate': '估算热量', 'ai.reestimate': '重新估算',
    'ai.analyzing': '正在分析你的餐食…', 'conf.high': '可信度高', 'conf.medium': '可信度中', 'conf.low': '可信度低',
    'ai.saveMeal': '保存到我的食物', 'ai.saveMealSub': '下次一键记录这份餐食。',
    'ai.log': ({ n, meal }) => `将 ${n} 项记录到${meal}`,
    'toast.logged': ({ n }) => `已记录 ${n} 项`,
    'ai.noFoods': '未识别出食物。', 'ai.photoError': '无法读取这张照片。',
    'ai.examples': ['两个炒鸡蛋、一片黄油酸面包吐司、一杯燕麦拿铁', '一碗牛肉面，加一个卤蛋', '宫保鸡丁配一碗米饭', '一大碗希腊酸奶，加蜂蜜、燕麦片和莓果'],
    'ai.photoOnly': '估算这张照片里的餐食。',

    'err.noKey': '添加 Anthropic API 密钥后即可使用 AI 估算。', 'err.network': '无法连接 AI 服务，请检查网络。',
    'err.badKey': 'API 密钥被拒绝，请在设置中检查。', 'err.rate': '请求过多，请稍后再试。',
    'err.busy': 'AI 服务繁忙，请几秒后再试。', 'err.failed': '请求失败（{status}）。',
    'err.refusal': 'AI 无法估算这一项，请换种方式描述。', 'err.unexpected': '收到意外的响应，请重试。',

    'create.food': '食物', 'create.name': '名称（例如：妈妈做的千层面）', 'create.brand': '品牌或备注（可选）', 'create.serving': '份量',
    'create.servingDesc': '份量说明', 'create.servingWeight': '每份重量', 'create.optional': '可选',
    'create.weightHint': '填写重量后，以后可以按克记录。', 'create.nutrition': '每份营养', 'create.calories': '热量',
    'create.caloriesHint': '热量留空则根据三大营养素自动计算。', 'create.saveLog': '保存并添加到{meal}',
    'create.saveOnly': '仅保存到我的食物', 'create.defaultServing': '1 份', 'toast.savedFoods': '已保存到我的食物',
    'create.barcodeHint': '照着营养成分表填写数字。下次扫描这个条形码时会立即显示。', 'create.removeBarcode': '移除条形码',

    'progress.7': '7 天', 'progress.30': '30 天', 'progress.avg': '每日平均', 'progress.streak': '连续记录',
    'progress.onTarget': '达标天数', 'progress.avgProtein': '平均蛋白质', 'u.days': () => '天',
    'progress.calories': '热量', 'progress.goal': '目标 {n}', 'progress.macros': '平均营养素', 'progress.top': '最常记录',
    'progress.empty': '记录几餐后，这里会显示你的趋势。', 'progress.chart': '每日热量图表',

    'settings.goals': '每日目标', 'settings.recalc': '根据我的资料重新计算', 'settings.ai': 'AI 餐食估算',
    'settings.anthropicKey': 'Anthropic API 密钥', 'settings.anthropicPh': 'Anthropic API 密钥（sk-ant-…）', 'settings.keySaved': '{label}已保存',
    'settings.aiFooter': '由 Claude 提供支持。只有点击“估算”时，餐食描述和照片才会发送给 Anthropic；每次估算约一美分。',
    'settings.getKey': '获取密钥 →', 'settings.search': '食物搜索', 'settings.usdaKey': 'USDA 密钥', 'settings.usdaPh': '免费 USDA API 密钥（可选）',
    'settings.usdaFooter': '品牌搜索无需密钥即可使用，但有次数限制。免费密钥可解除限制。', 'settings.getFreeKey': '获取免费密钥 →',
    'settings.data': '数据', 'settings.export': '导出备份', 'settings.restore': '从备份恢复', 'settings.deleteAll': '删除所有日记记录',
    'settings.dataFooter': '所有数据仅保存在这台设备上。请定期导出备份。', 'settings.about': '关于', 'settings.version': '版本',
    'settings.installHow': '安装到 iPhone：用 Safari 打开 → 分享 → 添加到主屏幕。',
    'settings.aboutFooter': '食物数据：USDA FoodData Central 和 Open Food Facts。营养数值仅为一般健康记录的估算，不构成医疗建议。',
    'settings.calc': '目标计算器', 'confirm.deleteAll': '删除所有记录？此操作无法撤销。', 'toast.cleared': '日记已清空',
    'confirm.restore': ({ n }) => `用这个备份（${n} 条记录）替换你的日记？`, 'toast.restored': '备份已恢复',
    'alert.badBackup': '这个文件不是 Nourish 备份。', 'toast.keySaved': '密钥已保存', 'toast.goals': '目标已更新',
    'myfoods.empty': '还没有保存的食物。创建食物或保存 AI 估算的餐食后会显示在这里。', 'confirm.deleteFood': '删除“{name}”？',
    delete: '删除',

    'goal.your': '你的目标', 'goal.lose': '减重', 'goal.maintain': '保持', 'goal.gain': '增肌', 'goal.about': '关于你',
    'sex.female': '女', 'sex.male': '男', age: '年龄', height: '身高', weight: '体重', 'goal.activity': '活动水平',
    'act.sedentary': '久坐', 'act.sedentary.sub': '办公室工作，很少运动', 'act.light': '轻度活动', 'act.light.sub': '每周运动 1–3 天',
    'act.moderate': '中度活动', 'act.moderate.sub': '每周运动 3–5 天', 'act.active': '高度活动', 'act.active.sub': '每周高强度运动 6–7 天',
    'act.athlete': '运动员', 'act.athlete.sub': '体力劳动或每天训练两次',
    'goal.target': '你的每日目标', 'goal.save': '保存目标',

    'onb.tagline': '几秒钟记录你吃的东西。\n搜索食物，或直接描述你的餐食。',
    'onb.f1': '海量食物数据库', 'onb.f1s': '常见食物离线可用，另有 40 万+ 品牌商品。',
    'onb.f2': 'AI 餐食估算', 'onb.f2s': '输入“宫保鸡丁配米饭”或拍张照片。',
    'onb.f3': '查看你的进度', 'onb.f3s': '热量、营养素、连续记录和趋势。',
    'onb.start': '开始使用', 'onb.private': '你的数据只保存在这台设备上。', 'onb.setGoals': '设定目标', 'onb.track': '开始记录',

    'scan.title': '扫描条形码', 'scan.close': '关闭扫描', 'scan.flash': '手电筒', 'scan.starting': '正在启动相机…',
    'scan.point': '将相机对准包装上的条形码', 'scan.looking': '正在查找 {code}…', 'scan.noCamera': '相机不可用',
    'scan.noCameraBody': '请在 Safari 设置中允许此网站使用相机，或在下方输入条形码数字。',
    'scan.notFound': '未找到商品', 'scan.notFoundBody': '{code} 暂无营养数据。添加一次，下次就能找到。',
    'scan.offline': '无法连接食物数据库，请检查网络。', 'scan.again': '重新扫描', 'scan.addIt': '添加',
    'scan.type': '手动输入条形码', 'scan.number': '条形码数字', 'scan.lookup': '查找', 'scan.loadError': '无法加载条形码识别器。',
  },
};

export function t(key, vars = {}) {
  const v = DICT[lang()]?.[key] ?? DICT.en[key];
  if (v === undefined) return key;
  if (typeof v === 'function') return v(vars);
  if (typeof v !== 'string') return v;
  return v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

/** For tests: every key present in English must exist in each language. */
export function missingKeys() {
  const en = Object.keys(DICT.en);
  return Object.fromEntries(LANGS.slice(1).map(({ id }) => [id, en.filter((k) => !(k in DICT[id]))]));
}
