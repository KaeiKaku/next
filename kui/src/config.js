export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
  GET_COLLECTIONS: `${API_BASE_URL}/collections`,
  GET_DOCUMENTS_COLLECTION: `${API_BASE_URL}/documents/`,
  POST_SELECT_COLLECTION: `${API_BASE_URL}/select/`,
  POST_INQUIRE_COLLECTION: `${API_BASE_URL}/inquire/`,
};
