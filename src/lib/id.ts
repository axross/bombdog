/**
 * Generate a stable unique id for a domain entity (move, player seat).
 *
 * @remarks
 * Prefers `crypto.randomUUID`; when it is unavailable (older runtimes or
 * non-secure contexts) it falls back to a timestamp-plus-random string.
 */
export function createId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `id_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}
