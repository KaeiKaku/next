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

const _fetchDataGetQueryString = async (endpoint, collection) => {
  const response = await fetch(
    `${endpoint}/${encodeURIComponent(collection)}/documents`
  );
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }
  return response.json();
};

const _fetchDataPost = async (
  endpoint,
  collection,
  queryData,
  extraEndpoint
) => {
  const response = await fetch(
    `${endpoint}/${encodeURIComponent(collection)}/${extraEndpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryData),
    }
  );
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint2, response.status));
  }
  return response.json();
};

export const apiService = {
  getCollections: () => _fetchDataGet(ENDPOINTS.COLLECTIONS),
  getDocuments: (collection) =>
    _fetchDataGetQueryString(ENDPOINTS.COLLECTIONS, collection),
  postSelectDocuments: (collection, queryData) =>
    _fetchDataPost(ENDPOINTS.COLLECTIONS, collection, queryData, "select"),
  postInquireDocuments: (collection, queryData) =>
    _fetchDataPost(ENDPOINTS.COLLECTIONS, collection, queryData, "inquire"),
};
