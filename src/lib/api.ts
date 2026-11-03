import apiClient from './axios';
import {
  getCategories,
  getMenuItems,
  getTables,
  getOrders,
  createOrder as createLocalOrder,
  addMenuItem as addLocalMenuItem,
  updateMenuItem as updateLocalMenuItem,
  deleteMenuItem as deleteLocalMenuItem,
  addRestaurantTable as addLocalRestaurantTable,
  saveOrders,
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

export const api = {
  categories: {
    list: async (): Promise<Category[]> => {
      try {
        const response = await apiClient.get<any[]>('/menu/categories');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data.map((c) => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug,
            icon: c.icon || 'UtensilsCrossed',
            itemCount: c.items_count,
          }));
        }
      } catch (err) {
        // Fallback to cache buffer if Django backend is offline
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
    list: async (params?: { category?: string; food_type?: string; search?: string; include_inactive?: boolean }): Promise<MenuItem[]> => {
      try {
        const response = await apiClient.get<any[]>('/menu/items', { params });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data.map((item) => ({
            id: String(item.id),
            name: item.name,
            slug: item.slug,
            category: item.category_slug || item.category,
            description: item.description,
            price: Number(item.price),
            image: item.image_url || item.image || '/src/assets/images/bhojan_dum_biryani_1792839056384.jpg',
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
          }));
        }
      } catch (err) {
        // Fallback to cache buffer
      }
      return getMenuItems();
    },

    create: async (data: Omit<MenuItem, 'id' | 'slug'>): Promise<MenuItem> => {
      try {
        const payload = {
          name: data.name,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: data.description,
          price: data.price,
          food_type: data.foodType,
          is_available: data.isAvailable,
          is_active: data.isActive !== false,
          is_special: data.isSpecial || false,
          tags: data.tags || [],
          image_url: data.image,
          preparation_time_mins: data.preparationTimeMins || 15,
          category: 1, // default foreign key ID
        };
        const response = await apiClient.post<any>('/menu/items', payload);
        if (response.data?.id) {
          return {
            ...data,
            id: String(response.data.id),
            slug: response.data.slug,
          };
        }
      } catch (err) {
        // Fallback to local store
      }
      return addLocalMenuItem(data);
    },

    update: async (id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> => {
      try {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.description !== undefined) payload.description = updates.description;
        await apiClient.patch(`/menu/items/${id}`, payload);
      } catch (err) {
        // Fallback
      }
      return updateLocalMenuItem(id, updates);
    },

    delete: async (id: string): Promise<boolean> => {
      try {
        await apiClient.delete(`/menu/items/${id}`);
      } catch (err) {
        // Fallback
      }
      return deleteLocalMenuItem(id);
    },
  },

  tables: {
    list: async (): Promise<RestaurantTable[]> => {
      try {
        const response = await apiClient.get<any[]>('/tables');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
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
        // Fallback
      }
      return getTables();
    },

    create: async (data: Omit<RestaurantTable, 'id' | 'qrCodeUrl' | 'status'>): Promise<RestaurantTable> => {
      try {
        const payload = {
          table_number: data.tableNumber,
          display_name: data.displayName,
          capacity: data.capacity,
          section: data.section,
        };
        const response = await apiClient.post<any>('/tables', payload);
        if (response.data?.id) {
          return {
            ...data,
            id: String(response.data.id),
            qrCodeUrl: `?table=${response.data.table_number}`,
            status: 'available',
          };
        }
      } catch (err) {
        // Fallback
      }
      return addLocalRestaurantTable(data);
    },

    generateQR: async (tableNumber: string): Promise<{ qr_url: string; qr_image_url?: string }> => {
      try {
        const response = await apiClient.get<{ qr_target_url: string; qr_code_image?: string }>(
          `/tables/${tableNumber}/generate_qr`
        );
        return {
          qr_url: response.data.qr_target_url,
          qr_image_url: response.data.qr_code_image,
        };
      } catch {
        const origin =
          typeof window !== 'undefined'
            ? (process.env.FRONTEND_PUBLIC_URL || window.location.origin)
            : (process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000');
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
      try {
        const apiPayload = {
          table_identifier: payload.tableNumber,
          customer_name: payload.customerName,
          customer_phone: payload.customerPhone || '',
          special_instructions: payload.specialInstructions || '',
          order_items_input: payload.cartItems.map((ci) => {
            // IDs from Django are numeric strings like "1", "2".
            // IDs from localStorage fallback are like "dish-1730000000000".
            // Parse to integer: if the string is a valid positive integer use it
            // directly, otherwise strip non-digits (last resort fallback).
            const parsed = parseInt(ci.menuItem.id, 10);
            const menuItemId = Number.isFinite(parsed) && parsed > 0
              ? parsed
              : parseInt(ci.menuItem.id.replace(/\D/g, ''), 10) || 1;
            return {
              menu_item_id: menuItemId,
              quantity: ci.quantity,
              special_notes: ci.specialNotes || '',
            };
          }),
        };

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
          return createdOrder;
        }
      } catch (err) {
        // Fallback
      }
      return createLocalOrder(payload);
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
  },
};
