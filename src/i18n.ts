import { createContext, useContext } from 'react'
import type { BoutError } from './domain/bout'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { it } from './locales/it'

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const ru = {
  locale: 'ru-RU',
  decimal: ',',
  languageName: 'Русский',

  appTitle: 'Протоколы',
  weaponLabel: 'Оружие',
  weapons: { epee: 'Шпага', foil: 'Рапира', sabre: 'Сабля' },
  minutesHintSabre: (n: number) => `у сабли в олимпийке — перерыв 1 мин, когда у одного из бойцов ${n} уколов`,
  breakAt: (n: number) => `${n} уколов — перерыв`,
  newTournament: '+ Новый старт',
  emptyList: 'Пока нет стартов. Создайте первый — он сохранится на этом устройстве и будет доступен без интернета.',
  deleteAsk: (name: string) => `Удалить «${name}»? Это нельзя отменить.`,
  deleteLabel: (name: string) => `Удалить ${name}`,
  defaultName: (n: number, date: string) => `Старт №${n} · ${date}`,
  fallbackName: 'Старт',

  settings: 'Настройки',
  openSettings: 'Открыть настройки',
  language: 'Язык',
  theme: 'Цветовая тема',
  mode: 'Оформление',
  modes: { auto: 'Как в системе', light: 'Светлое', dark: 'Тёмное' },
  palette: (n: number) => `Палитра ${n}`,
  backup: 'Резервная копия',
  backupHint: 'Все старты одним файлом — чтобы не потерять данные или перенести на другое устройство.',
  backupSave: 'Сохранить в файл',
  backupLoad: 'Загрузить из файла',
  backupLoaded: (n: number) => `Загружено стартов: ${n}`,
  backupFailed: (msg: string) => `Не удалось загрузить файл: ${msg}`,
  backupEmpty: 'В файле нет стартов',
  close: 'Закрыть',
  less: 'Меньше',
  more: 'Больше',

  statusSetup: (n: number) => `Подготовка · ${n} уч.`,
  statusPools: (done: number, total: number) => `Пульки · ${done} из ${total} боёв`,
  statusTableau: 'Олимпийка',
  statusFinished: 'Завершён',
  statusWinner: (name: string) => `Завершён · победитель ${name}`,

  tabs: { setup: 'Участники', pools: 'Пульки', tableau: 'Олимпийка', results: 'Итоги' },
  notFound: 'Старт не найден.',
  toList: 'К списку стартов',

  name: 'Название',
  fencers: 'Участники',
  shuffle: 'Перемешать',
  seedHint: 'Порядок списка — посев: по нему бойцы раскладываются по пулькам «змейкой».',
  fencerN: (n: number) => `Боец ${n}`,
  up: 'Выше',
  down: 'Ниже',
  namePlaceholder: 'Фамилия Имя',
  add: 'Добавить',
  tournamentSettings: 'Настройки старта',
  groupPools: 'Пульки',
  groupTableau: 'Олимпийка',
  groupTimer: 'Таймер',
  touches: 'Уколов до победы',
  maxPoolSize: 'Максимум бойцов в пульке',
  eliminated: 'Не проходят в олимпийку',
  eliminatedHint: 'последние по итогам пулек',
  allPass: 'Все проходят',
  thirdPlace: 'Бой за 3-е место',
  timer: 'Таймер боя',
  minutes: 'Минут на бой',
  minutesHint: 'в олимпийке — 3 периода с перерывом 1 мин',
  poolsLocked: 'Пульки сформированы — состав и параметры пулек изменить нельзя.',
  toPools: 'К пулькам',
  resetPools: 'Сбросить пульки',
  resetPoolsAsk: 'Сбросить пульки? Все результаты пулек и олимпийки будут удалены.',
  poolsPreview: (count: number, sizes: string) =>
    `${count} ${pluralRu(count, 'пулька', 'пульки', 'пулек')}: ${sizes}`,
  makePools: 'Сформировать пульки',

  noPools: 'Пульки ещё не сформированы.',
  toFencers: 'К участникам',
  pool: (name: string) => `Пулька ${name}`,
  piste: (p: string) => `Дорожка ${p}`,
  pisteLabel: 'Дорожка',
  protocol: 'Протокол',
  boutsOf: (done: number, total: number) => `${done} из ${total} боёв`,
  protocolLocked: 'Олимпийка сформирована — протокол только для просмотра.',
  cellHint: 'Нажмите на клетку, чтобы внести или исправить счёт. V — победа, V2 — победа по времени с 2 уколами.',
  lockedAlert:
    'Олимпийка уже сформирована. Чтобы изменить результаты пулек, пересоберите её на вкладке «Олимпийка».',
  schedule: 'Очерёдность боёв',
  now: 'сейчас',
  boutN: (n: number) => `Бой ${n}`,
  rankingAfterPools: 'Рейтинг после пулек',
  preliminary: 'предварительный',
  rankingHint: 'Порядок: V/M → индекс → нанесённые уколы. При полном равенстве бойцы делят место.',
  makeTableau: 'Сформировать олимпийку',
  boutsLeft: (n: number) => `Осталось боёв: ${n}`,
  out: 'не проходит',

  col: {
    num: '№',
    fencer: 'Боец',
    place: 'М',
    placeFull: 'Место',
    pool: 'Пулька',
    v: 'V',
    bouts: 'Бои',
    vm: 'V/M',
    ts: 'НН',
    tr: 'П',
    ind: 'Инд',
  },
  colTitle: {
    v: 'Победы',
    vm: 'Победы / бои',
    ts: 'Нанесённые уколы',
    tr: 'Пропущенные уколы',
    ind: 'Индекс: нанесённые − пропущенные',
    place: 'Место в пульке',
  },

  timeOfBout: 'Время боя',
  period: (p: number, n: number) => `Период ${p} из ${n}`,
  breakLabel: 'Перерыв',
  timeUp: 'Время вышло',
  start: 'Старт',
  pause: 'Пауза',
  resume: 'Продолжить',
  reset: 'Сброс',
  breakButton: (time: string) => `Перерыв ${time}`,
  periodButton: (n: number) => `Период ${n}`,
  minusTouch: (name: string) => `Минус укол: ${name}`,
  plusTouch: (name: string) => `Укол: ${name}`,
  boutTo: (n: number) => `Бой до ${n} уколов`,
  priority: 'Равный счёт — победа по приоритету:',
  save: 'Сохранить',
  clearResult: 'Удалить результат',
  errors: {
    noWinner: () => 'Не выбран победитель',
    badScore: () => 'Счёт должен быть целым неотрицательным числом',
    overLimit: (n: number) => `Счёт не может быть больше ${n}`,
    bothLimit: (n: number) => `Оба бойца не могут набрать ${n}`,
    winnerLess: () => 'У победителя не может быть меньше уколов',
    loserLimit: () => 'Проигравший не может набрать лимит уколов',
  } satisfies Record<BoutError, (n: number) => string>,

  tableauAfterPools: 'Олимпийка формируется после пулек.',
  boutsDone: (done: number, total: number) => `Проведено боёв: ${done} из ${total}.`,
  roundName: (matches: number) => (matches === 1 ? 'Финал' : matches === 2 ? '1/2 финала' : `1/${matches} финала`),
  touchesTo: (n: number) => `до ${n} уколов`,
  bye: 'свободный проход',
  tbd: 'ожидается',
  bronze: 'Бой за 3-е место',
  toResults: 'Итоги старта',
  notQualified: (names: string) => `Не прошли в олимпийку: ${names}`,
  rebuild: 'Пересобрать олимпийку',
  rebuildAsk: 'Пересобрать олимпийку? Все результаты олимпийки будут удалены, пульки снова станут редактируемыми.',
  droppedAsk: (n: number) => `Победитель изменился — следующих боёв будет сброшено: ${n}. Продолжить?`,
  viewTree: 'Схема',
  viewList: 'Списком',

  exportPdf: 'PDF',
  exportCsv: 'CSV',
  exportJson: 'JSON',
  openFile: 'Открыть старт из файла',
  print: 'Печать',
  finalPlaces: 'Итоговые места',
  results: 'Итоги',
  notStarted: 'Старт ещё не начался.',
  afterFinal: (bronze: boolean) => `Итоговые места появятся после финала${bronze ? ' и боя за 3-е место' : ''}.`,
  tableau: 'Олимпийка',
  poolProtocol: (name: string | null) => (name ? `Протокол пульки ${name}` : 'Протокол пульки'),
  csv: {
    num: '№',
    fencer: 'Боец',
    v: 'V',
    bouts: 'Бои',
    vm: 'V/M',
    ts: 'Нанесено',
    tr: 'Получено',
    ind: 'Индекс',
    finalPlace: 'Итоговое место',
    poolPlace: 'Место после пулек',
  },
  pdfFailed: (msg: string) => `Не удалось создать PDF: ${msg}`,
  statusWithdrawn: 'снят',
  statusExcluded: 'искл.',
  statusAbsent: 'неявка',
  retire: 'Снять',
  retireTitle: (name: string) => `Снять бойца: ${name}`,
  retireWithdraw: 'Снять со старта',
  retireWithdrawHint: 'травма, отказ продолжать — место по пройденному кругу сохраняется',
  retireAbsent: 'Неявка',
  retireAbsentHint: 'нет за 10 мин до начала или не вышел после трёх вызовов — исключение из соревнования (FIE t.118, t.119)',
  retireBlack: 'Чёрная карточка',
  retireBlackHint: 'грубое нарушение (3-я и 4-я группа FIE t.170) — исключение без места',
  retirePoolsNote: 'Все бои бойца в пульке аннулируются, показатели соперников пересчитаются.',
  retireTableauNote: 'Результаты пулек остаются, соперник в олимпийке проходит дальше без боя.',
  restore: 'Вернуть бойца',
  annulled: 'аннулирован',
  retiredList: (names: string) => `Сняты: ${names}`,
  cards: 'Карточки',
  yellow: 'Жёлтая',
  red: 'Красная',
  black: 'Чёрная',
  redHint: 'жёлтая — предупреждение, после неё любое нарушение — красная; каждая красная — укол сопернику',
  choosePriority: 'Счёт равный — выберите, кто победил по приоритету',
  undoCard: 'Убрать последнюю карточку',
  switchTournament: 'Переключить старт',
  duplicateName: (names: string) =>
    `Такой боец уже есть: ${names}. Добавьте отличие — букву фамилии или номер (Максим Р., Максим 2).`,
  blackAsk: (name: string) => `Чёрная карточка: ${name} исключается из соревнования. Продолжить?`,
}

export type Dict = typeof ru

const en: Dict = {
  locale: 'en-GB',
  decimal: '.',
  languageName: 'English',

  appTitle: 'Protocols',
  weaponLabel: 'Weapon',
  weapons: { epee: 'Épée', foil: 'Foil', sabre: 'Sabre' },
  minutesHintSabre: (n) => `sabre elimination: 1-min break when a fencer reaches ${n} touches`,
  breakAt: (n) => `${n} touches — break`,
  newTournament: '+ New event',
  emptyList: 'No events yet. Create the first one — it is stored on this device and works offline.',
  deleteAsk: (name) => `Delete “${name}”? This cannot be undone.`,
  deleteLabel: (name) => `Delete ${name}`,
  defaultName: (n, date) => `Event #${n} · ${date}`,
  fallbackName: 'Event',

  settings: 'Settings',
  openSettings: 'Open settings',
  language: 'Language',
  theme: 'Colour theme',
  mode: 'Appearance',
  modes: { auto: 'System', light: 'Light', dark: 'Dark' },
  palette: (n) => `Palette ${n}`,
  backup: 'Backup',
  backupHint: 'All events in one file — to keep your data safe or move it to another device.',
  backupSave: 'Save to file',
  backupLoad: 'Load from file',
  backupLoaded: (n) => `Events loaded: ${n}`,
  backupFailed: (msg) => `Could not load the file: ${msg}`,
  backupEmpty: 'No events in the file',
  close: 'Close',
  less: 'Decrease',
  more: 'Increase',

  statusSetup: (n) => `Setup · ${n} fencers`,
  statusPools: (done, total) => `Pools · ${done} of ${total} bouts`,
  statusTableau: 'Direct elimination',
  statusFinished: 'Finished',
  statusWinner: (name) => `Finished · winner ${name}`,

  tabs: { setup: 'Fencers', pools: 'Pools', tableau: 'Elimination', results: 'Results' },
  notFound: 'Event not found.',
  toList: 'Back to events',

  name: 'Name',
  fencers: 'Fencers',
  shuffle: 'Shuffle',
  seedHint: 'List order is the seeding: fencers are spread across pools in a snake pattern.',
  fencerN: (n) => `Fencer ${n}`,
  up: 'Up',
  down: 'Down',
  namePlaceholder: 'Surname Name',
  add: 'Add',
  tournamentSettings: 'Event settings',
  groupPools: 'Pools',
  groupTableau: 'Direct elimination',
  groupTimer: 'Timer',
  touches: 'Touches to win',
  maxPoolSize: 'Max fencers per pool',
  eliminated: 'Eliminated after pools',
  eliminatedHint: 'lowest ranked after pools',
  allPass: 'Nobody',
  thirdPlace: 'Bout for 3rd place',
  timer: 'Bout timer',
  minutes: 'Minutes per bout',
  minutesHint: 'elimination bouts: 3 periods with a 1-min break',
  poolsLocked: 'Pools are set — fencers and pool settings can no longer be changed.',
  toPools: 'Go to pools',
  resetPools: 'Reset pools',
  resetPoolsAsk: 'Reset pools? All pool and elimination results will be deleted.',
  poolsPreview: (count, sizes) => `${count} ${count === 1 ? 'pool' : 'pools'}: ${sizes}`,
  makePools: 'Create pools',

  noPools: 'Pools have not been created yet.',
  toFencers: 'Go to fencers',
  pool: (name) => `Pool ${name}`,
  piste: (p) => `Piste ${p}`,
  pisteLabel: 'Piste',
  protocol: 'Pool sheet',
  boutsOf: (done, total) => `${done} of ${total} bouts`,
  protocolLocked: 'Elimination has started — the pool sheet is read-only.',
  cellHint: 'Tap a cell to enter or correct a score. V — win, V2 — win on time with 2 touches.',
  lockedAlert: 'Elimination has already been created. To change pool results, rebuild it on the Elimination tab.',
  schedule: 'Bout order',
  now: 'now',
  boutN: (n) => `Bout ${n}`,
  rankingAfterPools: 'Ranking after pools',
  preliminary: 'preliminary',
  rankingHint: 'Order: V/M → indicator → touches scored. Fully equal fencers share a place.',
  makeTableau: 'Create elimination table',
  boutsLeft: (n) => `Bouts left: ${n}`,
  out: 'eliminated',

  col: {
    num: 'No.',
    fencer: 'Fencer',
    place: 'Pl',
    placeFull: 'Place',
    pool: 'Pool',
    v: 'V',
    bouts: 'M',
    vm: 'V/M',
    ts: 'TS',
    tr: 'TR',
    ind: 'Ind',
  },
  colTitle: {
    v: 'Victories',
    vm: 'Victories / matches',
    ts: 'Touches scored',
    tr: 'Touches received',
    ind: 'Indicator: scored − received',
    place: 'Place in pool',
  },

  timeOfBout: 'Bout time',
  period: (p, n) => `Period ${p} of ${n}`,
  breakLabel: 'Break',
  timeUp: 'Time is up',
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  reset: 'Reset',
  breakButton: (time) => `Break ${time}`,
  periodButton: (n) => `Period ${n}`,
  minusTouch: (name) => `Remove touch: ${name}`,
  plusTouch: (name) => `Touch: ${name}`,
  boutTo: (n) => `Bout to ${n} touches`,
  priority: 'Equal score — won on priority by:',
  save: 'Save',
  clearResult: 'Delete result',
  errors: {
    noWinner: () => 'No winner selected',
    badScore: () => 'Score must be a whole non-negative number',
    overLimit: (n) => `Score cannot exceed ${n}`,
    bothLimit: (n) => `Both fencers cannot reach ${n}`,
    winnerLess: () => 'The winner cannot have fewer touches',
    loserLimit: () => 'The loser cannot reach the touch limit',
  },

  tableauAfterPools: 'The elimination table is created after the pools.',
  boutsDone: (done, total) => `Bouts fenced: ${done} of ${total}.`,
  roundName: (matches) =>
    matches === 1 ? 'Final' : matches === 2 ? 'Semi-finals' : matches === 4 ? 'Quarter-finals' : `Table of ${matches * 2}`,
  touchesTo: (n) => `to ${n} touches`,
  bye: 'bye',
  tbd: 'to be decided',
  bronze: 'Bout for 3rd place',
  toResults: 'Event results',
  notQualified: (names) => `Eliminated after pools: ${names}`,
  rebuild: 'Rebuild elimination table',
  rebuildAsk: 'Rebuild the elimination table? All elimination results will be deleted and pools become editable again.',
  droppedAsk: (n) => `The winner changed — ${n} later bouts will be reset. Continue?`,
  viewTree: 'Bracket',
  viewList: 'List',

  exportPdf: 'PDF',
  exportCsv: 'CSV',
  exportJson: 'JSON',
  openFile: 'Open event from file',
  print: 'Print',
  finalPlaces: 'Final ranking',
  results: 'Results',
  notStarted: 'The event has not started yet.',
  afterFinal: (bronze) => `Final places appear after the final${bronze ? ' and the bout for 3rd place' : ''}.`,
  tableau: 'Direct elimination',
  poolProtocol: (name) => (name ? `Pool ${name} sheet` : 'Pool sheet'),
  csv: {
    num: 'No.',
    fencer: 'Fencer',
    v: 'V',
    bouts: 'Matches',
    vm: 'V/M',
    ts: 'Touches scored',
    tr: 'Touches received',
    ind: 'Indicator',
    finalPlace: 'Final place',
    poolPlace: 'Place after pools',
  },
  pdfFailed: (msg) => `Could not create the PDF: ${msg}`,
  statusWithdrawn: 'withdrawn',
  statusExcluded: 'excluded',
  statusAbsent: 'absent',
  retire: 'Withdraw',
  retireTitle: (name) => `Withdraw fencer: ${name}`,
  retireWithdraw: 'Withdraw from the event',
  retireWithdrawHint: 'injury, unable to continue — keeps the place of the round reached',
  retireAbsent: 'Absent',
  retireAbsentHint: 'not there 10 min before the start or after three calls — eliminated from the competition (FIE t.118, t.119)',
  retireBlack: 'Black card',
  retireBlackHint: 'serious offence (groups 3 and 4, FIE t.170) — excluded with no ranking',
  retirePoolsNote: 'All of this fencer’s pool bouts are annulled and opponents’ indicators are recalculated.',
  retireTableauNote: 'Pool results stay; the elimination opponent advances without fencing.',
  restore: 'Return the fencer',
  annulled: 'annulled',
  retiredList: (names) => `Withdrawn: ${names}`,
  cards: 'Cards',
  yellow: 'Yellow',
  red: 'Red',
  black: 'Black',
  redHint: 'yellow — warning, any further offence is red; every red gives a touch to the opponent',
  choosePriority: 'The score is equal — choose who won on priority',
  undoCard: 'Remove last card',
  switchTournament: 'Switch event',
  duplicateName: (names) =>
    `Already in the list: ${names}. Make the names different — add a surname initial or a number (Max R., Max 2).`,
  blackAsk: (name) => `Black card: ${name} is excluded from the competition. Continue?`,
}

// Порядок здесь — порядок в списке языков.
export const dictionaries = { en, fr, it, es, ru }
export type Lang = keyof typeof dictionaries

const KEY = 'lang'

export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && saved in dictionaries) return saved as Lang
  } catch {
    // хранилище недоступно
  }
  return 'en'
}

export function saveLang(lang: Lang) {
  document.documentElement.lang = lang
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // не сохранилось — язык действует до перезапуска
  }
}

export interface I18n {
  lang: Lang
  L: Dict
  setLang: (lang: Lang) => void
}

export const I18nContext = createContext<I18n>({ lang: 'en', L: en, setLang: () => {} })

export function useI18n(): I18n {
  return useContext(I18nContext)
}

export function dateFormat(L: Dict): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatRatio(L: Dict, ratio: number): string {
  return ratio.toFixed(2).replace('.', L.decimal)
}
