export default function formatDate(date: Date) {
    const formatter = new Intl.DateTimeFormat(undefined, {
        timeZone: 'Europe/Berlin', // This will use CEST during summer and CET during winter
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);

    type DateParts = {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
        second: string;
        [key: string]: string;
    };

    const valueMap: DateParts = {
        year: '',
        month: '',
        day: '',
        hour: '',
        minute: '',
        second: '',
    };

    parts.forEach((part) => {
        valueMap[part.type] = part.value;
    });

    return `${valueMap.year}-${valueMap.month}-${valueMap.day} ${valueMap.hour}:${valueMap.minute}:${valueMap.second}`;
}
