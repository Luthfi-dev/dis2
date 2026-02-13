import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * A simple deep merge function.
 * It's not as robust as lodash.merge, but it's enough for our use case and has no dependencies.
 */
export function mergeDeep(target: any, source: any): any {
  const isObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj);

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  const output = { ...target };

  for (const key in source) {
    if (isObject(source[key])) {
      if (!(key in output)) {
        Object.assign(output, { [key]: source[key] });
      } else {
        output[key] = mergeDeep(output[key], source[key]);
      }
    } else {
      Object.assign(output, { [key]: source[key] });
    }
  }

  return output;
}

/**
 * Recursively sanitizes and formats data for database insertion.
 * - Converts empty strings to null.
 * - Stringifies objects/arrays.
 * @param data The object or value to process.
 * @returns The processed object or value.
 */
export function sanitizeAndFormatData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }

  const sanitizedData: { [key: string]: any } = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      let value = data[key];

      if (value instanceof Date) {
        // This case should ideally not be hit if we manage dates as strings
        // but as a fallback, format it.
         sanitizedData[key] = value.toISOString().slice(0, 10);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitizedData[key] = JSON.stringify(value);
      } else if (Array.isArray(value)) {
        sanitizedData[key] = JSON.stringify(value);
      } else if (typeof value === 'string') {
        sanitizedData[key] = value.trim() === '' ? null : value;
      } else if (value === undefined) {
        sanitizedData[key] = null;
      } else {
        sanitizedData[key] = value;
      }
    }
  }

  return sanitizedData;
}
