import { api } from './api';
import type { MetadataItem } from '../types';

export const metadataService = {
  getByCategory: (category: string) =>
    api.get<MetadataItem[]>(`/metadata?category=${encodeURIComponent(category)}`),
};
