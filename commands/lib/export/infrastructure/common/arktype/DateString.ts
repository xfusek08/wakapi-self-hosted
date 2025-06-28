import { type } from 'arktype';

const DateString = type('string').pipe((str) => {
    const d = new Date(str);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date string: ${str}`);
    }
    return d;
});

export default DateString;
