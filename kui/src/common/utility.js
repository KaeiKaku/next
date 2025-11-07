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
