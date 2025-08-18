import { supabase } from '@/lib/supabaseClient'

/**
 * Имя бакета для ассетов. Переименуй при необходимости.
 */
export const ASSETS_BUCKET = 'assets'

/**
 * Допустимые расширения изображений.
 */
export type ImageExt = 'jpg' | 'jpeg' | 'png' | 'webp' | string

/**
 * Формирует безопасный путь для объекта в Storage.
 * Убирает ведущие слэши и триммит пробелы.
 */
function makePath(...parts: string[]) {
  return parts
    .map((p) => p.trim().replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean)
    .join('/')
}

/**
 * Возвращает публичный URL для обложки кампании.
 * Работает ТОЛЬКО если бакет публичный (или политики разрешают публичное чтение).
 *
 * @param campaignId  ID кампании
 * @param ext         Расширение файла, по умолчанию 'jpg'
 * @returns           Строка с URL или null при ошибке формирования
 */
export function getCoverPublicUrl(campaignId: string, ext: string = 'jpg'): string | null {
  if (!campaignId) return null

  const path = `covers/${campaignId}.${ext}`
  const { data } = supabase.storage.from('assets').getPublicUrl(path)

  return data?.publicUrl ?? null
}

/**
 * Возвращает публичный URL для элемента галереи кампании.
 * Работает ТОЛЬКО если бакет публичный (или политики разрешают публичное чтение).
 *
 * @param campaignId  ID кампании
 * @param filename    Имя файла (с расширением), например '1.webp'
 * @returns           Строка с URL или null при ошибке формирования
 */
export function getGalleryItemPublicUrl(campaignId: string, filename: string): string | null {
  if (!campaignId || !filename) return null

  const path = `gallery/${campaignId}/${filename}`
  const { data } = supabase.storage.from('assets').getPublicUrl(path)

  return data?.publicUrl ?? null
}

/**
 * Универсальный помощник для получения подписанной (временной) ссылки
 * на приватный объект в Storage.
 *
 * @param path          Путь внутри бакета (без ведущего '/')
 * @param expiresInSec  Время жизни ссылки в секундах (по умолчанию 10 мин)
 * @returns             Строка с signed URL или null при ошибке
 */
export async function getSignedUrl(
  path: string,
  expiresInSec: number = 60 * 10
): Promise<string | null> {
  try {
    const clean = makePath(path)
    const { data, error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .createSignedUrl(clean, expiresInSec)

    if (error) {
      console.error('[storage] getSignedUrl error:', error)
      return null
    }
    return data.signedUrl
  } catch (e) {
    console.error('[storage] getSignedUrl exception:', e)
    return null
  }
}

/**
 * Возвращает подписанный URL для приватной обложки кампании.
 *
 * @param campaignId    ID кампании
 * @param ext           Расширение файла, по умолчанию 'jpg'
 * @param expiresInSec  Время жизни ссылки (сек), по умолчанию 10 мин
 */
export async function getPrivateCoverUrl(
  campaignId: string,
  ext: ImageExt = 'jpg',
  expiresInSec: number = 60 * 10
): Promise<string | null> {
  if (!campaignId) {
    console.error('[storage] getPrivateCoverUrl: campaignId is required')
    return null
  }
  const path = makePath('covers', `${campaignId}.${ext}`)
  return getSignedUrl(path, expiresInSec)
}

/**
 * Возвращает подписанный URL для приватного элемента галереи.
 *
 * @param campaignId    ID кампании
 * @param filename      Имя файла с расширением
 * @param expiresInSec  Время жизни ссылки (сек)
 */
export async function getPrivateGalleryItemUrl(
  campaignId: string,
  filename: string,
  expiresInSec: number = 60 * 10
): Promise<string | null> {
  if (!campaignId || !filename) {
    console.error('[storage] getPrivateGalleryItemUrl: campaignId & filename are required')
    return null
  }
  const path = makePath('gallery', campaignId, filename)
  return getSignedUrl(path, expiresInSec)
}
