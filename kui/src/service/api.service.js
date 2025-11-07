/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { ENDPOINTS } from "@/config";

/**
 * Generate a formatted API error message.
 *
 * @param {string} endpoint - The API endpoint that failed.
 * @param {number} status - HTTP status code from the response.
 * @returns {string} A formatted error message.
 */
const _apiErrorMessage = (endpoint, status) => {
  return `fetch error! endpoint: ${endpoint}, status: ${status}`;
};

/**
 * Perform a simple GET request and return JSON data.
 *
 * @param {string} endpoint - Full API endpoint URL.
 * @returns {Promise<Object>} The parsed JSON response.
 * @throws {Error} If the request fails or response status is not OK.
 */
const _fetchDataGet = async (endpoint) => {
  const response = await fetch(`${endpoint}`);

  // ❌ Throw an error if the server responded with a non-200 status
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }

  // ✅ Parse and return JSON data
  return response.json();
};

/**
 * Fetch all documents from a specific collection.
 *
 * @param {string} endpoint - Base API endpoint (e.g., `/api/collections`).
 * @param {string} collection - Collection name to fetch documents from.
 * @returns {Promise<Object>} The JSON response containing documents.
 * @throws {Error} If the request fails or collection does not exist.
 */
const _fetchDataGetCollection = async (endpoint, collection) => {
  const response = await fetch(
    `${endpoint}/${encodeURIComponent(collection)}/documents`
  );

  // ❌ Throw an error if response indicates failure
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }

  // ✅ Return parsed JSON list of documents
  return response.json();
};

/**
 * Download a document file from a given collection and UUID.
 * Supports both binary file (FileResponse) and JSON error response.
 *
 * @param {string} endpoint - Base API endpoint
 * @param {string} collection - Collection name
 * @param {string} uuid - Document UUID
 * @returns {Promise<{ filename: string }>} The downloaded filename
 */
const _fetchDataGetCollectionUuid = async (endpoint, collection, uuid) => {
  const url = `${endpoint}/${encodeURIComponent(
    collection
  )}/documents/${uuid}/download`;

  const response = await fetch(url);

  // ⚠️ Handle error responses (e.g., 404 or 500)
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    } catch {
      throw new Error(_apiErrorMessage(endpoint, response.status));
    }
  }

  // ✅ File stream (successful case)
  const blob = await response.blob();

  // Try to extract the filename from Content-Disposition header
  const disposition = response.headers.get("Content-Disposition");

  let filename = "downloaded_file";

  if (disposition) {
    const filenameStarMatch = disposition.match(/filename\*=UTF-8''(.+)$/i);
    if (filenameStarMatch && filenameStarMatch[1]) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else {
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
  }

  // Create a temporary URL and trigger browser download
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);

  return { filename };
};

/**
 * Send a POST request with JSON data to a specific API endpoint.
 *
 * @param {string} endpoint - Base API endpoint (e.g., `/api/collections`).
 * @param {string} collection - Collection name to include in the URL path.
 * @param {Object} queryData - Request body payload to be sent as JSON.
 * @param {string} extraEndpoint - Additional path segment appended to the URL.
 * @returns {Promise<Object>} The parsed JSON response from the server.
 * @throws {Error} If the request fails or response status is not OK.
 */
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
      // ✅ Convert request data to JSON string
      body: JSON.stringify(queryData),
    }
  );

  // ❌ Throw an error if the server response indicates failure
  if (!response.ok) {
    throw new Error(_apiErrorMessage(endpoint, response.status));
  }

  // ✅ Parse and return JSON response
  return response.json();
};

export const apiService = {
  getCollections: () => _fetchDataGet(ENDPOINTS.COLLECTIONS),
  getDocuments: (collection) =>
    _fetchDataGetCollection(ENDPOINTS.COLLECTIONS, collection),
  getDocumentsDownload: (collection, uuid) => {
    _fetchDataGetCollectionUuid(ENDPOINTS.COLLECTIONS, collection, uuid);
  },
  postSelectDocuments: (collection, queryData) =>
    _fetchDataPost(ENDPOINTS.COLLECTIONS, collection, queryData, "select"),
  postInquireDocuments: (collection, queryData) =>
    _fetchDataPost(ENDPOINTS.COLLECTIONS, collection, queryData, "inquire"),
};
