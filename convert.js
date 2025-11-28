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
    1: { start: '07:30', end: '08:05' },
    2: { start: '08:10', end: '08:45' },
    3: { start: '09:10', end: '09:45' },
    4: { start: '09:50', end: '10:25' },
    5: { start: '10:25', end: '11:00' },
    6: { start: '14:00', end: '14:35' },
    7: { start: '14:40', end: '15:15' },
    8: { start: '15:45', end: '16:20' },
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
    name: 'School Schedule',
    timezone: 'Asia/Ho_Chi_Minh',
});

// helper
function makeDate(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
}

// xử lý từng ngày
function processDay(weekStart, dayName, lessons) {
    const index = DAY_MAP[dayName];
    if (!index) return;

    const date = new Date(weekStart);
    date.setDate(date.getDate() + (index - 1));
    const dateStr = date.toISOString().slice(0, 10);

    lessons.forEach(item => {
        const time = PERIOD_TIME[item.period];
        if (!time) return;

        let summary = `${item.name} (${item.session})`;
        // Highlight if isBold is false (meaning it has specific content)
        if (item.isBold === false) {
            summary = `★ ${summary}`;
        }

        calendar.createEvent({
            start: makeDate(dateStr, time.start),
            end: makeDate(dateStr, time.end),
            summary: summary,
            description: item.lesson || '',
        });
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
