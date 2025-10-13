import { ENDPOINTS } from "@/config";

const _apiErrorMessage = (endpoint, status) => {
  return `fetch error! endpoint: ${endpoint}, status: ${status}`;
};

const _fetchDataGet = async (endpoint) => {
  const response = await fetch(`${endpoint}`);
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }
  return response.json();
};

const _fetchDataGetQueryString = async (endpoint, queryString) => {
  const response = await fetch(
    `${endpoint}/${encodeURIComponent(queryString)}`
  );
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }
  return response.json();
};

const _fetchDataPost = async (endpoint, queryString, queryData) => {
  const response = await fetch(
    `${endpoint}/${encodeURIComponent(queryString)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryData),
    }
  );
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }
  return response.json();
};

export const apiService = {
  getCollections: () => _fetchDataGet(ENDPOINTS.GET_COLLECTIONS),
  getCollection: (collection) =>
    _fetchDataGetQueryString(ENDPOINTS.GET_DOCUMENTS_COLLECTION, collection),
  postCollection: (collection) =>
    _fetchDataPost(ENDPOINTS.POST_SELECT_COLLECTION, collection, queryData),
  postInquireCollections: (collection) =>
    _fetchDataPost(ENDPOINTS.POST_INQUIRE_COLLECTION, collection, queryData),
};
