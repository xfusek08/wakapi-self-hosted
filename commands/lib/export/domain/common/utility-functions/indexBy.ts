// Function overload for flat=false (original behavior)
export default function indexBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K,
    flat?: false,
): Record<K, T[]>;

// Function overload for flat=true (new behavior)
export default function indexBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K,
    flat: true,
): Record<K, T>;

// Implementation
export default function indexBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K,
    flat = false,
): Record<K, T[]> | Record<K, T> {
    if (!flat) {
        // Original behavior
        return array.reduce(
            (acc, item) => {
                const key = keyFn(item);
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(item);
                return acc;
            },
            {} as Record<K, T[]>,
        );
    } else {
        // Flat map behavior
        return array.reduce(
            (acc, item) => {
                const key = keyFn(item);
                if (key in acc) {
                    throw new Error(
                        `Duplicate key "${String(key)}" found when creating flat index`,
                    );
                }
                acc[key] = item;
                return acc;
            },
            {} as Record<K, T>,
        );
    }
}
