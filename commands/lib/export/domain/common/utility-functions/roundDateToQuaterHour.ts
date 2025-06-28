export default function roundDateToQuarterHour(date: Date) {
    const timeToReturn = new Date(date.getTime());

    // Round milliseconds to nearest 1000 (1 second)
    timeToReturn.setMilliseconds(
        Math.round(timeToReturn.getMilliseconds() / 1000) * 1000,
    );

    // Round seconds to nearest 60 (1 minute)
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);

    // Round minutes to nearest 15 (quarter hour)
    timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);

    return timeToReturn;
}
