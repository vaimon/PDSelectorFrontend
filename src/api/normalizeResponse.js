export const normalizeCollectionResponse = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
};

export const normalizePageResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    };
  }

  const items = Array.isArray(data?.content) ? data.content : [];
  return {
    items,
    page: Number.isInteger(data?.page) ? data.page : 0,
    size: Number.isInteger(data?.size) ? data.size : items.length,
    totalElements: Number.isFinite(data?.totalElements) ? data.totalElements : items.length,
    totalPages: Number.isInteger(data?.totalPages) ? data.totalPages : (items.length > 0 ? 1 : 0),
  };
};
