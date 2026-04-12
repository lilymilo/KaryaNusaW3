/**
 * Shared formatting utilities for KaryaNusa
 * Eliminates duplication of formatPrice/formatDate across 5+ components.
 */

const priceFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const formatPrice = (p) => priceFormatter.format(p);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
