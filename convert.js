import fs from "fs";
import path from "path";
import ical from "ical-generator";
import { fileURLToPath } from "url";

// --- Fix __dirname cho ES Module ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LOAD JSON
const jsonPath = path.join(__dirname, "timetable.json");
const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);

const week = data[0];

// CONFIG
const SESSION_TIME = {
    "Sáng": { start: "07:00", end: "09:00" },
    "Chiều": { start: "13:30", end: "15:30" }
};

const DAY_MAP = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5
};

// Tạo calendar
const calendar = ical({ name: week.title });

// helper
function makeDate(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
}

// xử lý từng ngày
function processDay(dayName, lessons) {
    const index = DAY_MAP[dayName];
    if (!index) return;

    const date = new Date(week.start);
    date.setDate(date.getDate() + (index - 1));
    const dateStr = date.toISOString().slice(0, 10);

    lessons.forEach((item) => {
        const time = SESSION_TIME[item.session];
        if (!time) return;

        calendar.createEvent({
            start: makeDate(dateStr, time.start),
            end: makeDate(dateStr, time.end),
            summary: `${item.name} (${item.session})`,
            description: item.lesson || ""
        });
    });
}

processDay("monday", week.monday || []);
processDay("tuesday", week.tuesday || []);
processDay("wednesday", week.wednesday || []);
processDay("thursday", week.thursday || []);
processDay("friday", week.friday || []);

const outputPath = path.join(__dirname, "timetable.ics");
fs.writeFileSync(outputPath, calendar.toString());

console.log("ICS generated:", outputPath);
