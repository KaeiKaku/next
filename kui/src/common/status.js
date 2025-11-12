/**
 * EY CONFIDENTIAL
 * Copyright (c) Ernst & Young ShinNihon LLC, All Rights Reserved.
 * Unauthorized copying of this file via any medium is strictly prohibited.
 */

import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";
import { load as yamlLoad } from "js-yaml";
import statusConfigYaml from "@/common/status.config.yaml?raw";

const init_status = yamlLoad(statusConfigYaml);
if (!init_status || !_isPlainObject(init_status)) {
  throw new Error("Invalid initial status");
}

const NOTGIVEN = Symbol("NOTGIVEN");
const _status$ = new BehaviorSubject(init_status);

/**
 * Recursively retrieves or updates a nested property inside a status object
 * using a dot-delimited path (e.g. "user.profile.name").
 *
 * @param {Object} status - The target object to read or update.
 * @param {string} path - Dot-separated path string to access a property (e.g. "a.b.c").
 * @param {*} [updatedStatus=NOTGIVEN] - The new value to set.
 *   - If NOTGIVEN → returns the current value at the path.
 *   - If null or undefined → deletes the property.
 *   - If a plain object → performs a deep merge.
 *   - Otherwise → directly replaces the existing value.
 *
 * @returns {*} - If `updatedStatus` is NOTGIVEN, returns the current value.
 *                Otherwise, returns the updated status object.
 */
function _getPatchValueBypath(status, path, updatedStatus = NOTGIVEN) {
  if (!_isString(path)) throw new Error("invalid path string.");
  if (!status || typeof status !== "object") throw new Error("status undefined");

  const pathSegments = path.split(".");
  const key = pathSegments.shift();

  if (!key) {
    throw new Error("invalid path string.")
  }

  // safe hasOwnProperty check
  const hasKey = Object.prototype.hasOwnProperty.call(status, key);

  // If reading and key missing -> error
  if (updatedStatus === NOTGIVEN && !hasKey) {
    throw new Error("missing status property");
  }

  // If need to traverse deeper
  if (pathSegments.length > 0) {
    if (!hasKey || status[key] === null || typeof status[key] !== "object") {
      // If updating, create intermediate plain object to continue traversal
      if (updatedStatus !== NOTGIVEN) {
        status[key] = {};
      } else {
        throw new Error("missing status property");
      }
    }
    return _getPatchValueBypath(status[key], pathSegments.join("."), updatedStatus);
  }

  // Leaf handling
  if (updatedStatus === NOTGIVEN) {
    return status[key];
  }

  if (updatedStatus === null || updatedStatus === undefined) {
    delete status[key];
  } else if (_isPlainObject(status[key]) && _isPlainObject(updatedStatus)) {
    _deepMerge(status[key], updatedStatus);
  } else {
    status[key] = updatedStatus;
  }

  return status;
}

/**
 * Deeply merges the properties of `source` into `target`.
 * - Only plain objects `{}` are merged recursively.
 * - Arrays and primitive values are replaced, not merged.
 *
 * @param {Object} target - The target object to be updated (mutated in place).
 * @param {Object} source - The source object whose properties will be merged into target.
 * @returns {Object} - The merged target object.
 *
 * @example
 * const a = { user: { name: "Alice", info: { city: "Tokyo" } } };
 * const b = { user: { info: { city: "Osaka", age: 25 } } };
 * _deepMerge(a, b);
 * // => { user: { name: "Alice", info: { city: "Osaka", age: 25 } } }
 */
function _deepMerge(target, source) {
  // 両方ともプレーンオブジェクトでなければ source を返して置換
  if (!_isPlainObject(target) || !_isPlainObject(source)) {
    return source;
  }

  // source の列挙可能な自前プロパティのみを処理
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (_isPlainObject(srcVal)) {
      // ターゲット側がプレーンオブジェクトでなければ新しく作る（配列や他は置換される）
      if (!_isPlainObject(tgtVal)) {
        target[key] = {};
      }
      // 再帰マージ
      _deepMerge(target[key], srcVal);
    } else {
      // 配列やプリミティブ、null 等は完全に置換
      target[key] = srcVal;
    }
  }

  return target;
}

/**
 * Checks whether the given value is a string (primitive or String object).
 *
 * @param {*} str - The value to check.
 * @returns {boolean} - True if the value is a string, otherwise false.
 *
 * @example
 * _isString("hello"); // true
 * _isString(new String("hi")); // true
 * _isString(123); // false
 */
function _isString(str) {
  return Object.prototype.toString.call(str) === "[object String]";
}

/**
 * Checks whether the given value is a plain JavaScript object
 * (i.e. created using `{}` or `new Object()`).
 *
 * @param {*} obj - The value to check.
 * @returns {boolean} - True if the value is a plain object, otherwise false.
 *
 * @example
 * _isPlainObject({}); // true
 * _isPlainObject([]); // false
 * _isPlainObject(null); // false
 * _isPlainObject(new Date()); // false
 */
function _isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

export const statusService = {
  /**
   * Synchronously get a snapshot of the current status.
   * - If `path` is empty, returns a deep copy of the full status.
   * - If `path` is provided, returns the value at that path (also a deep copy).
   *
   * @param {string} [path=""] - Dot-separated path string (e.g. "user.name").
   * @returns {any} - Deep copy of the full status or the value at the given path.
   *
   * @throws {Error} - Throws if `path` is not a string or path does not exist.
   *
   * @example
   * const fullStatus = statusService.getSnapshot();
   * const userName = statusService.getSnapshot("user.name");
   */
  getSnapshot(path = "") {
    if (!_isString(path)) throw new Error("invalid path string.");

    const current_full_status = JSON.parse(JSON.stringify(_status$.getValue()));
    if (path === "") {
      return current_full_status;
    }
    return _getPatchValueBypath({ ...current_full_status }, path);
  },

  /**
   * Returns an RxJS Observable that emits updates of the status.
   * - If `path` is empty, emits deep copies of the full status object.
   * - If `path` is provided, emits deep copies of the value at that path.
   *
   * @param {string} [path=""] - Dot-separated path string to subscribe to.
   * @returns {import('rxjs').Observable<any>} - Observable emitting deep copies of status or sub-value.
   *
   * @throws {Error} - Throws if `path` is not a string.
   *
   * @example
   * statusService.getStatus$().subscribe(fullStatus => console.log(fullStatus));
   * statusService.getStatus$("user.name").subscribe(name => console.log(name));
   */
  getStatus$(path = "") {
    if (!_isString(path)) throw new Error("invalid path string.");

    const source$ = _status$.asObservable();

    if (path === "") {
      return source$.pipe(map((state) => JSON.parse(JSON.stringify(state))));
    }

    return source$.pipe(
      map((status) => _getPatchValueBypath(status, path)),
      distinctUntilChanged((prev, curr) => {
        if (Array.isArray(prev) && Array.isArray(curr)) {
          return JSON.stringify(prev) === JSON.stringify(curr);
        }
        if (_isPlainObject(prev) && _isPlainObject(curr)) {
          return JSON.stringify(prev) === JSON.stringify(curr);
        }
        return prev === curr;
      }),
      map((val) => {
        return JSON.parse(JSON.stringify(val));
      })
    );
  },

  /**
   * Update the status at the specified path with `patch_value`.
   * - Performs deep merge for objects, direct replacement for other types.
   * - If `patch_value` is null/undefined, deletes the property.
   *
   * @param {string} path - Dot-separated path string where the value will be updated.
   * @param {any} patch_value - The value to set at the specified path.
   *
   * @example
   * statusService.patchStatus("user.name", "Bob");
   * statusService.patchStatus("settings.theme", { darkMode: true });
   */
  patchStatus(path = "", patch_value) {
    const updated_status = JSON.parse(JSON.stringify(_status$.getValue()));
    _getPatchValueBypath(updated_status, path, patch_value);
    if (
      JSON.stringify(updated_status) !== JSON.stringify(_status$.getValue())
    ) {
      _status$.next(updated_status);
    }
  },
};
