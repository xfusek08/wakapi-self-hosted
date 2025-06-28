export default function indexBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K,
): Record<K, T[]> {
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
}
