export const DEPARTMENTS = [
  'Science',
  'Commerce',
  'Arts',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year'] as const;

/**
 * Normalizes any legacy or specific department string (e.g. 'B.Sc. Physics', 'Physics', 'B.A. Odia', 'B.Com')
 * into the standard stream department: 'Science', 'Commerce', or 'Arts'.
 */
export function normalizeDepartment(dept?: string): Department {
  if (!dept) return 'Science';
  const d = dept.trim().toLowerCase();

  // Science matching
  if (
    d === 'science' ||
    d.includes('sci') ||
    d.includes('phy') ||
    d.includes('chem') ||
    d.includes('math') ||
    d.includes('bot') ||
    d.includes('zoo') ||
    d.includes('comp') ||
    d.includes('b.sc')
  ) {
    return 'Science';
  }

  // Commerce matching
  if (
    d === 'commerce' ||
    d.includes('com') ||
    d.includes('acc') ||
    d.includes('bus') ||
    d.includes('fin') ||
    d.includes('b.com')
  ) {
    return 'Commerce';
  }

  // Arts matching
  if (
    d === 'arts' ||
    d.includes('art') ||
    d.includes('odia') ||
    d.includes('eng') ||
    d.includes('hist') ||
    d.includes('pol') ||
    d.includes('soc') ||
    d.includes('phil') ||
    d.includes('sans') ||
    d.includes('edu') ||
    d.includes('b.a')
  ) {
    return 'Arts';
  }

  return 'Science';
}
