import enJson from "../locales/en.json";

export function useTranslations(namespace?: string) {
  return (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const parts = fullKey.split(".");
    
    let current: any = enJson;
    for (const part of parts) {
      if (current[part] === undefined) {
        return fullKey;
      }
      current = current[part];
    }
    
    if (typeof current !== "string") {
      return fullKey;
    }
    
    let result = current;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        result = result.replace(`{${k}}`, String(v));
      }
    }
    return result;
  };
}
