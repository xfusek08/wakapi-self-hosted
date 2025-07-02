import { isEmpty } from 'bunner/framework';

export default function extractTagFromString(str: string): {
    identifier: string | null;
    name: string;
} {
    const match = str.match(/\[([^\]]+)\]/);
    let res = match?.[1];
    res = res?.trim();
    if (isEmpty(res)) {
        return {
            identifier: null,
            name: str,
        };
    }
    return {
        identifier: res,
        name: str.replace(/\[([^\]]+)\]/, '').trim(),
    };
}
