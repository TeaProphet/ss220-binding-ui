const asset = file => `/wiki-assets/${encodeURIComponent(file)}`;
const role = (name, image) => ({name, image: asset(image)});

export const races = [
  role('Таяран', 'Base_tajaran.png'),
  role('Унатх', 'Base_unathi.png'),
  role('Слаймолюд', 'Base_slime.png'),
  role('Вокс', 'Base_vox.png'),
  role('Дионея', 'Base_diona.png'),
  role('Ниан', 'Base_nian.png'),
  role('Арахнид', 'Base_Arahn.png'),
  role('Дворф', 'Base_dwarf.png'),
  role('Человек', 'Base_human.png'),
  role('КПБ', 'КПБ.png'),
];

export const departments = [
  {
    id: 'command', name: 'Командование', color: '#466f9e', image: asset('Капитан.png'), roles: [
      role('Капитан', 'IconRole_Капитан.png'), role('Глава персонала', 'IconRole_Глава_персонала.png'),
      role('Глава службы безопасности', 'IconRole_Глава_СБ.png'), role('Старший Инженер', 'IconRole_Старший_Инженер.png'),
      role('Научный руководитель', 'IconRole_Научный_руководитель.png'), role('Главный врач', 'IconRole_Главный_врач.png'),
      role('Квартирмейстер', 'IconRole_Квартермейстер.png'),
    ],
  },
  {
    id: 'representative', name: 'Представители', color: '#466f9e', image: asset('IconRole_NTR.png'), roles: [
      role('Центральное Командование', 'Командующий_ЦК.png'), role('Представитель Nanotrasen', 'IconRole_NTR.png'),
      role('Офицер «Синий Щит»', 'IconRole_ОСЩ.png'),
    ],
  },
  {
    id: 'legal', name: 'Юридический отдел', color: '#365f9b', image: asset('IconRole_Магистрат.png'), roles: [
      role('Представитель Nanotrasen', 'IconRole_NTR.png'), role('Адвокат', 'IconRole_Адвокат.png'),
    ],
  },
  {
    id: 'security', name: 'Служба безопасности', color: '#9e2d31', image: asset('IconRole_Глава_СБ.png'), roles: [
      role('Глава службы безопасности', 'IconRole_Глава_СБ.png'), role('Смотритель', 'IconRole_Смотритель.png'),
      role('Инструктор СБ', 'IconRole_Инструктор_СБ.png'), role('Офицер СБ', 'IconRole_Офицер_СБ.png'),
      role('Пилот СБ', 'IconRole_Пилот_СБ.png'), role('Кадет СБ', 'IconRole_Кадет_СБ.png'),
      role('Детектив', 'IconRole_Детектив.png'),
    ],
  },
  {
    id: 'engineering', name: 'Инженерный отдел', color: '#a96f00', image: asset('IconRole_Старший_Инженер.png'), roles: [
      role('Старший Инженер', 'IconRole_Старший_Инженер.png'), role('Ведущий Инженер', 'IconRole_Ведущий_Инженер.png'),
      role('Атмосферный Техник', 'IconRole_Атмосферный_техник.png'), role('Инженер', 'IconRole_Инженер.png'),
      role('Технический ассистент', 'IconRole_Технический_ассистент.png'),
    ],
  },
  {
    id: 'medical', name: 'Медицинский отдел', color: '#2789a3', image: asset('IconRole_Главный_врач.png'), roles: [
      role('Главный врач', 'IconRole_Главный_врач.png'), role('Ведущий Врач', 'IconRole_Ведущий_Врач.png'),
      role('Врач', 'IconRole_Врач.png'), role('Парамедик', 'IconRole_Парамедик.png'),
      role('Бригмедик', 'IconRole_Бригмедик.png'), role('Химик', 'IconRole_Химик.png'),
      role('Психолог', 'IconRole_Психолог.png'), role('Интерн', 'IconRole_Интерн.png'),
    ],
  },
  {
    id: 'science', name: 'Научный отдел', color: '#7427a7', image: asset('IconRole_Научный_руководитель.png'), roles: [
      role('Научный руководитель', 'IconRole_Научный_руководитель.png'), role('Ведущий учёный', 'IconRole_Ведущий_учёный.png'),
      role('Учёный', 'IconRole_Учёный.png'), role('Научный ассистент', 'IconRole_Научный_ассистент.png'),
    ],
  },
  {
    id: 'supply', name: 'Отдел снабжения', color: '#80623e', image: asset('IconRole_Квартермейстер.png'), roles: [
      role('Квартирмейстер', 'IconRole_Квартермейстер.png'), role('Грузчик', 'IconRole_Грузчик.png'),
      role('Утилизатор', 'IconRole_Утилизатор.png'),
    ],
  },
  {
    id: 'service', name: 'Сервисный отдел', color: '#27864d', image: asset('IconRole_Глава_персонала.png'), roles: [
      role('Глава персонала', 'IconRole_Глава_персонала.png'), role('Сервисный Администратор', 'IconRole_Сервисный_администратор.png'),
      role('Уборщик', 'IconRole_Уборщик.png'), role('Шеф-Повар', 'IconRole_Шеф_Повар.png'),
      role('Бармен', 'IconRole_Бармен.png'), role('Ботаник', 'IconRole_Ботаник.png'),
      role('Зоотехник', 'IconRole_Зоотехнолог.png'), role('Репортёр', 'IconRole_Репортёр.png'),
      role('Пассажир', 'IconRole_Пассажир.png'), role('Сервисный работник', 'IconRole_Сервисный_работник.png'),
      role('Боксер', 'IconRole_Боксёр.png'), role('Музыкант', 'IconRole_Музыкант.png'),
      role('Клоун', 'IconRole_Клоун.png'), role('Мим', 'IconRole_Мим.png'),
      role('Священник', 'IconRole_Священник.png'), role('Библиотекарь', 'IconRole_Библиотекарь.png'),
    ],
  },
  {
    id: 'synthetic', name: 'Синтетики', color: '#4e6c83', image: asset('PAI.gif'), roles: [
      role('ИИ', 'AI.gif'), role('Киборг', 'Cyborg.png'), role('Персональный ИИ', 'PAI.gif'),
    ],
  },
  {
    id: 'antag', name: 'Антагонисты', color: '#8d2025', image: asset('Предатель Адольф.png'), roles: [
      role('Ядерный Оперативник', 'NukeLone.png'), role('Маг', 'WizardFed.png'),
      role('Нулевой пациент', 'Zombie-turnFullHD.png'), role('Космический дракон', 'IconRole_Dragon.gif'),
      role('Жнец', 'IconRole_DarkReaper.gif'), role('Ксеноборг', 'Xenoborg.gif'),
      role('Культ Йог-Сотот', 'Cultist.png'), role('Королева Пауков', 'IconRole_SpiderQueen.gif'),
      role('Предатель', 'Предатель Адольф.png'), role('Ревенант', 'IconRole_Revenant.gif'),
      role('Вор', 'Вор.png'), role('Крысиный король', 'IconRole_RatKing.png'),
      role('Космический ниндзя', 'IconRole_SpaceNinja.png'), role('Парадоксальный клон', 'Paradox.gif'),
      role('Агрессивная фауна', 'Tarantula_anim.gif'),
    ],
  },
];

export const departmentById = id => departments.find(department => department.id === id) || departments[0];
