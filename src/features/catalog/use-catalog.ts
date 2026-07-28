'use client';

import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/errors';
import type { Category, Product } from '@/types/models';
import { subscribeCategories, subscribeProducts } from './catalog-service';

interface CatalogState {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
}

export function useCatalog(storeId: string | undefined): CatalogState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;

    setCategoriesLoaded(false);
    setProductsLoaded(false);
    setError(null);

    const handleError = (cause: Error) => {
      setError(getErrorMessage(cause));
      setCategoriesLoaded(true);
      setProductsLoaded(true);
    };
    const unsubscribeCategories = subscribeCategories(storeId, (items) => {
      setCategories(items);
      setCategoriesLoaded(true);
    }, handleError);
    const unsubscribeProducts = subscribeProducts(storeId, (items) => {
      setProducts(items);
      setProductsLoaded(true);
    }, handleError);

    return () => {
      unsubscribeCategories();
      unsubscribeProducts();
    };
  }, [storeId]);

  return {
    categories,
    products,
    loading: !categoriesLoaded || !productsLoaded,
    error,
  };
}
