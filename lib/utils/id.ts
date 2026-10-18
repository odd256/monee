export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "monee.deviceId";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = newId();
    window.localStorage.setItem(key, value);
  }
  return value;
}
