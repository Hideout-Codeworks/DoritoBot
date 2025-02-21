const TIME_UNITS: Record<string, number> = {
    s: 1000,sec: 1000,second: 1000,seconds: 1000,
    m: 60 * 1000, min: 60 * 1000, minutes: 60 * 1000,
    h: 60 * 60 * 1000, hr: 60 * 60 * 1000, hour: 60 * 60 * 1000, hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000, day: 24 * 60 * 60 * 1000, days: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000, week: 7 * 24 * 60 * 60 * 1000, weeks: 7 * 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000, month: 30 * 24 * 60 * 60 * 1000, months: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000, year: 365 * 24 * 60 * 60 * 1000, years: 365 * 24 * 60 * 60 * 1000
};

const TIME_ORDER: { unit: string; ms: number }[] = [
    { unit: " years", ms: TIME_UNITS.y },
    { unit: " months", ms: TIME_UNITS.M },
    { unit: " weeks", ms: TIME_UNITS.w },
    { unit: " days", ms: TIME_UNITS.d },
    { unit: " hours", ms: TIME_UNITS.h },
    { unit: " minutes", ms: TIME_UNITS.m },
    { unit: " seconds", ms: TIME_UNITS.s }
];

export function parseDurationMs(input: string): number | null {
    let totalMs = 0;
    const matches = input.match(/(\d+)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks|M|month|months|y|year|years)/gi);

    if (!matches) return null;

    for (const match of matches) {
        const [, num, unit] = match.match(/(\d+)([smhdw])/) || [];
        if (!num || !unit || !TIME_UNITS[unit]) return null;

        totalMs += parseInt(num, 10) * TIME_UNITS[unit];
    }

    return totalMs;
}

export function parseHumanDuration(ms: number): string | null {
    if (ms <= 0) return "0s";

    let result: string[] = [];

    for (const { unit, ms: unitMs } of TIME_ORDER) {
        const value = Math.floor(ms / unitMs);
        if (value > 0) {
            let formattedUnit = value === 1 ? unit.slice(0, -1) : unit;
            result.push(`${value}${formattedUnit}`);
            ms -= value * unitMs;
        }
    }

    return result.length > 0 ? result.join(" ") : null;
}