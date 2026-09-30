import type { Member, MemberStatus } from '@/types';
import { DEPARTMENTS, ACADEMIC_YEARS } from '@/constants/departments';
import { SEED_COUNTS } from './seedConfig';
import { createSeededRandom, pickFrom, randomInt } from './seededRandom';

const FIRST_NAMES = [
  'Ankit', 'Priya', 'Rahul', 'Swagatika', 'Debasis', 'Manisha', 'Suresh', 'Ipsita',
  'Bikash', 'Rina', 'Alok', 'Sunita', 'Pradeep', 'Kavita', 'Rajesh', 'Sushree',
  'Amit', 'Lipsa', 'Sanjay', 'Nandini',
];
const LAST_NAMES = [
  'Rout', 'Patra', 'Nayak', 'Sahoo', 'Behera', 'Das', 'Mohanty', 'Panda',
  'Pradhan', 'Jena', 'Swain', 'Mallick', 'Dash', 'Bal', 'Sethi',
];

const STATUS_WEIGHTS: MemberStatus[] = [
  ...Array(90).fill('Active'),
  ...Array(7).fill('Inactive'),
  ...Array(3).fill('Suspended'),
];

function buildGeneratedMembers(count: number): Member[] {
  const rng = createSeededRandom(7);
  const members: Member[] = [];

  // Fixed first member so the demo student login (2026001 / student123)
  // maps to a real, browsable member record with real loans/fines.
  members.push({
    id: 'member_1001',
    memberId: 'MEM-1001',
    name: 'Ankit Rout',
    rollNumber: '2026001',
    department: 'B.Sc. Physics',
    academicYear: '2nd Year',
    email: 'ankit.rout@pscollege.ac.in',
    phone: '9437100001',
    status: 'Active',
    joinDate: '2024-07-01',
  });

  for (let i = 1; i < count; i += 1) {
    const first = pickFrom(rng, FIRST_NAMES);
    const last = pickFrom(rng, LAST_NAMES);
    const rollNumber = `2026${String(i + 1).padStart(3, '0')}`;

    members.push({
      id: `member_${1001 + i}`,
      memberId: `MEM-${1001 + i}`,
      name: `${first} ${last}`,
      rollNumber,
      department: pickFrom(rng, DEPARTMENTS),
      academicYear: pickFrom(rng, ACADEMIC_YEARS),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@pscollege.ac.in`,
      phone: `94371${String(randomInt(rng, 10000, 99999))}`,
      status: pickFrom(rng, STATUS_WEIGHTS),
      joinDate: '2024-07-01',
    });
  }

  return members;
}

export function seedMembers(): Member[] {
  return buildGeneratedMembers(SEED_COUNTS.generatedMembers);
}
