import apiClient from './axios';
import {
  getCategories,
  getMenuItems,
  getTables,
  getOrders,
  saveOrders,
  addMyOrderNumber,
} from './storage';
import { MenuItem, Order, OrderStatus, RestaurantTable, CartItem, Category } from '../types';

/**
 * BhojanQR Real Axios API Client
 * Connects directly to Django 5 REST Framework endpoints:
 *  - GET    /menu/categories/
 *  - GET    /menu/items/
 *  - POST   /menu/items/
 *  - PATCH  /menu/items/:id/
 *  - DELETE /menu/items/:id/
 *  - GET    /tables/
 *  - POST   /tables/
 *  - GET    /tables/:id/generate_qr/
 *  - GET    /orders/
 *  - POST   /orders/
 *  - PATCH  /orders/:id/update_status/
 *  - GET    /orders/kitchen_feed/
 */

const getApiErrorMessage = (err: any, fallback: string): string => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const detail =
    (typeof data?.detail === 'string' && data.detail) ||
    (typeof data?.error === 'string' && data.error) ||
    (typeof data?.message === 'string' && data.message) ||
    (Array.isArray(data?.non_field_errors) && typeof data.non_field_errors[0] === 'string' && data.non_field_errors[0]) ||
    null;
  if (detail) {
    if (status === 403 && /csrf/i.test(detail)) {
      return `CSRF/auth error: ${detail}. Refresh the page and sign in again.`;
    }
    if (status === 403) return `Permission denied: ${detail}`;
    if (status === 401) return `Session expired: ${detail}`;
    return detail;
  }
  if (status === 403) return 'Permission denied (403). Check staff login/permissions and CSRF configuration.';
  if (status === 401) return 'Session expired (401). Please sign in again.';
  if (status === 400) return 'Invalid request (400). Please check the data and try again.';
  return err?.message || fallback;
};

const toAbsoluteImageUrl = (url?: string): string => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url;
  if (url.startsWith('/') && typeof window !== 'undefined') return `${window.location.origin}${url}`;
  return url;
};

const pickImage = (item: any): string => {
  // Prefer uploaded image file path/URL from backend, fall back to image_url
  if (item?.image) {
    if (typeof item.image === 'string') return item.image;
    if (item.image?.url) return item.image.url;
  }
  return item?.image_url || '';
};

export const api = {
  categories: {
    list: async (params?: { strict?: boolean }): Promise<Category[]> => {
      try {
        const response = await apiClient.get<any>('/menu/categories');
        const raw = response.data;
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(raw?.categories)
                ? raw.categories
                : null;
        if (arr) {
          return arr.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug,
            icon: c.icon || 'UtensilsCrossed',
            itemCount: c.items_count ?? c.itemCount ?? 0,
          }));
        }
        console.warn('[api.categories.list] unexpected response shape', raw);
        if (params?.strict) throw new Error('Unexpected categories response format from server.');
      } catch (err) {
        console.error('[api.categories.list] error', err);
        if (params?.strict) throw err;
      }
      return getCategories();
    },

    create: async (data: { name: string; slug: string; icon?: string; order?: number }): Promise<Category> => {
      const response = await apiClient.post<any>('/menu/categories', data);
      return {
        id: String(response.data.id),
        name: response.data.name,
        slug: response.data.slug,
        icon: response.data.icon || 'UtensilsCrossed',
        itemCount: response.data.items_count || 0,
      };
    },

    update: async (id: string, data: Partial<{ name: string; slug: string; icon: string; order: number }>): Promise<Category> => {
      const response = await apiClient.patch<any>(`/menu/categories/${id}`, data);
      return {
        id: String(response.data.id),
        name: response.data.name,
        slug: response.data.slug,
        icon: response.data.icon || 'UtensilsCrossed',
        itemCount: response.data.items_count || 0,
      };
    },

    delete: async (id: string): Promise<boolean> => {
      await apiClient.delete(`/menu/categories/${id}`);
      return true;
    },
  },

  menu: {
    list: async (params?: { category?: string; food_type?: string; search?: string; include_inactive?: boolean; strict?: boolean }): Promise<MenuItem[]> => {
      const { strict, ...query } = params || {};
      const mapItem = (item: any): MenuItem => ({
        id: String(item.id),
        name: item.name,
        slug: item.slug,
        category: item.category_slug || String(item.category),
        description: item.description,
        price: Number(item.price),
        image: pickImage(item),
        foodType: item.food_type,
        isAvailable: item.is_available,
        isActive: item.is_active,
        isDeleted: item.is_deleted,
        popularity: item.popularity || 0,
        tags: item.tags || [],
        orderCount: item.order_count || 0,
        isPopular: item.is_popular,
        isSpecial: item.is_special,
        spiciness: item.spiciness,
        preparationTimeMins: item.preparation_time_mins,
        rating: 4.8,
        reviewCount: 150,
        discountPercentage: item.discount_percentage ?? 0,
        offerActive: item.offer_active ?? false,
        offerStartDate: item.offer_start_date ?? null,
        offerEndDate: item.offer_end_date ?? null,
        isOfferActive: item.is_offer_active ?? ((item.discount_percentage ?? 0) > 0),
      });
      try {
        const response = await apiClient.get<any[]>('/menu/items', { params: Object.keys(query).length ? query : undefined });
        if (response.data && Array.isArray(response.data)) {
          const items = response.data.map(mapItem);
          // Admin requests must never be masked by local cache fallback.
          if (query.include_inactive) return items;
          return items.filter((i) => !i.isDeleted && i.isActive !== false && i.isAvailable !== false);
        }
      } catch (err) {
        if (strict || query.include_inactive) throw err;
        // Fallback to cache buffer for customer-only reads
      }
      if (query.include_inactive) return [];
      return getMenuItems().filter((i) => !i.isDeleted && i.isActive !== false && i.isAvailable !== false);
    },

    get: async (id: string): Promise<MenuItem | null> => {
      const mapItem = (item: any): MenuItem => ({
        id: String(item.id),
        name: item.name,
        slug: item.slug,
        category: item.category_slug || String(item.category),
        description: item.description,
        price: Number(item.price),
        image: pickImage(item),
        foodType: item.food_type,
        isAvailable: item.is_available,
        isActive: item.is_active,
        isDeleted: item.is_deleted,
        popularity: item.popularity || 0,
        tags: item.tags || [],
        orderCount: item.order_count || 0,
        isPopular: item.is_popular,
        isSpecial: item.is_special,
        spiciness: item.spiciness,
        preparationTimeMins: item.preparation_time_mins,
        rating: 4.8,
        reviewCount: 150,
        discountPercentage: item.discount_percentage ?? 0,
        offerActive: item.offer_active ?? false,
        offerStartDate: item.offer_start_date ?? null,
        offerEndDate: item.offer_end_date ?? null,
        isOfferActive: item.is_offer_active ?? ((item.discount_percentage ?? 0) > 0),
      });
      try {
        const response = await apiClient.get<any>(`/menu/items/${id}`);
        if (response.data) return mapItem(response.data);
      } catch (err) {
        // fallback below
      }
      const cached = getMenuItems().find((m) => String(m.id) === String(id));
      if (cached) return cached;
      try {
        const items = await api.menu.list({ include_inactive: true });
        return items.find((m) => String(m.id) === String(id)) || null;
      } catch {
        return null;
      }
    },

    create: async (
      data: any,
      resolvedCategory?: { id: number | string; slug: string }
    ): Promise<MenuItem> => {
      let categoryId: number | null = null;
      let categorySlug: string | null = null;

      const tryResolve = (cats: Category[]) => {
        if (data.categoryId != null) {
          const idNum = Number(data.categoryId);
          if (Number.isFinite(idNum) && idNum > 0) {
            const found = cats.find((c) => Number(c.id) === idNum);
            if (found) { categoryId = idNum; categorySlug = found.slug; return true; }
          }
        }
        const found = cats.find((c) => c.slug === data.category || String(c.id) === String(data.category));
        if (found) {
          const idNum = Number(found.id);
          if (Number.isFinite(idNum) && idNum > 0) { categoryId = idNum; categorySlug = found.slug; return true; }
        }
        return false;
      };

      if (resolvedCategory?.id != null) {
        const idNum = Number(resolvedCategory.id);
        if (Number.isFinite(idNum) && idNum > 0 && resolvedCategory.slug) {
          categoryId = idNum;
          categorySlug = resolvedCategory.slug;
        }
      }

      if (categoryId == null || !categorySlug) {
        const categories = await api.categories.list({ strict: true });
        tryResolve(categories);
      }

      if (categoryId == null || !categorySlug) {
        throw new Error('Category list is not synced. Please wait a moment and try again.');
      }

      const base = `${categorySlug}-${String(data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'dish';
      const slug = `${base}-${Date.now().toString(36)}`;

      const imageFile: File | undefined = data.imageFile;
      const imageUrl = !imageFile && data.image ? toAbsoluteImageUrl(data.image) : '';

      const baseFields: Record<string, any> = {
        name: String(data.name || '').trim(),
        slug,
        description: String(data.description || '').trim(),
        price: Number(data.price),
        food_type: data.foodType,
        is_available: data.isAvailable !== false,
        is_active: data.isActive !== false,
        is_special: data.isSpecial || false,
        is_popular: data.isPopular || false,
        tags: JSON.stringify(data.tags || []),
        spiciness: data.spiciness || 'medium',
        preparation_time_mins: Math.max(1, Number(data.preparationTimeMins ?? 15)),
        discount_percentage: Math.min(99, Math.max(0, Number(data.discountPercentage ?? 0))),
        offer_active: !!data.offerActive && Number(data.discountPercentage ?? 0) > 0,
        offer_start_date: data.offerStartDate || '',
        offer_end_date: data.offerEndDate || '',
        category: categoryId,
      };

      const send = async (fd: FormData | Record<string, any>, isMultipart: boolean) => {
        return apiClient.post<any>('/menu/items', fd, {
          timeout: 60000,
          headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
        });
      };

      try {
        let response;
        if (imageFile) {
          const fd = new FormData();
          Object.entries(baseFields).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            fd.append(k, String(v));
          });
          fd.append('image', imageFile);
          if (imageUrl) fd.append('image_url', imageUrl);
          response = await send(fd, true);
        } else {
          const json: Record<string, any> = { ...baseFields, tags: data.tags || [] };
          if (imageUrl) json.image_url = imageUrl;
          if (!json.offer_start_date) json.offer_start_date = null;
          if (!json.offer_end_date) json.offer_end_date = null;
          response = await send(json, false);
        }

        if (response.data?.id) {
          const item = response.data;
          return {
            ...data,
            id: String(item.id),
            name: item.name ?? data.name,
            slug: item.slug || slug,
            category: item.category_slug || categorySlug,
            description: item.description ?? data.description,
            price: Number(item.price ?? data.price),
            image: pickImage(item) || imageUrl || data.image || '',
            foodType: item.food_type ?? data.foodType,
            isAvailable: item.is_available ?? baseFields.is_available,
            isActive: item.is_active ?? baseFields.is_active,
            isDeleted: item.is_deleted ?? false,
            tags: item.tags || data.tags || [],
            spiciness: item.spiciness ?? data.spiciness ?? 'medium',
            preparationTimeMins: item.preparation_time_mins ?? baseFields.preparation_time_mins,
            isSpecial: item.is_special ?? data.isSpecial ?? false,
            isPopular: item.is_popular ?? data.isPopular ?? false,
            discountPercentage: Number(item.discount_percentage ?? baseFields.discount_percentage ?? 0),
            offerActive: item.offer_active ?? baseFields.offer_active,
            offerStartDate: item.offer_start_date ?? (baseFields.offer_start_date || null),
            offerEndDate: item.offer_end_date ?? (baseFields.offer_end_date || null),
            isOfferActive: item.is_offer_active,
          } as MenuItem;
        }
        throw new Error('Failed to create dish.');
      } catch (err: any) {
        const detail = err?.response?.data;
        const fieldMsg = (val: any) => (Array.isArray(val) ? val[0] : typeof val === 'string' ? val : null);
        let msg = fieldMsg(detail?.detail) || fieldMsg(detail?.non_field_errors);
        if (!msg && detail && typeof detail === 'object') {
          for (const [key, val] of Object.entries(detail)) {
            const m = fieldMsg(val);
            if (m) { msg = `${key}: ${m}`; break; }
          }
        }
        msg = msg || err?.message || 'Failed to create dish.';
        throw new Error(msg);
      }
    },

    update: async (id: string, updates: any): Promise<MenuItem | null> => {
      const imageFile: File | undefined = updates.imageFile;
      const base: Record<string, any> = {};
      if (updates.name !== undefined) base.name = updates.name;
      if (updates.price !== undefined) base.price = updates.price;
      if (updates.isAvailable !== undefined) base.is_available = updates.isAvailable;
      if (updates.isActive !== undefined) base.is_active = updates.isActive;
      if (updates.tags !== undefined) base.tags = updates.tags;
      if (updates.description !== undefined) base.description = updates.description;
      if (updates.foodType !== undefined) base.food_type = updates.foodType;
      if (updates.spiciness !== undefined) base.spiciness = updates.spiciness;
      if (updates.preparationTimeMins !== undefined) base.preparation_time_mins = Math.max(1, Number(updates.preparationTimeMins));
      if (updates.isSpecial !== undefined) base.is_special = updates.isSpecial;
      if (updates.isPopular !== undefined) base.is_popular = updates.isPopular;
      if (updates.discountPercentage !== undefined) base.discount_percentage = Math.min(99, Math.max(0, Number(updates.discountPercentage)));
      if (updates.offerActive !== undefined) base.offer_active = !!updates.offerActive;
      if (updates.offerStartDate !== undefined) base.offer_start_date = updates.offerStartDate || null;
      if (updates.offerEndDate !== undefined) base.offer_end_date = updates.offerEndDate || null;

      const resolveCategoryId = async () => {
        if (updates.categoryId != null) {
          const idNum = Number(updates.categoryId);
          if (Number.isFinite(idNum) && idNum > 0) return idNum;
        }
        if (updates.category !== undefined) {
          const categories = await api.categories.list({ strict: true });
          const category = categories.find((c) => c.slug === updates.category || String(c.id) === String(updates.category));
          if (category) {
            const idNum = Number(category.id);
            if (Number.isFinite(idNum) && idNum > 0) return idNum;
          }
          throw new Error('Category list is not synced. Please wait a moment and try again.');
        }
        return undefined;
      };
      const catId = await resolveCategoryId();
      if (catId !== undefined) base.category = catId;

      if (!imageFile && updates.image !== undefined) {
        base.image_url = toAbsoluteImageUrl(updates.image);
      }

      try {
        let response;
        if (imageFile) {
          const fd = new FormData();
          Object.entries(base).forEach(([k, v]) => {
            if (v === undefined) return;
            if (k === 'tags') {
              fd.append('tags', JSON.stringify(Array.isArray(v) ? v : []));
              return;
            }
            if (v === null) fd.append(k, '');
            else fd.append(k, String(v));
          });
          fd.append('image', imageFile);
          response = await apiClient.patch(`/menu/items/${id}`, fd, { timeout: 60000, headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          response = await apiClient.patch(`/menu/items/${id}`, base, { timeout: 60000 });
        }
        const item = response?.data;
        if (item && typeof item === 'object') {
          return {
            id: String(item.id ?? id),
            name: item.name ?? updates.name,
            slug: item.slug,
            category: item.category_slug || String(item.category ?? updates.category ?? ''),
            description: item.description ?? updates.description,
            price: Number(item.price ?? updates.price ?? 0),
            image: pickImage(item) || (updates.image !== undefined ? toAbsoluteImageUrl(updates.image) : undefined),
            foodType: item.food_type ?? updates.foodType,
            isAvailable: item.is_available ?? updates.isAvailable,
            isActive: item.is_active ?? updates.isActive,
            isDeleted: item.is_deleted ?? false,
            popularity: item.popularity ?? 0,
            tags: item.tags || updates.tags || [],
            orderCount: item.order_count || 0,
            isPopular: item.is_popular ?? updates.isPopular,
            isSpecial: item.is_special ?? updates.isSpecial,
            spiciness: item.spiciness ?? updates.spiciness,
            preparationTimeMins: item.preparation_time_mins ?? updates.preparationTimeMins,
            rating: 4.8,
            reviewCount: 150,
            discountPercentage: Number(item.discount_percentage ?? updates.discountPercentage ?? 0),
            offerActive: item.offer_active ?? updates.offerActive ?? false,
            offerStartDate: item.offer_start_date ?? updates.offerStartDate ?? null,
            offerEndDate: item.offer_end_date ?? updates.offerEndDate ?? null,
            isOfferActive: item.is_offer_active,
          } as MenuItem;
        }
        return { id, ...updates } as MenuItem;
      } catch (err: any) {
        throw new Error(getApiErrorMessage(err, 'Failed to update dish.'));
      }
    },

    delete: async (id: string): Promise<boolean> => {
      try {
        await apiClient.delete(`/menu/items/${id}`);
        return true;
      } catch (err: any) {
        throw new Error(getApiErrorMessage(err, 'Failed to delete dish.'));
      }
    },
  },

  tables: {
    list: async (): Promise<RestaurantTable[]> => {
      try {
        const response = await apiClient.get<any[]>('/tables');
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((t) => ({
            id: String(t.id),
            tableNumber: t.table_number,
            displayName: t.display_name,
            capacity: t.capacity,
            section: t.section,
            qrCodeUrl: `?table=${t.table_number}`,
            status: 'available',
          }));
        }
      } catch (err) {
        // Fallback to cache if backend unreachable
      }
      return getTables();
    },

    create: async (data: Omit<RestaurantTable, 'id' | 'qrCodeUrl' | 'status'>): Promise<RestaurantTable> => {
      const payload = {
        table_number: String(data.tableNumber || '').trim().toUpperCase(),
        display_name: data.displayName,
        capacity: data.capacity,
        section: data.section,
      };
      try {
        const response = await apiClient.post<any>('/tables', payload);
        const t = response.data || {};
        return {
          id: String(t.id),
          tableNumber: t.table_number || payload.table_number,
          displayName: t.display_name || payload.display_name,
          capacity: t.capacity ?? payload.capacity,
          section: t.section || payload.section,
          qrCodeUrl: `?table=${t.table_number || payload.table_number}`,
          status: 'available',
        };
      } catch (err: any) {
        const detail = err?.response?.data;
        const fieldMsg = (v: any) => (Array.isArray(v) ? v[0] : typeof v === 'string' ? v : null);
        let msg = fieldMsg(detail?.detail) || fieldMsg(detail?.table_number) || fieldMsg(detail?.non_field_errors);
        if (!msg && detail && typeof detail === 'object') {
          for (const [k, v] of Object.entries(detail)) {
            const m = fieldMsg(v);
            if (m) { msg = `${k}: ${m}`; break; }
          }
        }
        if (!msg && err?.response?.status === 400) msg = 'Failed to create table. Please check the details.';
        msg = msg || err?.message || 'Failed to create table.';
        throw new Error(msg);
      }
    },

    generateQR: async (tableNumber: string): Promise<{ qr_url: string; qr_image_url?: string }> => {
      try {
        const response = await apiClient.get<{ qr_target_url: string; qr_code_image?: string }>(
          `/tables/${encodeURIComponent(tableNumber)}/generate_qr`
        );
        return {
          qr_url: response.data.qr_target_url,
          qr_image_url: response.data.qr_code_image,
        };
      } catch {
        const envUrl =
          typeof process !== 'undefined' ? process.env?.FRONTEND_PUBLIC_URL : undefined;
        const origin =
          typeof window !== 'undefined'
            ? (envUrl || window.location.origin)
            : (envUrl || 'http://localhost:3000');
        return { qr_url: `${origin}/?table=${tableNumber}` };
      }
    },
  },

  orders: {
    list: async (table?: string): Promise<Order[]> => {
      try {
        const response = await apiClient.get<any[]>('/orders', {
          params: table ? { table } : {},
        });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const remoteOrders: Order[] = response.data.map((o) => ({
            id: String(o.id),
            orderNumber: o.order_number,
            tableNumber: o.table_number || (o.table && o.table.table_number) || 'T-01',
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            specialInstructions: o.special_instructions,
            status: o.status,
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            total: Number(o.total),
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            estimatedMinutes: o.estimated_minutes || 20,
            items: (o.items || []).map((it: any) => ({
              id: String(it.id),
              menuItemId: String(it.menu_item),
              name: it.name,
              price: Number(it.price),
              quantity: it.quantity,
              foodType: it.food_type,
              specialNotes: it.special_notes,
            })),
          }));
          saveOrders(remoteOrders);
          return remoteOrders;
        }
      } catch (err) {
        // Staff-only endpoint: no localStorage fallback on 401/403/network.
        // Let the error propagate so the app can reset auth state.
        throw err;
      }
      return [];
    },

    kitchenFeed: async (): Promise<Order[]> => {
      try {
        const response = await apiClient.get<any[]>('/orders/kitchen_feed');
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((o) => ({
            id: String(o.id),
            orderNumber: o.order_number,
            tableNumber: o.table_number || 'T-01',
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            specialInstructions: o.special_instructions,
            status: o.status,
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            total: Number(o.total),
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            estimatedMinutes: o.estimated_minutes || 20,
            items: (o.items || []).map((it: any) => ({
              id: String(it.id),
              menuItemId: String(it.menu_item),
              name: it.name,
              price: Number(it.price),
              quantity: it.quantity,
              foodType: it.food_type,
              specialNotes: it.special_notes,
            })),
          }));
        }
      } catch (err) {
        // Staff-only endpoint: no localStorage fallback on 401/403/network.
        throw err;
      }
      return [];
    },

    create: async (payload: {
      tableNumber: string;
      customerName: string;
      customerPhone?: string;
      specialInstructions?: string;
      cartItems: CartItem[];
    }): Promise<Order> => {
      const orderItemsInput = payload.cartItems.map((ci) => {
        const parsed = parseInt(ci.menuItem.id, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error('One or more menu items are invalid. Please refresh the menu and try again.');
        }
        return {
          menu_item_id: parsed,
          quantity: ci.quantity,
          special_notes: ci.specialNotes || '',
        };
      });

      const apiPayload = {
        table_identifier: payload.tableNumber,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone || '',
        special_instructions: payload.specialInstructions || '',
        order_items_input: orderItemsInput,
      };

      try {
        const response = await apiClient.post<any>('/orders', apiPayload);
        if (response.data && response.data.id) {
          const o = response.data;
          const createdOrder: Order = {
            id: String(o.id),
            orderNumber: o.order_number,
            tableNumber: o.table_number || payload.tableNumber,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            specialInstructions: o.special_instructions,
            status: o.status,
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            total: Number(o.total),
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            estimatedMinutes: o.estimated_minutes || 20,
            items: (o.items || []).map((it: any) => ({
              id: String(it.id),
              menuItemId: String(it.menu_item),
              name: it.name,
              price: Number(it.price),
              quantity: it.quantity,
              foodType: it.food_type,
              specialNotes: it.special_notes,
            })),
          };
          saveOrders([createdOrder, ...getOrders()]);
          addMyOrderNumber(createdOrder.orderNumber);
          return createdOrder;
        }
        throw new Error('Order was not created by the server.');
      } catch (err: any) {
        const backendMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message;
        throw new Error(backendMessage || 'Unable to place order. Please try again.');
      }
    },

    updateStatus: async (orderId: string, status: OrderStatus): Promise<boolean> => {
      try {
        await apiClient.patch(`/orders/${orderId}/update_status`, { status });
        return true;
      } catch (err) {
        // Staff-only endpoint: no localStorage fallback on 401/403/network.
        throw err;
      }
    },

    cancelOrder: async (orderId: string): Promise<boolean> => {
      try {
        await apiClient.patch(`/orders/${orderId}/cancel`);
        return true;
      } catch (err) {
        throw err;
      }
    },

    deleteOrder: async (orderId: string): Promise<boolean> => {
      try {
        await apiClient.delete(`/orders/${orderId}`);
        return true;
      } catch (err) {
        throw err;
      }
    },

    track: async (orderNumber: string): Promise<Order> => {
      const response = await apiClient.get<any>(`/orders/track/${encodeURIComponent(orderNumber)}`);
      const o = response.data;
      return {
        id: String(o.id),
        orderNumber: o.order_number,
        tableNumber: o.table_number || '',
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        specialInstructions: o.special_instructions,
        status: o.status,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        total: Number(o.total),
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        estimatedMinutes: o.estimated_minutes || 20,
        items: (o.items || []).map((it: any) => ({
          id: String(it.id),
          menuItemId: String(it.menu_item),
          name: it.name,
          price: Number(it.price),
          quantity: it.quantity,
          foodType: it.food_type,
          specialNotes: it.special_notes,
        })),
      };
    },

    myOrders: async (numbers: string[], table?: string): Promise<Order[]> => {
      const params: Record<string, string> = {};
      const list = (numbers || []).filter(Boolean);
      if (list.length) params.numbers = list.join(',');
      else if (table) params.table = table;
      if (!params.numbers && !params.table) return [];
      const response = await apiClient.get<any[]>('/orders/my-orders', { params });
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((o) => ({
          id: String(o.id),
          orderNumber: o.order_number,
          tableNumber: o.table_number || (o.table && o.table.table_number) || '',
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          specialInstructions: o.special_instructions,
          status: o.status,
          subtotal: Number(o.subtotal),
          tax: Number(o.tax),
          total: Number(o.total),
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          estimatedMinutes: o.estimated_minutes || 20,
          items: (o.items || []).map((it: any) => ({
            id: String(it.id),
            menuItemId: String(it.menu_item),
            name: it.name,
            price: Number(it.price),
            quantity: it.quantity,
            foodType: it.food_type,
            specialNotes: it.special_notes,
          })),
        }));
      }
      return [];
    },
  },
};
