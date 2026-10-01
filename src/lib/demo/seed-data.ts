/**
 * Generates and inserts fully synthetic MHD contest data for demo mode.
 * Nothing here is derived from real records — every name, school, and
 * project is fabricated. Deterministic (seeded RNG) so re-seeding the
 * shared branch on a schedule always produces the same dataset.
 */

import { findRegionOf } from "@/lib/region-finder";
import { standardize } from "@/lib/string-standardize";
import {
    schools,
    teachers,
    projects,
    yearlySchoolParticipation,
    yearlyTeacherParticipation,
    yearMetadata,
} from "@/lib/schema";
import type { connectTo } from "@/lib/demo/direct-db";

const YEARS = [2023, 2024, 2025];

// Real coordinates (one representative school per town) pulled from
// public/MA_schools_long_lat.csv, so demo schools land in their actual town
// instead of a random point that can fall outside Massachusetts entirely.
const TOWN_LOCATIONS: Record<
    string,
    { latitude: number; longitude: number; zipcode: string }
> = {
    Amherst: { latitude: 42.380755, longitude: -72.512846, zipcode: "01002" },
    Andover: { latitude: 42.657463, longitude: -71.155895, zipcode: "01810" },
    Arlington: { latitude: 42.417977, longitude: -71.16177, zipcode: "02476" },
    Belmont: { latitude: 42.394886, longitude: -71.166853, zipcode: "02478" },
    Beverly: { latitude: 42.551786, longitude: -70.889841, zipcode: "01915" },
    Braintree: { latitude: 42.21047, longitude: -70.97911, zipcode: "02184" },
    Brookline: {
        latitude: 42.343442,
        longitude: -71.114889,
        zipcode: "02445",
    },
    Cambridge: {
        latitude: 42.362992,
        longitude: -71.108252,
        zipcode: "02139",
    },
    Chelmsford: {
        latitude: 42.573119,
        longitude: -71.382616,
        zipcode: "01824",
    },
    Concord: { latitude: 42.453398, longitude: -71.346358, zipcode: "01742" },
    Danvers: { latitude: 42.582671, longitude: -70.931744, zipcode: "01923" },
    Dedham: { latitude: 42.246886, longitude: -71.160399, zipcode: "02026" },
    Framingham: {
        latitude: 42.27962,
        longitude: -71.432321,
        zipcode: "01701",
    },
    Gloucester: { latitude: 42.63721, longitude: -70.67235, zipcode: "01930" },
    Hingham: { latitude: 42.239285, longitude: -70.866285, zipcode: "02043" },
    Lexington: {
        latitude: 42.423533,
        longitude: -71.218444,
        zipcode: "02421",
    },
    Malden: { latitude: 42.427171, longitude: -71.079493, zipcode: "02148" },
    Medford: { latitude: 42.42118, longitude: -71.12807, zipcode: "02155" },
    Natick: { latitude: 42.307966, longitude: -71.358366, zipcode: "01760" },
    Needham: { latitude: 42.27947, longitude: -71.208531, zipcode: "02492" },
    Newton: { latitude: 42.353661, longitude: -71.181256, zipcode: "02458" },
    Northampton: {
        latitude: 42.323524,
        longitude: -72.626329,
        zipcode: "01060",
    },
    Norwood: { latitude: 42.177008, longitude: -71.205732, zipcode: "02062" },
    Pittsfield: {
        latitude: 42.459027,
        longitude: -73.220859,
        zipcode: "01201",
    },
    Plymouth: { latitude: 41.962757, longitude: -70.677949, zipcode: "02360" },
    Quincy: { latitude: 42.237718, longitude: -71.013129, zipcode: "02169" },
    Reading: { latitude: 42.52167, longitude: -71.12402, zipcode: "01867" },
    Salem: { latitude: 42.53448, longitude: -70.905809, zipcode: "01970" },
    Somerville: {
        latitude: 42.379231,
        longitude: -71.098828,
        zipcode: "02143",
    },
    Springfield: {
        latitude: 42.121139,
        longitude: -72.588307,
        zipcode: "01104",
    },
};
const TOWNS = Object.keys(TOWN_LOCATIONS);

const SCHOOL_SUFFIXES = [
    "High School",
    "Regional High School",
    "Middle School",
    "Academy",
    "Junior/Senior High School",
];

const FIRST_NAMES = [
    "James",
    "Mary",
    "Robert",
    "Patricia",
    "John",
    "Jennifer",
    "Michael",
    "Linda",
    "David",
    "Elizabeth",
    "William",
    "Barbara",
    "Richard",
    "Susan",
    "Joseph",
    "Jessica",
    "Thomas",
    "Sarah",
    "Charles",
    "Karen",
];

const LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Wilson",
    "Anderson",
    "Taylor",
    "Thomas",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "White",
];

const CATEGORIES = [
    { id: "1", name: "Individual Documentary" },
    { id: "2", name: "Group Documentary" },
    { id: "3", name: "Individual Exhibit" },
    { id: "4", name: "Group Exhibit" },
    { id: "5", name: "Individual Paper" },
    { id: "6", name: "Individual Performance" },
    { id: "7", name: "Group Performance" },
    { id: "8", name: "Individual Website" },
    { id: "9", name: "Group Website" },
];

const DIVISIONS = ["Junior", "Senior"];
const IMPLEMENTATION_MODELS = [
    "Class Assignment",
    "Club/Elective",
    "Independent Study",
    "Whole-School Initiative",
];
const SCHOOL_TYPES = ["Public", "Private/Independent", "Charter", "Parochial"];

const PROJECT_TOPICS = [
    "the Boston Tea Party",
    "the Underground Railroad",
    "the Salem Witch Trials",
    "the Mill Girls of Lowell",
    "the Space Race",
    "Title IX",
    "the Great Migration",
    "the Transcontinental Railroad",
    "the Suffrage Movement",
    "the New Deal",
    "the Marshall Plan",
    "the Civil Rights Movement",
    "the Industrial Revolution",
    "the Louisiana Purchase",
    "the Manhattan Project",
    "the Homestead Act",
    "the Treaty of Paris",
    "the Emancipation Proclamation",
    "the Cuban Missile Crisis",
    "the Wright Brothers' First Flight",
];
const PROJECT_TEMPLATES = [
    (t: string) => `Turning Points: How ${t} Changed History`,
    (t: string) => `The Legacy of ${t}`,
    (t: string) => `${t}: A Story of Triumph and Tragedy`,
    (t: string) => `Breaking Barriers: ${t}`,
    (t: string) => `Communication in History: ${t}`,
];

/** Deterministic PRNG (mulberry32) so seeding is reproducible. */
function makeRng(seed: number) {
    let state = seed;
    return function rng(): number {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
    return min + Math.floor(rng() * (max - min + 1));
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

type SeedSchool = {
    name: string;
    standardizedName: string;
    town: string;
    schoolId: string;
    zipcode: string;
    latitude: number;
    longitude: number;
    region: string;
    gateway: boolean;
};

export function buildSeedData(seed = 42) {
    const rng = makeRng(seed);

    const seedSchools: SeedSchool[] = TOWNS.map((town, i) => {
        const suffix = pick(rng, SCHOOL_SUFFIXES);
        const name = `${town} ${suffix}`;
        const { latitude, longitude, zipcode } = TOWN_LOCATIONS[town];
        return {
            name,
            standardizedName: standardize(name),
            town,
            schoolId: `DEMO-${String(i + 1).padStart(4, "0")}`,
            zipcode,
            latitude,
            longitude,
            region: findRegionOf(latitude, longitude),
            gateway: rng() < 0.2,
        };
    });

    const seedTeachers = Array.from({ length: 60 }, (_, i) => {
        const first = pick(rng, FIRST_NAMES);
        const last = pick(rng, LAST_NAMES);
        return {
            name: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
            teacherId: `DEMO-T-${String(i + 1).padStart(4, "0")}`,
        };
    });

    return { rng, seedSchools, seedTeachers };
}

export async function insertSeedData(
    db: ReturnType<typeof connectTo>,
    seed = 42,
) {
    const { rng, seedSchools, seedTeachers } = buildSeedData(seed);

    const insertedSchools = await db
        .insert(schools)
        .values(seedSchools)
        .returning({ id: schools.id });

    const insertedTeachers = await db
        .insert(teachers)
        .values(seedTeachers)
        .returning({ id: teachers.id });

    const schoolParticipationRows = insertedSchools.flatMap((school) =>
        YEARS.map((year) => ({
            schoolId: school.id,
            year,
            division: [pick(rng, DIVISIONS)],
            implementationModel: pick(rng, IMPLEMENTATION_MODELS),
            schoolType: pick(rng, SCHOOL_TYPES),
            competingStudents: randInt(rng, 5, 60),
        })),
    );
    for (const batch of chunk(schoolParticipationRows, 200)) {
        await db.insert(yearlySchoolParticipation).values(batch);
    }

    // Assign a handful of teachers to each school for each year.
    const teacherParticipationRows: {
        teacherId: number;
        schoolId: number;
        year: number;
    }[] = [];
    const teacherIdsByYearAndSchool = new Map<string, number[]>();
    for (const school of insertedSchools) {
        for (const year of YEARS) {
            const teacherCount = randInt(rng, 1, 3);
            const assigned = Array.from(
                { length: teacherCount },
                () => pick(rng, insertedTeachers).id,
            );
            teacherIdsByYearAndSchool.set(`${school.id}-${year}`, assigned);
            for (const teacherId of assigned) {
                teacherParticipationRows.push({
                    teacherId,
                    schoolId: school.id,
                    year,
                });
            }
        }
    }
    for (const batch of chunk(teacherParticipationRows, 200)) {
        await db.insert(yearlyTeacherParticipation).values(batch);
    }

    const projectRows: {
        schoolId: number;
        teacherId: number;
        projectId: string;
        title: string;
        division: string;
        categoryId: string;
        category: string;
        year: number;
        teamProject: boolean;
        numStudents: number;
    }[] = [];
    let projectCounter = 1;
    for (const school of insertedSchools) {
        for (const year of YEARS) {
            const teacherIds =
                teacherIdsByYearAndSchool.get(`${school.id}-${year}`) ?? [];
            if (teacherIds.length === 0) continue;
            const projectCount = randInt(rng, 3, 6);
            for (let i = 0; i < projectCount; i++) {
                const category = pick(rng, CATEGORIES);
                const teamProject = category.name.startsWith("Group");
                const template = pick(rng, PROJECT_TEMPLATES);
                const topic = pick(rng, PROJECT_TOPICS);
                projectRows.push({
                    schoolId: school.id,
                    teacherId: pick(rng, teacherIds),
                    projectId: `DEMO-P-${String(projectCounter++).padStart(5, "0")}`,
                    title: template(topic),
                    division: pick(rng, DIVISIONS),
                    categoryId: category.id,
                    category: category.name,
                    year,
                    teamProject,
                    numStudents: teamProject ? randInt(rng, 2, 4) : 1,
                });
            }
        }
    }
    for (const batch of chunk(projectRows, 200)) {
        await db.insert(projects).values(batch);
    }

    const now = new Date();
    await db.insert(yearMetadata).values(
        YEARS.map((year) => ({
            year,
            uploadedAt: now,
            lastUpdatedAt: now,
        })),
    );
}
