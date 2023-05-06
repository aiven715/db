import { AnyRecord } from "./types";

export function diffObjects(obj1: AnyRecord, obj2: AnyRecord): AnyRecord {
  const diff: AnyRecord = {};
  for (const key in obj1) {
    if (obj1.hasOwnProperty(key) && !obj2.hasOwnProperty(key)) {
      diff[key] = obj1[key];
    } else if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
      const nestedDiff = diffObjects(obj1[key], obj2[key]);
      if (Object.keys(nestedDiff).length > 0) {
        diff[key] = nestedDiff;
      }
    } else if (obj1[key] !== obj2[key]) {
      diff[key] = obj2[key];
    }
  }
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
      diff[key] = obj2[key];
    }
  }
  return diff;
}

export function mergeObjects(obj1: AnyRecord, obj2: AnyRecord): AnyRecord {
  const merged: AnyRecord = { ...obj1 };
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (typeof obj2[key] === "object" && obj2[key] !== null) {
        if (typeof obj1[key] === "object" && obj1[key] !== null) {
          merged[key] = mergeObjects(obj1[key], obj2[key]);
        } else {
          merged[key] = { ...obj2[key] };
        }
      } else {
        merged[key] = obj2[key];
      }
    }
  }
  return merged;
}
