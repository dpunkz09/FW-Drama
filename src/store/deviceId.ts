const KEY = 'fw_device_id';

/**
 * Returns the persistent device ID for this browser.
 * Generated once using crypto.randomUUID() and stored in localStorage.
 * No login required — the ID identifies the device anonymously.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
