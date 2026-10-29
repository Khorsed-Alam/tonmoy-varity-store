import { supabaseClient } from '../lib/supabaseClient'
import { DEFAULT_CATEGORIES, generateFlatCategoryList, LEGACY_CATEGORY_MAP, ALLOWED_MAIN_SLUGS, getLevel2Subcategories, getLevel3Items } from '../data/categories'

export const categoryService = {
  /**
   * Fetch all active categories sorted by sort_order
   */
  async getCategories(includeInactive = false) {
    try {
      let query = supabaseClient
        .from('categories')
        .select('*')
        .order('sort_order')

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query
      if (error) throw error

      if (data && data.length > 0) {
        // Enrich remote data with subcategories from DEFAULT_CATEGORIES if empty
        return data.map(cat => {
          const matched = DEFAULT_CATEGORIES.find(c => c.slug === cat.slug || c.id === cat.id)
          return {
            ...matched,
            ...cat,
            subcategories: cat.subcategories && cat.subcategories.length > 0
              ? cat.subcategories
              : (matched?.subcategories || [])
          }
        })
      }
      return DEFAULT_CATEGORIES
    } catch (e) {
      console.warn('Using default categories fallback:', e)
      return DEFAULT_CATEGORIES
    }
  },

  /**
   * Fetch only the 7 Official Level 1 Main categories (filtering out any obsolete ones)
   */
  async getMainCategories() {
    const all = await this.getCategories()
    const mainOnly = all.filter(c => (!c.level || c.level === 1) && ALLOWED_MAIN_SLUGS.includes(c.slug))
    return mainOnly.length > 0 ? mainOnly : DEFAULT_CATEGORIES
  },

  /**
   * Find a category by slug or ID with fallback
   */
  findCategory(slugOrId, allCategories = DEFAULT_CATEGORIES) {
    if (!slugOrId) return null
    // Check direct match
    const direct = allCategories.find(c => c.slug === slugOrId || c.id === slugOrId)
    if (direct) return direct

    // Check legacy mapping
    const legacy = LEGACY_CATEGORY_MAP[slugOrId]
    if (legacy) {
      return allCategories.find(c => c.slug === legacy.mainSlug) || DEFAULT_CATEGORIES[0]
    }

    return null
  },

  /**
   * Get subcategories (Level 2) for a given main category slug or object
   */
  getSubcategories(mainCat) {
    if (!mainCat) return []
    if (typeof mainCat === 'string') {
      const found = DEFAULT_CATEGORIES.find(c => c.slug === mainCat || c.id === mainCat)
      return getLevel2Subcategories(found)
    }
    return getLevel2Subcategories(mainCat)
  },

  /**
   * Get Level 3 child items for a given subcategory
   */
  getChildCategories(mainCat, subcategoryNameOrSlug) {
    return getLevel3Items(mainCat, subcategoryNameOrSlug)
  },

  /**
   * Create a new category
   */
  async createCategory(categoryData) {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert([categoryData])
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update category
   */
  async updateCategory(id, updates) {
    const { data, error } = await supabaseClient
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete category with product reference validation
   */
  async deleteCategory(id) {
    // Check if any product is assigned to this category
    const { count, error: countErr } = await supabaseClient
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (!countErr && count > 0) {
      throw new Error(`এই ক্যাটাগরিতে ${count}টি পণ্য যুক্ত রয়েছে। পণ্য স্থানান্তরিত না করে ক্যাটাগরি মুছে ফেলা যাবে না।`)
    }

    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Idempotent seed function to populate all 7 main categories & their nested 3-level hierarchy in Supabase
   * and clean up obsolete preexisting categories
   */
  async seedCategories() {
    // 1. Remove obsolete preexisting Level 1 categories that do not match the 7 official slugs
    try {
      await supabaseClient
        .from('categories')
        .delete()
        .eq('level', 1)
        .not('slug', 'in', `(${ALLOWED_MAIN_SLUGS.map(s => `'${s}'`).join(',')})`)
    } catch (e) {
      console.warn('Notice on cleaning old categories:', e)
    }

    // 2. Generate flat list of Level 1, 2, 3 categories
    const flatCategories = generateFlatCategoryList().map(c => ({
      id: c.id,
      name: c.name,
      name_bn: c.name_bn,
      slug: c.slug,
      icon: c.icon,
      icon_name: c.icon_name,
      description: c.description,
      description_bn: c.description_bn,
      parent_id: c.parent_id || c.parent_category_id || null,
      parent_category_id: c.parent_category_id || null,
      level: c.level,
      sort_order: c.sort_order,
      is_active: c.is_active,
      subcategories: c.subcategories || []
    }))

    const { data, error } = await supabaseClient
      .from('categories')
      .upsert(flatCategories, { onConflict: 'slug' })
      .select('*')

    if (error) throw error

    // 3. Remap legacy product slugs to the new main categories
    try {
      await supabaseClient
        .from('products')
        .update({ category_slug: 'cooking-essentials' })
        .in('category_slug', ['rice-dal', 'edible-oil', 'spices', 'flour', 'essentials', 'sugar-salt'])

      await supabaseClient
        .from('products')
        .update({ category_slug: 'snacks-beverages' })
        .in('category_slug', ['snacks-tea'])

      await supabaseClient
        .from('products')
        .update({ category_slug: 'cleaning-household' })
        .in('category_slug', ['soap-cleaning', 'cleaning-supplies'])
    } catch (err) {
      console.warn('Notice on migrating product category slugs:', err)
    }

    return data
  }
}

export default categoryService
