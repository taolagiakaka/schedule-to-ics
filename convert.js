import fs from 'fs';
import path from 'path';
import ical from 'ical-generator';
import { fileURLToPath } from 'url';

// --- Fix __dirname cho ES Module ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LOAD JSON
const jsonPath = path.join(__dirname, 'timetable.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);

// CONFIG
const PERIOD_TIME = {
    1: { start: '07:00', end: '08:00' },
    2: { start: '08:00', end: '09:00' },
    3: { start: '09:00', end: '10:00' },
    4: { start: '10:00', end: '11:00' },
    5: { start: '11:00', end: '12:00' },
    6: { start: '13:00', end: '14:00' },
    7: { start: '14:00', end: '15:00' },
    8: { start: '15:00', end: '16:00' },
};

const DAY_MAP = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
};

// Tạo calendar
const calendar = ical({
    name: 'Lịch báo giảng',
    timezone: 'Asia/Ho_Chi_Minh',
});

// helper
function makeDate(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
}

// xử lý từng ngày
function processDay(weekStart, dayName, lessons) {
    const index = DAY_MAP[dayName];
    if (!index || lessons.length === 0) return;

    const date = new Date(weekStart);
    date.setDate(date.getDate() + (index - 1));
    const dateStr = date.toISOString().slice(0, 10);

    // Get first and last period times
    const firstPeriod = Math.min(...lessons.map(l => l.period));
    const lastPeriod = Math.max(...lessons.map(l => l.period));

    const startTime = PERIOD_TIME[firstPeriod]?.start || '07:00';
    const endTime = PERIOD_TIME[lastPeriod]?.end || '16:00';

    // Build description with all lessons
    const description = lessons
        .sort((a, b) => a.period - b.period)
        .map(item => {
            const lessonInfo = item.lesson ? ` – ${item.lesson}` : '';
            return `Tiết ${item.period}: ${item.name}${lessonInfo}`;
        })
        .join('\n');

    // Create single event for the day
    const dayNameCapitalized =
        dayName.charAt(0).toUpperCase() + dayName.slice(1);
    calendar.createEvent({
        start: makeDate(dateStr, startTime),
        end: makeDate(dateStr, endTime),
        allDay: true,
        summary: `Lịch Báo Giảng - ${dayNameCapitalized}`,
        description: description,
    });
}

// Iterate over all weeks
data.forEach(week => {
    processDay(week.start, 'monday', week.monday || []);
    processDay(week.start, 'tuesday', week.tuesday || []);
    processDay(week.start, 'wednesday', week.wednesday || []);
    processDay(week.start, 'thursday', week.thursday || []);
    processDay(week.start, 'friday', week.friday || []);
});

const outputPath = path.join(__dirname, 'timetable.ics');
fs.writeFileSync(outputPath, calendar.toString());

console.log('ICS generated:', outputPath);
