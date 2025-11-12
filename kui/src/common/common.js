/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

// タグビューでのキーの区切り文字
export const TAG_KEY_DELIMITER = "::";

/**
 * タグとUUIDからタグキーを構築する
 * @param {string} tag - タグ文字列
 * @param {string} uuid - UUID文字列
 * @returns {string} TAG_KEY_DELIMITERで区切られたタグキー
 *
 * @example
 * // カテゴリービューでのキー key: <uuid>
 * // タグビューでのキー key: <tag><TAG_KEY_DELIMITER><uuid>
 * const tag = "tag1";
 * const uuid = "tag1::123e4567-e89b-12d3-a456-426614174000";
 * const tagKey = buildTagKey(tag, uuid);
 * // returns "tag1::123e4567-e89b-12d3-a456-426614174000"

 */
export function buildTagKey(tag, uuid) {
  return `${tag}${TAG_KEY_DELIMITER}${uuid}`;
}

/**
 * タグキーからUUIDを抽出する
 *
 * @param {string} key - TAG_KEY_DELIMITERで区切られたタグキー
 * @returns {string} 抽出されたUUID
 * @throws {Error} 無効なタグキー形式の場合
 *
 * @example
 * // カテゴリービューでのキー key: <uuid>
 * // タグビューでのキー key: <tag><TAG_KEY_DELIMITER><uuid>
 * const uuid = getUuidForTagKey("tag1::123e4567-e89b-12d3-a456-426614174000");
 * // returns "123e4567-e89b-12d3-a456-426614174000"
 */
export function extractUuidFromKey(key) {
  const keyParts = key.split(TAG_KEY_DELIMITER);
  if (keyParts.length == 1) {
    return keyParts[0];
  } else if (keyParts.length === 2) {
    return keyParts[1];
  } else {
    throw new Error(`Invalid tag key format: ${key}`);
  }
};
