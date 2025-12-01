import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read data files
const lessonPlan = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'lesson-plan.json'), 'utf8'),
);
const weekTitles = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'week-title.json'), 'utf8'),
);
const weeklySchedule = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, 'data', 'weeklySchedule.json'),
        'utf8',
    ),
);

// Helper function to calculate date range for a week
function getWeekDates(startDate, weekOffset) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + weekOffset * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 4); // Monday to Friday

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
}

// Helper function to get lessons for a subject and week
function getLessonsForSubject(subject, weekNumber) {
    const subjectMap = {
        'Tiếng Việt': 'literature',
        Toán: 'math',
        HĐTN: 'hdtn',
        TNXH: 'tnxh',
        'LS-ĐL': 'history',
    };

    const key = subjectMap[subject];
    if (!key || !lessonPlan[key]) return null;

    const lessons = lessonPlan[key].filter(
        lesson => lesson.week === weekNumber,
    );
    return lessons;
}

// Days mapping
const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Helper function to get the appropriate schedule for a week
function getScheduleForWeek(weekNum, schedules) {
    // If weeklySchedule is not an array, return it as is
    if (!Array.isArray(schedules)) {
        return schedules;
    }

    // Week 1-10: use schedule with createdAt 2024-09-17
    // Week 11: no schedule specified, use first available
    // Week 12-18: use schedule with createdAt 2025-11-21
    if (weekNum >= 1 && weekNum <= 10) {
        const schedule = schedules.find(
            s => s.createdAt && s.createdAt.startsWith('2024-09-17'),
        );
        return schedule || schedules[0];
    } else if (weekNum >= 12 && weekNum <= 18) {
        const schedule = schedules.find(
            s => s.createdAt && s.createdAt.startsWith('2025-11-21'),
        );
        return schedule || schedules[1] || schedules[0];
    } else {
        // Week 11 or any other week - use first schedule
        return schedules[0];
    }
}

// Generate merged data
function generateMergedSchedule(startDate, numberOfWeeks) {
    const result = [];

    for (let weekNum = 1; weekNum <= numberOfWeeks; weekNum++) {
        const dates = getWeekDates(startDate, weekNum - 1);
        const weekTitle = weekTitles.find(w => w.id === weekNum);

        // Get the appropriate schedule for this week
        const currentSchedule = getScheduleForWeek(weekNum, weeklySchedule);

        const weekData = {
            weekNumber: weekNum,
            title: weekTitle ? weekTitle.name : `Tuần ${weekNum}`,
            start: dates.start,
            end: dates.end,
            weeklySchedule: {
                name: currentSchedule.name,
                createdAt: currentSchedule.createdAt,
            },
        };

        // Track lesson counters for each subject
        const lessonCounters = {};

        // Process each day
        dayNames.forEach((dayName, dayIndex) => {
            weekData[dayName] = [];

            // Get schedule entries for this day
            const dayEntries = currentSchedule.entries
                .filter(entry => entry.day === dayIndex)
                .sort((a, b) => a.periodIndex - b.periodIndex);

            dayEntries.forEach(entry => {
                const subject = entry.subject;

                // Initialize counter for this subject if not exists
                if (!lessonCounters[subject]) {
                    lessonCounters[subject] = 0;
                }

                // Get lessons for this subject and week
                const lessons = getLessonsForSubject(subject, weekNum);
                let lessonName = '';

                if (lessons && lessons.length > 0) {
                    // Get the next lesson for this subject
                    if (lessonCounters[subject] < lessons.length) {
                        lessonName = lessons[lessonCounters[subject]].name;
                        lessonCounters[subject]++;
                    }
                }

                // Determine if this should be bold (empty lesson)
                const isBold = lessonName === '';

                // Determine equipment
                const equipment = {
                    has:
                        lessonName !== '' && ['HĐTN', 'TNXH'].includes(subject)
                            ? 'x'
                            : '',
                    selfMade:
                        lessonName !== '' &&
                        ['Tiếng Việt', 'Toán', 'Tiếng Anh'].includes(subject)
                            ? 'x'
                            : '',
                };

                weekData[dayName].push({
                    name: subject,
                    session: entry.session,
                    period: entry.periodIndex,
                    lesson: lessonName,
                    equipment: equipment,
                    adjustments: '',
                    isBold: isBold,
                });
            });
        });

        result.push(weekData);
    }

    return result;
}

// Generate 35 weeks starting from September 8, 2025
const startDate = '2025-09-08';
const numberOfWeeks = 35;
const mergedSchedule = generateMergedSchedule(startDate, numberOfWeeks);

// Write output to file
const outputPath = path.join(__dirname, 'timetable.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedSchedule, null, 4), 'utf8');

console.log(`✅ Successfully generated ${numberOfWeeks} weeks of schedule!`);
console.log(`📁 Output saved to: ${outputPath}`);
console.log(
    `📅 Date range: ${mergedSchedule[0].start} to ${
        mergedSchedule[mergedSchedule.length - 1].end
    }`,
);
