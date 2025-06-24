import { type } from 'arktype';

const SqliteDateString = type('string').pipe((str) => {
    const isoStr = str.replace(' ', 'T');
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date string: ${str}`);
    }
    return d;
});

export default SqliteDateString;
