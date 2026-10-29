import { supabaseClient } from '../lib/supabaseClient'

/**
 * Converts a File to exact Base64 Data URL without any quality loss
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses an image file only if it exceeds max size, while preserving colors and transparent backgrounds (fills with white instead of black)
 */
export async function compressAndEncodeImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.9) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        let width = img.width
        let height = img.height

        // If file is already smaller than 1.5MB and within dimensions, return untouched original!
        if (file.size < 1.5 * 1024 * 1024 && width <= maxWidth && height <= maxHeight) {
          return resolve(e.target.result)
        }

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        // Fill background with white in case of transparent PNG so it doesn't turn black!
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mime, quality))
      }
      img.onerror = () => resolve(e.target.result)
    }
    reader.onerror = () => resolve(null)
  })
}

export const uploadService = {
  /**
   * Upload image file to Supabase Storage.
   * Tries buckets 'products' and 'product-images'.
   * If storage upload succeeds, returns public URL from Supabase Storage.
   * If storage upload fails due to RLS, returns exact Base64 Data URL so the exact uploaded image ALWAYS displays.
   */
  async uploadImage(file) {
    if (!file) throw new Error('No file provided')

    // Read exact original Data URL first
    const rawDataUrl = await fileToDataUrl(file)

    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const cleanFileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const filePath = `products/${cleanFileName}`

    // Target buckets in order of preference
    const targetBuckets = ['products', 'product-images']
    let publicUrl = null
    let uploadSuccess = false
    let lastError = null

    for (const bucket of targetBuckets) {
      try {
        const { data, error } = await supabaseClient.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          })

        if (!error && data) {
          const { data: pubData } = supabaseClient.storage.from(bucket).getPublicUrl(filePath)
          if (pubData?.publicUrl) {
            publicUrl = pubData.publicUrl
            uploadSuccess = true
            break
          }
        } else if (error) {
          lastError = error
        }
      } catch (err) {
        lastError = err
      }
    }

    if (uploadSuccess && publicUrl) {
      return { url: publicUrl, fromStorage: true, bucket: 'products' }
    }

    // Fallback: If file is large (> 2MB), compress cleanly; otherwise use rawDataUrl directly for 100% exact match
    let finalUrl = rawDataUrl
    if (file.size > 2 * 1024 * 1024) {
      try {
        const compressed = await compressAndEncodeImage(file)
        if (compressed) finalUrl = compressed
      } catch (cErr) {
        finalUrl = rawDataUrl
      }
    }

    return {
      url: finalUrl,
      fromStorage: false,
      storageError: lastError?.message || 'Storage permission denied'
    }
  },

  /**
   * Helper to format image URL from storage or fallback URL
   */
  getImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
      return url
    }
    const { data } = supabaseClient.storage.from('products').getPublicUrl(url)
    return data?.publicUrl || url
  },
}

export default uploadService
