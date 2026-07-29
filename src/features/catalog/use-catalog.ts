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

interface CatalogSnapshot {
  storeId: string | null;
  categories: Category[];
  products: Product[];
  categoriesLoaded: boolean;
  productsLoaded: boolean;
  categoriesError: string | null;
  productsError: string | null;
}

const initialSnapshot: CatalogSnapshot = {
  storeId: null,
  categories: [],
  products: [],
  categoriesLoaded: false,
  productsLoaded: false,
  categoriesError: null,
  productsError: null,
};

export function useCatalog(storeId: string | undefined): CatalogState {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot>(initialSnapshot);

  useEffect(() => {
    if (!storeId) return;

    const unsubscribeCategories = subscribeCategories(
      storeId,
      (items) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          categories: items,
          categoriesLoaded: true,
          categoriesError: null,
        }));
      },
      (cause) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          categoriesLoaded: true,
          categoriesError: getErrorMessage(cause),
        }));
      },
    );

    const unsubscribeProducts = subscribeProducts(
      storeId,
      (items) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          products: items,
          productsLoaded: true,
          productsError: null,
        }));
      },
      (cause) => {
        setSnapshot((current) => ({
          ...(current.storeId === storeId ? current : initialSnapshot),
          storeId,
          productsLoaded: true,
          productsError: getErrorMessage(cause),
        }));
      },
    );

    return () => {
      unsubscribeCategories();
      unsubscribeProducts();
    };
  }, [storeId]);

  if (!storeId || snapshot.storeId !== storeId) {
    return {
      categories: [],
      products: [],
      loading: Boolean(storeId),
      error: null,
    };
  }

  return {
    categories: snapshot.categories,
    products: snapshot.products,
    loading: !snapshot.categoriesLoaded || !snapshot.productsLoaded,
    error: snapshot.categoriesError ?? snapshot.productsError,
  };
}
