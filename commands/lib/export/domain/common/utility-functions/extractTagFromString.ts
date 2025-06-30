import { isEmpty } from 'bunner/framework';

export default function extractTagFromString(str: string): string | null {
    const match = str.match(/\[([^\]]+)\]/);
    let res = match?.[1];
    res = res?.trim();
    if (isEmpty(res)) {
        return null;
    }
    return res;
}
