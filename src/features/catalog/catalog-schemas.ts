import { MAX_PRODUCT_PRICE, MAX_STOCK_QUANTITY } from '@/lib/constraints';

import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(80),
  isActive: z.boolean(),
});

export const productInputSchema = z.object({
  categoryId: z.string().trim().min(1, 'Kategori wajib dipilih.'),
  name: z.string().trim().min(1, 'Nama produk wajib diisi.').max(120),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._-]{0,49}$/, 'SKU hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.'),
  price: z.number().int().min(0, 'Harga tidak boleh negatif.').max(MAX_PRODUCT_PRICE, 'Harga melebihi batas sistem.'),
  stockQty: z.number().int().min(0, 'Stok tidak boleh negatif.').max(MAX_STOCK_QUANTITY, 'Stok melebihi batas sistem.'),
  trackStock: z.boolean(),
  isActive: z.boolean(),
  imageUrl: z.string().trim().url('URL gambar tidak valid.').refine((value) => value.startsWith('https://'), 'URL gambar wajib memakai HTTPS.').or(z.literal('')),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
