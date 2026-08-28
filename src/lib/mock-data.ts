import type {
  Airport,
  Terminal,
  Zone,
  Equipment,
  Inspection,
  Fault,
  Repair,
  SparePart,
  EquipmentDocument,
  NotificationItem,
  AppUser,
  UserRole,
  ChecklistItem,
} from "./types";

export const airports: Airport[] = [
  { id: "air-tas", name: "Международный аэропорт Ташкент", code: "TAS", city: "Ташкент" },
  { id: "air-skd", name: "Аэропорт Самарканд", code: "SKD", city: "Самарканд" },
  { id: "air-fef", name: "Аэропорт Фергана", code: "FEF", city: "Фергана" },
  { id: "air-buk", name: "Аэропорт Бухара", code: "BUK", city: "Бухара" },
  { id: "air-uge", name: "Аэропорт Ургенч", code: "UGE", city: "Ургенч" },
];

export const terminals: Terminal[] = [
  { id: "term-tas-1", airportId: "air-tas", name: "Терминал 1" },
  { id: "term-tas-2", airportId: "air-tas", name: "Терминал 2" },
  { id: "term-tas-3", airportId: "air-tas", name: "Терминал 3" },
  { id: "term-skd-1", airportId: "air-skd", name: "Терминал 1" },
  { id: "term-fef-1", airportId: "air-fef", name: "Терминал 1" },
  { id: "term-buk-1", airportId: "air-buk", name: "Терминал 1" },
  { id: "term-uge-1", airportId: "air-uge", name: "Терминал 1" },
];

export const zones: Zone[] = [
  { id: "zone-tas-2-a", terminalId: "term-tas-2", name: "Зона вылета / Линия 1" },
  { id: "zone-tas-2-b", terminalId: "term-tas-2", name: "Зона вылета / Линия 3" },
  { id: "zone-tas-2-c", terminalId: "term-tas-2", name: "Зона досмотра" },
  { id: "zone-tas-1-a", terminalId: "term-tas-1", name: "Зона досмотра / Линия 2" },
  { id: "zone-tas-3-a", terminalId: "term-tas-3", name: "Зона досмотра / Линия 1" },
  { id: "zone-skd-a", terminalId: "term-skd-1", name: "Зона досмотра / Линия 2" },
  { id: "zone-fef-a", terminalId: "term-fef-1", name: "Вход A" },
  { id: "zone-buk-a", terminalId: "term-buk-1", name: "Вход Б" },
  { id: "zone-uge-a", terminalId: "term-uge-1", name: "Зона досмотра" },
];

const equipmentSeed: Array<
  Omit<Equipment, "id" | "code" | "airportId" | "terminalId" | "zoneId" | "location"> & {
    airport: string;
    terminal: string;
    zone: string;
  }
> = [
  { name: "Rapiscan 620XR", type: "Интраскопы", manufacturer: "Rapiscan", model: "620XR", serialNumber: "RS620-458721", inventoryNumber: "INV-000125", status: "operational", commissionedAt: "2024-03-15", lastInspectionAt: "2026-05-20", nextInspectionAt: "2026-08-27", imageColor: "brand", airport: "air-tas", terminal: "term-tas-2", zone: "zone-tas-2-b" },
  { name: "Smiths Detection HI-SCAN 6040i", type: "Интраскопы", manufacturer: "Smiths Detection", model: "HI-SCAN 6040i", serialNumber: "6040I-782314", inventoryNumber: "INV-000126", status: "maintenance", commissionedAt: "2024-01-18", lastInspectionAt: "2026-05-18", nextInspectionAt: "2026-08-28", imageColor: "warning", airport: "air-skd", terminal: "term-skd-1", zone: "zone-skd-a" },
  { name: "GARRETT PD 6500i", type: "Металрамки", manufacturer: "GARRETT", model: "PD 6500i", serialNumber: "PD6500I-123456", inventoryNumber: "INV-000127", status: "faulty", commissionedAt: "2023-12-10", lastInspectionAt: "2026-04-22", nextInspectionAt: "2026-08-30", imageColor: "error", airport: "air-fef", terminal: "term-fef-1", zone: "zone-fef-a" },
  { name: "Explosives Trace Detector ETD300", type: "Газанализаторы", manufacturer: "Smiths Detection", model: "ETD300", serialNumber: "ETD300-987654", inventoryNumber: "INV-000128", status: "operational", commissionedAt: "2024-02-21", lastInspectionAt: "2026-05-21", nextInspectionAt: "2026-09-01", imageColor: "brand", airport: "air-tas", terminal: "term-tas-2", zone: "zone-tas-2-a" },
  { name: "Металлодетектор БЛОКПОСТ РС Z 600", type: "Металрамки", manufacturer: "БЛОКПОСТ", model: "PC Z 600", serialNumber: "Z600-456789", inventoryNumber: "INV-000129", status: "operational", commissionedAt: "2024-02-22", lastInspectionAt: "2026-05-22", nextInspectionAt: "2026-09-02", imageColor: "brand", airport: "air-buk", terminal: "term-buk-1", zone: "zone-buk-a" },
  { name: "Rapiscan 628XR", type: "Интраскопы", manufacturer: "Rapiscan", model: "628XR", serialNumber: "RS628-112233", inventoryNumber: "INV-000130", status: "operational", commissionedAt: "2024-04-05", lastInspectionAt: "2026-05-05", nextInspectionAt: "2026-09-05", imageColor: "brand", airport: "air-fef", terminal: "term-fef-1", zone: "zone-fef-a" },
  { name: "Smiths Detection IONSCAN 600", type: "Газанализаторы", manufacturer: "Smiths Detection", model: "IONSCAN 600", serialNumber: "ION600-556677", inventoryNumber: "INV-000131", status: "maintenance", commissionedAt: "2024-02-12", lastInspectionAt: "2026-05-12", nextInspectionAt: "2026-09-07", imageColor: "warning", airport: "air-tas", terminal: "term-tas-3", zone: "zone-tas-3-a" },
  { name: "HIKVISION DS-K3B601 (Турникет)", type: "Металрамки", manufacturer: "HIKVISION", model: "DS-K3B601", serialNumber: "K3B601-223344", inventoryNumber: "INV-000132", status: "operational", commissionedAt: "2024-03-01", lastInspectionAt: "2026-05-10", nextInspectionAt: "2026-09-10", imageColor: "brand", airport: "air-skd", terminal: "term-skd-1", zone: "zone-skd-a" },
  { name: "Автоматический досмотровый комплекс Leidos MV-3", type: "Интраскопы", manufacturer: "Leidos", model: "MV-3", serialNumber: "MV3-334455", inventoryNumber: "INV-000133", status: "operational", commissionedAt: "2024-03-20", lastInspectionAt: "2026-05-12", nextInspectionAt: "2026-09-12", imageColor: "brand", airport: "air-fef", terminal: "term-fef-1", zone: "zone-fef-a" },
  { name: "Thermo Scientific FirstDefender RM", type: "Газанализаторы", manufacturer: "Thermo Scientific", model: "FirstDefender RM", serialNumber: "RM-445566", inventoryNumber: "INV-000134", status: "operational", commissionedAt: "2024-03-15", lastInspectionAt: "2026-06-15", nextInspectionAt: "2026-09-15", imageColor: "brand", airport: "air-buk", terminal: "term-buk-1", zone: "zone-buk-a" },
  { name: "Cobalt Light Systems XRS-4", type: "Газанализаторы", manufacturer: "Cobalt Light Systems", model: "XRS-4", serialNumber: "XRS4-778899", inventoryNumber: "INV-000135", status: "maintenance", commissionedAt: "2024-03-25", lastInspectionAt: "2026-06-18", nextInspectionAt: "2026-09-18", imageColor: "warning", airport: "air-fef", terminal: "term-fef-1", zone: "zone-fef-a" },
  { name: "Ручной металлодетектор GARRETT Super Scanner V", type: "Ручные метал искатели", manufacturer: "GARRETT", model: "Super Scanner V", serialNumber: "SSV-889900", inventoryNumber: "INV-000136", status: "operational", commissionedAt: "2024-04-05", lastInspectionAt: "2026-06-20", nextInspectionAt: "2026-09-20", imageColor: "brand", airport: "air-tas", terminal: "term-tas-2", zone: "zone-tas-2-c" },
  { name: "Rapiscan 620XR", type: "Интраскопы", manufacturer: "Rapiscan", model: "620XR", serialNumber: "RS620-123098", inventoryNumber: "INV-000137", status: "requires_inspection", commissionedAt: "2023-11-02", lastInspectionAt: "2026-02-01", nextInspectionAt: "2026-08-26", imageColor: "purple", airport: "air-tas", terminal: "term-tas-1", zone: "zone-tas-1-a" },
  { name: "Интроскоп для багажа BS-10080", type: "Интраскопы", manufacturer: "Nuctech", model: "BS-10080", serialNumber: "BS-000987", inventoryNumber: "INV-000138", status: "requires_inspection", commissionedAt: "2023-10-14", lastInspectionAt: "2026-01-18", nextInspectionAt: "2026-08-28", imageColor: "purple", airport: "air-tas", terminal: "term-tas-2", zone: "zone-tas-2-b" },
  { name: "Стационарный металлодетектор SMD-000159", type: "Металрамки", manufacturer: "СТАЦИОНАР", model: "SMD-200", serialNumber: "SMD-000159", inventoryNumber: "INV-000139", status: "operational", commissionedAt: "2024-01-09", lastInspectionAt: "2026-06-05", nextInspectionAt: "2026-09-25", imageColor: "brand", airport: "air-uge", terminal: "term-uge-1", zone: "zone-uge-a" },
  { name: "Дозиметр-радиометр DR-000321", type: "Газанализаторы", manufacturer: "Полимастер", model: "DR-321", serialNumber: "DR-000321", inventoryNumber: "INV-000140", status: "operational", commissionedAt: "2024-02-14", lastInspectionAt: "2026-06-01", nextInspectionAt: "2026-09-28", imageColor: "brand", airport: "air-tas", terminal: "term-tas-2", zone: "zone-tas-2-c" },
  { name: "Rapiscan 620XR", type: "Интраскопы", manufacturer: "Rapiscan", model: "620XR", serialNumber: "RS620-990011", inventoryNumber: "INV-000141", status: "reserve", commissionedAt: "2023-09-11", lastInspectionAt: "2026-03-11", nextInspectionAt: "2026-10-01", imageColor: "gray", airport: "air-tas", terminal: "term-tas-3", zone: "zone-tas-3-a" },
  { name: "GARRETT PD 6500i", type: "Металрамки", manufacturer: "GARRETT", model: "PD 6500i", serialNumber: "PD6500I-556611", inventoryNumber: "INV-000142", status: "operational", commissionedAt: "2024-01-29", lastInspectionAt: "2026-06-11", nextInspectionAt: "2026-10-05", imageColor: "brand", airport: "air-skd", terminal: "term-skd-1", zone: "zone-skd-a" },
];

export const equipment: Equipment[] = equipmentSeed.map((eq, i) => {
  const num = String(i + 1).padStart(4, "0");
  return {
    ...eq,
    id: `eq-${num}`,
    code: `EQ-${num}`,
    airportId: eq.airport,
    terminalId: eq.terminal,
    zoneId: eq.zone,
    location: `${terminals.find((t) => t.id === eq.terminal)?.name} / ${zones.find((z) => z.id === eq.zone)?.name}`,
  };
});

export function airportName(id: string) {
  return airports.find((a) => a.id === id)?.name ?? "—";
}

export function equipmentById(id: string) {
  return equipment.find((e) => e.id === id);
}

export function terminalsByAirport(airportId: string) {
  return terminals.filter((t) => t.airportId === airportId);
}

export function zonesByTerminal(terminalId: string) {
  return zones.filter((z) => z.terminalId === terminalId);
}

export function equipmentByZone(zoneId: string) {
  return equipment.filter((e) => e.zoneId === zoneId);
}

export function equipmentByTerminal(terminalId: string) {
  return equipment.filter((e) => e.terminalId === terminalId);
}

export function equipmentByAirport(airportId: string) {
  return equipment.filter((e) => e.airportId === airportId);
}

const inspectorNames = ["Петров П.П.", "Сидоров И.А.", "Иванов К.С.", "Ким А.С.", "Юсупов Д.Р."];

export const inspections: Inspection[] = equipment.slice(0, 14).map((eq, i) => ({
  id: `INS-${String(i + 1).padStart(5, "0")}`,
  equipmentId: eq.id,
  type: i % 3 === 0 ? "unscheduled" : "periodic",
  regulation: `Регламент №${(i % 5) + 1} от 15.01.2026`,
  status: (["completed", "planned", "overdue", "completed", "in_progress"] as const)[i % 5],
  scheduledAt: eq.nextInspectionAt ?? "2026-09-01",
  completedAt: i % 5 === 0 || i % 5 === 3 ? eq.lastInspectionAt : null,
  inspector: inspectorNames[i % inspectorNames.length],
  result: i % 5 === 0 || i % 5 === 3 ? "compliant" : null,
}));

const faultSeed: Array<{
  eqIndex: number;
  title: string;
  description: string;
  category: string;
  priority: Fault["priority"];
  stage: Fault["stage"];
  detectedVia: Fault["detectedVia"];
  daysAgo: number;
  dueInDays: number | null;
  attachmentCount: number;
}> = [
  { eqIndex: 0, title: "Не сканирует багаж. Ошибка системы генератора.", description: "Не сканирует багаж. Выдается ошибка системы генератора. На экране сообщение: E071.", category: "Электроника", priority: "high", stage: "registered", detectedVia: "sensor", daysAgo: 1, dueInDays: 3, attachmentCount: 2 },
  { eqIndex: 1, title: "На изображении появляются полосы и помехи.", description: "На выводимом изображении периодически появляются вертикальные полосы, снижающие читаемость.", category: "Оптика/Датчики", priority: "high", stage: "repair", detectedVia: "inspection", daysAgo: 2, dueInDays: 2, attachmentCount: 3 },
  { eqIndex: 2, title: "Ложные срабатывания без наличия металла.", description: "Арка срабатывает без прохождения металлических предметов, требуется перекалибровка чувствительности.", category: "Калибровка", priority: "medium", stage: "verification", detectedVia: "inspection", daysAgo: 3, dueInDays: 1, attachmentCount: 0 },
  { eqIndex: 17, title: "Не включается, нет индикации питания.", description: "При включении отсутствует индикация на панели управления, предположительно проблема с блоком питания.", category: "Электропитание", priority: "high", stage: "registered", detectedVia: "manual", daysAgo: 4, dueInDays: 2, attachmentCount: 1 },
  { eqIndex: 8, title: "Застревание конвейера при движении.", description: "Конвейерная лента периодически заклинивает при прохождении крупногабаритного багажа.", category: "Механика", priority: "medium", stage: "verification", detectedVia: "inspection", daysAgo: 5, dueInDays: 1, attachmentCount: 2 },
  { eqIndex: 10, title: "Ошибки калибровки, требуется перекалибровка.", description: "Система выдает регулярные ошибки калибровки при запуске самодиагностики.", category: "Калибровка", priority: "low", stage: "closed", detectedVia: "inspection", daysAgo: 6, dueInDays: null, attachmentCount: 0 },
  { eqIndex: 11, title: "Периодически теряет чувствительность.", description: "Ручной металлодетектор периодически теряет чувствительность обнаружения на дальней дистанции.", category: "Электроника", priority: "low", stage: "closed", detectedVia: "audit", daysAgo: 7, dueInDays: null, attachmentCount: 0 },
  { eqIndex: 0, title: "Не открывается шторка входа/выхода.", description: "Автоматическая шторка на входе не открывается полностью, требуется осмотр привода.", category: "Механика", priority: "high", stage: "repair", detectedVia: "manual", daysAgo: 8, dueInDays: 3, attachmentCount: 4 },
  { eqIndex: 5, title: "Задержка формирования изображения при сканировании.", description: "Наблюдается задержка до 3 секунд при формировании изображения крупногабаритного багажа.", category: "ПО", priority: "medium", stage: "diagnosis", detectedVia: "inspection", daysAgo: 3, dueInDays: 4, attachmentCount: 1 },
  { eqIndex: 6, title: "Индикатор аккумулятора показывает некорректный заряд.", description: "Индикатор заряда аккумулятора ETD300 показывает 100% сразу после включения при разряженной батарее.", category: "Электроника", priority: "low", stage: "assigned", detectedVia: "manual", daysAgo: 2, dueInDays: 5, attachmentCount: 0 },
  { eqIndex: 3, title: "Ошибка калибровки чувствительности датчика.", description: "При самодиагностике детектор следов взрывчатых веществ сообщает об ошибке калибровки чувствительности.", category: "Калибровка", priority: "medium", stage: "diagnosis", detectedVia: "sensor", daysAgo: 1, dueInDays: 6, attachmentCount: 0 },
  { eqIndex: 13, title: "Периодическое зависание интерфейса оператора.", description: "Сенсорный интерфейс интроскопа периодически зависает и требует перезагрузки блока управления.", category: "ПО", priority: "high", stage: "detected", detectedVia: "manual", daysAgo: 0, dueInDays: 2, attachmentCount: 1 },
  { eqIndex: 14, title: "Погрешность показаний дозиметра-радиометра.", description: "Расхождение показаний с контрольным источником превышает допустимую погрешность.", category: "Калибровка", priority: "critical", stage: "registered", detectedVia: "audit", daysAgo: 0, dueInDays: 1, attachmentCount: 0 },
  { eqIndex: 9, title: "Треск и помехи в динамике оповещения.", description: "При срабатывании тревоги в динамике слышен треск, звук оповещения искажен.", category: "Электроника", priority: "low", stage: "repair", detectedVia: "inspection", daysAgo: 6, dueInDays: 3, attachmentCount: 1 },
  { eqIndex: 15, title: "Замятие багажа на входе конвейера.", description: "Регулярное замятие мягких сумок на входном ролике конвейера, требуется осмотр механизма.", category: "Механика", priority: "medium", stage: "verification", detectedVia: "inspection", daysAgo: 9, dueInDays: null, attachmentCount: 2 },
  { eqIndex: 4, title: "Нестабильное срабатывание при низком напряжении сети.", description: "При просадке напряжения сети арка металлодетектора самопроизвольно перезагружается.", category: "Электропитание", priority: "medium", stage: "closed", detectedVia: "manual", daysAgo: 12, dueInDays: null, attachmentCount: 0 },
  { eqIndex: 16, title: "Не печатает талон по результатам проверки.", description: "Встроенный принтер интроскопа не выводит талон с результатами проверки, лента заправлена корректно.", category: "Механика", priority: "low", stage: "closed", detectedVia: "manual", daysAgo: 14, dueInDays: null, attachmentCount: 0 },
  { eqIndex: 7, title: "Сбой авторизации оператора на турникете.", description: "Турникет периодически не распознает карту доступа авторизованного оператора.", category: "ПО", priority: "medium", stage: "closed", detectedVia: "manual", daysAgo: 15, dueInDays: null, attachmentCount: 0 },
];

export const faults: Fault[] = faultSeed.map((f, i) => ({
  id: `INC-${String(faultSeed.length - i).padStart(5, "0")}`,
  equipmentId: equipment[f.eqIndex].id,
  title: f.title,
  description: f.description,
  category: f.category,
  priority: f.priority,
  stage: f.stage,
  detectedAt: isoDaysAgo(f.daysAgo),
  detectedVia: f.detectedVia,
  dueAt: f.dueInDays != null ? isoDaysFromNow(f.dueInDays) : null,
  reportedBy: inspectorNames[i % inspectorNames.length],
  assignee: f.stage === "registered" || f.stage === "detected" ? null : inspectorNames[(i + 1) % inspectorNames.length],
  attachmentCount: f.attachmentCount,
}));

export const repairs: Repair[] = faults
  .filter((f) => f.stage === "repair" || f.stage === "verification" || f.stage === "closed")
  .map((f, i) => ({
    id: `REP-${String(i + 1).padStart(5, "0")}`,
    faultId: f.id,
    equipmentId: f.equipmentId,
    status: f.stage === "closed" ? "verified" : f.stage === "verification" ? "completed" : "in_progress",
    engineer: f.assignee ?? inspectorNames[0],
    startedAt: f.detectedAt,
    completedAt: f.stage === "closed" ? isoDaysAgo(1) : null,
    estimatedHours: 4 + i,
    actualHours: f.stage === "closed" ? 3 + i : null,
    partsUsed: f.stage === "closed" ? ["Блок питания 24В", "Ремень конвейера"] : [],
    verificationResult: f.stage === "closed" ? "passed" : null,
  }));

export const spareParts: SparePart[] = [
  { id: "sp-001", name: "Рентгеновская трубка RS620", sku: "SP-XT-620", warehouse: "Ташкент, Центральный склад", stock: 4, minStock: 2, reserved: 1, status: "available", compatibleEquipmentTypes: ["Рентгенотелевизионная установка"] },
  { id: "sp-002", name: "Ремень конвейера 1200мм", sku: "SP-BLT-1200", warehouse: "Ташкент, Центральный склад", stock: 2, minStock: 3, reserved: 0, status: "low_stock", compatibleEquipmentTypes: ["Рентгенотелевизионная установка", "Интроскоп для багажа"] },
  { id: "sp-003", name: "Блок питания 24В 350Вт", sku: "SP-PSU-24-350", warehouse: "Самарканд, Склад №1", stock: 0, minStock: 4, reserved: 2, status: "out_of_stock", compatibleEquipmentTypes: ["Металлодетектор арочный", "Рентгенотелевизионная установка"] },
  { id: "sp-004", name: "Сенсорная катушка арки PD6500i", sku: "SP-COIL-PD65", warehouse: "Фергана, Склад", stock: 6, minStock: 2, reserved: 1, status: "available", compatibleEquipmentTypes: ["Металлодетектор арочный"] },
  { id: "sp-005", name: "Аккумулятор ETD300", sku: "SP-BAT-ETD3", warehouse: "Ташкент, Центральный склад", stock: 3, minStock: 3, reserved: 3, status: "reserved", compatibleEquipmentTypes: ["Детектор следов взрывчатых веществ"] },
];

export const documents: EquipmentDocument[] = [
  { id: "doc-001", equipmentId: equipment[0].id, title: "Акт периодической проверки №118", type: "act", status: "active", author: "Петров П.П.", date: "2026-05-25", version: "1.0" },
  { id: "doc-002", equipmentId: equipment[0].id, title: "Сертификат соответствия Rapiscan 620XR", type: "certificate", status: "expiring", author: "Отдел сертификации", date: "2024-03-15", version: "2.0" },
  { id: "doc-003", equipmentId: equipment[1].id, title: "Протокол диагностики HI-SCAN 6040i", type: "protocol", status: "active", author: "Сидоров И.А.", date: "2026-05-18", version: "1.0" },
  { id: "doc-004", equipmentId: null, title: "Руководство по эксплуатации GARRETT PD 6500i", type: "manual", status: "active", author: "GARRETT", date: "2023-12-01", version: "3.1" },
  { id: "doc-005", equipmentId: equipment[9].id, title: "Отчет о ремонте REP-00001", type: "repair_report", status: "archived", author: "Иванов К.С.", date: "2026-04-02", version: "1.0" },
];

export const notifications: NotificationItem[] = [
  { id: "ntf-001", title: "9 единиц оборудования требует поверки", description: "Поверка истекает в ближайшие 30 дней", severity: "warning", createdAt: isoDaysAgo(0), entityType: "equipment", entityId: equipment[12].id, read: false },
  { id: "ntf-002", title: "7 неисправностей требуют внимания", description: "Просрочены сроки устранения", severity: "critical", createdAt: isoDaysAgo(0), entityType: "fault", entityId: faults[0].id, read: false },
  { id: "ntf-003", title: "5 ТО запланировано на этой неделе", description: "Плановое техническое обслуживание", severity: "info", createdAt: isoDaysAgo(1), entityType: "inspection", entityId: inspections[0].id, read: false },
  { id: "ntf-004", title: "Низкий остаток: Блок питания 24В 350Вт", description: "Остаток на складе ниже минимального уровня", severity: "warning", createdAt: isoDaysAgo(1), entityType: "spare_part", entityId: spareParts[2].id, read: true },
];

export const roleLabels: Record<UserRole, string> = {
  engineer: "Инженер",
  lead_engineer: "Ведущий инженер",
  spare_parts_manager: "Менеджер ЗИП",
  central_office: "Центральный офис",
  administrator: "Администратор",
  auditor: "Аудитор",
};

export const users: AppUser[] = [
  { id: "usr-001", fullName: "Иванов И.И.", email: "i.ivanov@aviaseq.uz", role: "administrator", airportId: null, active: true, lastActiveAt: isoDaysAgo(0) },
  { id: "usr-002", fullName: "Петров П.П.", email: "p.petrov@aviaseq.uz", role: "engineer", airportId: "air-tas", active: true, lastActiveAt: isoDaysAgo(0) },
  { id: "usr-003", fullName: "Сидоров И.А.", email: "i.sidorov@aviaseq.uz", role: "engineer", airportId: "air-skd", active: true, lastActiveAt: isoDaysAgo(1) },
  { id: "usr-004", fullName: "Иванов К.С.", email: "k.ivanov@aviaseq.uz", role: "lead_engineer", airportId: "air-tas", active: true, lastActiveAt: isoDaysAgo(0) },
  { id: "usr-005", fullName: "Ким А.С.", email: "a.kim@aviaseq.uz", role: "spare_parts_manager", airportId: "air-tas", active: true, lastActiveAt: isoDaysAgo(2) },
  { id: "usr-006", fullName: "Юсупов Д.Р.", email: "d.yusupov@aviaseq.uz", role: "engineer", airportId: "air-fef", active: true, lastActiveAt: isoDaysAgo(3) },
  { id: "usr-007", fullName: "Рахимова М.Т.", email: "m.rakhimova@aviaseq.uz", role: "central_office", airportId: null, active: true, lastActiveAt: isoDaysAgo(1) },
  { id: "usr-008", fullName: "Назарова С.У.", email: "s.nazarova@aviaseq.uz", role: "auditor", airportId: null, active: false, lastActiveAt: isoDaysAgo(20) },
];

export const currentUser: AppUser = users[0];

export function inspectionsByEquipment(equipmentId: string) {
  return inspections.filter((i) => i.equipmentId === equipmentId);
}

export function faultsByEquipment(equipmentId: string) {
  return faults.filter((f) => f.equipmentId === equipmentId);
}

export function repairsByFault(faultId: string) {
  return repairs.filter((r) => r.faultId === faultId);
}

export function faultById(id: string) {
  return faults.find((f) => f.id === id);
}

export function repairById(id: string) {
  return repairs.find((r) => r.id === id);
}

const checklistTemplate: string[] = [
  "Проверка целостности корпуса и механических частей",
  "Проверка исправности конвейера",
  "Проверка работы аварийных кнопок",
  "Проверка качества изображения",
  "Проверка системы оповещения",
  "Проверка радиационной безопасности",
  "Проверка программного обеспечения",
  "Проверка работоспособности принтера",
];

/** Deterministic mock checklist for an inspection — same input, same output. */
export function checklistForInspection(inspectionId: string): ChecklistItem[] {
  const seed = inspectionId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return checklistTemplate.map((label, i) => {
    const roll = (seed + i * 7) % 10;
    const result: ChecklistItem["result"] =
      roll === 0 ? "non_compliant" : roll === 1 ? "not_applicable" : roll >= 8 ? "pending" : "compliant";
    return {
      id: `${inspectionId}-item-${i + 1}`,
      label,
      result,
      comment: result === "non_compliant" ? "Изображение нечеткое в правом углу." : undefined,
    };
  });
}

function isoDaysAgo(days: number) {
  const d = new Date("2026-08-25T10:00:00Z");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoDaysFromNow(days: number) {
  const d = new Date("2026-08-25T10:00:00Z");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
