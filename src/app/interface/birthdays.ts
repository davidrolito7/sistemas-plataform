export interface GenericResponse<T> {
  success: boolean;
  status?: number;
  data: T;
  message?: string;
}

export interface BirthdayPerson {
  NumeroEmpleado: string | number;
  NombreApellidosEmpleado: string | null;
  NombreAdscripcion: string | null;
  Birthday: string | null;
  Photo: string | null;
  Mensaje: string | null;
}

export interface BirthdayCard {
  id: string;
  name: string;
  role: string;
  birthdayLabel: string;
  daysUntil: number;
  isNext: boolean;
  message: string;
  photoUrl: string;
}

const DEFAULT_MESSAGE = 'Una fecha especial para reconocer su talento, energia y aportacion al equipo.';
const DEFAULT_PHOTO_URL = 'default.png';

export function buildBirthdayCards(people: BirthdayPerson[], today = new Date()): BirthdayCard[] {
  const currentDay = startOfDay(today);

  const cards: BirthdayCard[] = people.map((person, index) => {
    const raw = person.Birthday?.trim();

    if (!raw) {
      return {
        id: String(person.NumeroEmpleado ?? index + 1),
        name: sanitizeText(person.NombreApellidosEmpleado, 'Sin nombre'),
        role: sanitizeText(person.NombreAdscripcion, 'Sin adscripcion'),
        birthdayLabel: 'Esperando ...',
        daysUntil: Number.MAX_SAFE_INTEGER,
        isNext: false,
        message: sanitizeText(person.Mensaje, DEFAULT_MESSAGE),
        photoUrl: toPhotoDataUrl(person.Photo) || DEFAULT_PHOTO_URL
      };
    }

    const { month, day } = parseBirthday(raw);
    const nextBirthday = getNextBirthday(month, day, currentDay);
    const daysUntil = Math.round((nextBirthday.getTime() - currentDay.getTime()) / 86_400_000);

    return {
      id: String(person.NumeroEmpleado ?? index + 1),
      name: sanitizeText(person.NombreApellidosEmpleado, 'Sin nombre'),
      role: sanitizeText(person.NombreAdscripcion, 'Sin adscripcion'),
      birthdayLabel: formatBirthdayLabel(month, day),
      daysUntil,
      isNext: false,
      message: sanitizeText(person.Mensaje, DEFAULT_MESSAGE),
      photoUrl: toPhotoDataUrl(person.Photo) || DEFAULT_PHOTO_URL
    };
  });

  // Ordenar por días restantes; los con 'Esperando ...' tienen daysUntil = MAX_SAFE_INTEGER y quedarán al final
  cards.sort((a, b) => a.daysUntil - b.daysUntil);

  // Marcar el primero como siguiente si existe
  if (cards.length > 0 && cards[0].daysUntil !== Number.MAX_SAFE_INTEGER) {
    cards[0].isNext = true;
  }

  return cards;
}

function parseBirthday(rawBirthday: string | null | undefined): { month: number; day: number } {
  if (!rawBirthday) {
    return { month: 1, day: 1 };
  }

  const parts = rawBirthday
    .split('/')
    .map((value) => Number(value.trim()));

  const first = parts[0];
  const second = parts[1];

  if (
    parts.length !== 2
    || !Number.isFinite(first)
    || !Number.isFinite(second)
  ) {
    return { month: 1, day: 1 };
  }

  let day = first;
  let month = second;

  // El API esperado viene como DD/MM (ejemplo: 20/10).
  // Si llega invertido en algun caso, intentamos corregirlo sin romper el flujo.
  if (first <= 12 && second > 12) {
    month = first;
    day = second;
  }

  if (
    Number.isFinite(month)
    && Number.isFinite(day)
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= 31
  ) {
    return { month, day };
  }

  return { month: 1, day: 1 };
}

function getNextBirthday(month: number, day: number, today: Date): Date {
  let nextBirthday = new Date(today.getFullYear(), month - 1, day);

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }

  return nextBirthday;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatBirthdayLabel(month: number, day: number): string {
  const displayDate = new Date(2024, month - 1, day);

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long'
  }).format(displayDate);
}

function toPhotoDataUrl(photo: string | null | undefined): string {
  if (!photo) {
    return '';
  }

  if (photo.startsWith('data:image')) {
    return photo;
  }

  const normalizedPhoto = photo
    .replace(/\\\//g, '/')
    .replace(/\s+/g, '')
    .replace(/^"|"$/g, '')
    .trim();

  if (!normalizedPhoto) {
    return '';
  }

  const mimeType = detectMimeTypeFromBase64(normalizedPhoto);
  return `data:${mimeType};base64,${normalizedPhoto}`;
}

function sanitizeText(value: string | null | undefined, fallback: string): string {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : fallback;
}

function detectMimeTypeFromBase64(base64Value: string): string {
  if (base64Value.startsWith('/9j/')) {
    return 'image/jpeg';
  }

  if (base64Value.startsWith('iVBORw0KGgo')) {
    return 'image/png';
  }

  if (base64Value.startsWith('R0lGOD')) {
    return 'image/gif';
  }

  if (base64Value.startsWith('UklGR')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}