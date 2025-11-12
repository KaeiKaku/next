/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

/**
 * パスを / もしくは \ で分割して配列にする
 *
 * @param {string} filePath - ファイルパス文字列
 * @returns {string[]} 分割されたパスの配列
 */
export function splitFilePath(filePath = "") {
  const filePathArray = filePath
    .toString()
    .trim()
    .split(/[/\\]+/)
    .filter(Boolean);
  return filePathArray;
}

/**
 * パス文字列からファイル名を取得します。
 *
 * @param {string} filePath - ファイルパス
 * @returns {string} ファイル名（取得できない場合は空文字）
 */
export function getFileNameFromFilePath(filePath = "") {
  if (filePath == null) {
    return "";
  }
  const p = String(filePath).trim();
  if (!p) {
    return "";
  }
  return p.split(/[/\\]/).pop() ?? "";
};
