import type { Person, Course, Assignment, ValidationResult } from '@/types/validation';

export class AssignmentValidator {
  private people: Map<string, Person>;
  private courses: Map<string, Course>;
  private assignments: Assignment[];
  public errors: string[] = [];
  public warnings: string[] = [];

  constructor(people: Person[], courses: Course[], assignments: Assignment[]) {
    // Create people map with multiple lookup keys
    this.people = this.createPeopleMap(people);
    this.courses = new Map(courses.map(c => [this.getCourseId(c.Section), {
      ...c,
      Instructors: c.Instructors || ''
    }]));
    this.assignments = assignments;
  }

  private createPeopleMap(people: Person[]): Map<string, Person> {
    const peopleMap = new Map<string, Person>();
    
    people.forEach(person => {
      // Store by email (primary key)
      peopleMap.set(person.Email.toLowerCase(), person);
      
      // Also store by name variations for flexible matching
      const normalName = `${person.First} ${person.Last}`.toLowerCase();
      const reversedName = `${person.Last} ${person.First}`.toLowerCase();
      
      if (!peopleMap.has(normalName)) peopleMap.set(normalName, person);
      if (!peopleMap.has(reversedName)) peopleMap.set(reversedName, person);
      
      // Store by email username (before @) if email exists
      if (person.Email) {
        const emailOnly = person.Email.split('@')[0]?.toLowerCase() || '';
        if (emailOnly && !peopleMap.has(emailOnly)) {
          peopleMap.set(emailOnly, person);
        }
      }
    });
    
    return peopleMap;
  }

  validateAll(): ValidationResult {
    this.errors = [];
    this.warnings = [];

    console.log("Starting validation...");
    console.log("People count:", this.people.size);
    console.log("Courses count:", this.courses.size);
    console.log("Assignments count:", this.assignments.length);

    this.validateIndividualAssignments();
    this.validateCourseRequirements();
    this.validateStaffHourLimits();
    this.validateAvailability();
    this.validatePLASingleAssignment();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  private validateIndividualAssignments(): void {
    this.assignments.forEach(assignment => {
      const courseId = this.getCourseId(assignment.Section);
      const course = this.courses.get(courseId);

      if (!course) {
        this.errors.push(`Course ${courseId} not found in course list`);
        return;
      }

      this.validateStaffExist(assignment.TAs, 'TA', courseId);
      this.validateStaffExist(assignment.PLAs, 'PLA', courseId);
      this.validateStaffExist(assignment.GLAs, 'GLA', courseId);
    });
  }

  private validateStaffExist(
    staff: Array<{First: string; Last: string; Locked: boolean}>,
    type: string,
    courseId: string
  ): void {
    staff.forEach(assigned => {
      const person = this.findPerson(assigned.First, assigned.Last);
      if (!person) {
        this.errors.push(`${type} ${assigned.First} ${assigned.Last} not found in staff list for ${courseId}`);
      } else if (person.Type.toLowerCase() !== type.toLowerCase()) {
        this.errors.push(`${assigned.First} ${assigned.Last} is a ${person.Type}, not a ${type} for ${courseId}`);
      }
    });
  }

  private validateCourseRequirements(): void {
    this.assignments.forEach(assignment => {
      const courseId = this.getCourseId(assignment.Section);
      const course = this.courses.get(courseId);
      
      if (!course) return;

      const requiredHours = this.calculateRequiredHours(course.Enrollment);
      const assignedHours = this.getTotalAssignedHours(assignment);

      console.log(`Course ${courseId}: required=${requiredHours}, assigned=${assignedHours}, TAs=${assignment.TAs.length}, PLAs=${assignment.PLAs.length}, GLAs=${assignment.GLAs.length}`);

      if (assignedHours < requiredHours) {
        this.errors.push(`Course ${courseId} has ${assignedHours} hours assigned but requires ${requiredHours} hours`);
      } else if (assignedHours > requiredHours) {
        this.warnings.push(`Course ${courseId} has ${assignedHours} hours assigned but only requires ${requiredHours} hours`);
      }
    });
  }

  private validateStaffHourLimits(): void {
    const staffHours = new Map<string, number>();
    const staffAssignments = new Map<string, string[]>();

    // Initialize all staff with 0 hours
    Array.from(this.people.values()).forEach(person => {
      staffHours.set(person.Email.toLowerCase(), 0);
      staffAssignments.set(person.Email.toLowerCase(), []);
    });

    console.log("Initialized staff hours for", staffHours.size, "people");

    // Sum hours across all assignments and track assignments
    this.assignments.forEach(assignment => {
      const courseId = this.getCourseId(assignment.Section);
      
      this.sumHoursForStaff(assignment.TAs, 'TA', staffHours, staffAssignments, courseId);
      this.sumHoursForStaff(assignment.PLAs, 'PLA', staffHours, staffAssignments, courseId);
      this.sumHoursForStaff(assignment.GLAs, 'GLA', staffHours, staffAssignments, courseId);
    });

    // Validate hour limits
    staffHours.forEach((totalHours, email) => {
      const person = this.people.get(email);
      if (!person) return;

      const maxHours = person.Type === 'PLA' ? 10 : 20;
      
      if (totalHours > maxHours) {
        this.errors.push(`${person.First} ${person.Last} (${person.Type}) has ${totalHours} hours assigned, exceeding the limit of ${maxHours}`);
      } else if (totalHours === 0) {
        this.warnings.push(`${person.First} ${person.Last} (${person.Type}) has no hours assigned`);
      } else {
        console.log(`${person.First} ${person.Last} has ${totalHours} hours assigned`);
      }
    });
  }

  private validateAvailability(): void {
    this.assignments.forEach(assignment => {
      const courseId = this.getCourseId(assignment.Section);
      const baseCourseId = this.getBaseCourseId(courseId);
      
      this.validateStaffAvailability(assignment.TAs, baseCourseId, 'TA');
      this.validateStaffAvailability(assignment.PLAs, baseCourseId, 'PLA');
      this.validateStaffAvailability(assignment.GLAs, baseCourseId, 'GLA');
    });
  }

  private validatePLASingleAssignment(): void {
    const plaAssignments = new Map<string, string[]>();

    this.assignments.forEach(assignment => {
      const courseId = this.getCourseId(assignment.Section);
      
      assignment.PLAs.forEach(pla => {
        const person = this.findPerson(pla.First, pla.Last);
        if (person && person.Type === 'PLA') {
          if (!plaAssignments.has(person.Email)) {
            plaAssignments.set(person.Email, []);
          }
          plaAssignments.get(person.Email)!.push(courseId);
        }
      });
    });

    // Check for PLAs assigned to multiple courses
    plaAssignments.forEach((courseIds, email) => {
      if (courseIds.length > 1) {
        const person = this.people.get(email);
        if (person) {
          this.errors.push(
            `${person.First} ${person.Last} (PLA) is assigned to multiple courses: ${courseIds.join(', ')}. PLAs can only be assigned to one course.`
          );
        }
      }
    });
  }

  private validateStaffAvailability(
    staff: Array<{First: string; Last: string}>,
    baseCourseId: string,
    type: string
  ): void {
    staff.forEach(assigned => {
      const person = this.findPerson(assigned.First, assigned.Last);
      if (!person || !person.Preferences) {
        console.warn(`Could not find person or preferences for ${assigned.First} ${assigned.Last}`);
        return;
      }

      const isAvailable = person.Preferences[baseCourseId];
      
      if (isAvailable === false) {
        this.errors.push(`${type} ${assigned.First} ${assigned.Last} is assigned to ${baseCourseId} but marked themselves as unavailable`);
      } else if (isAvailable === undefined) {
        this.warnings.push(`${type} ${assigned.First} ${assigned.Last} has no preference recorded for ${baseCourseId}`);
      }
    });
  }

  private sumHoursForStaff(
    staff: Array<{First: string; Last: string; Locked: boolean}>,
    role: 'PLA' | 'TA' | 'GLA',
    staffHours: Map<string, number>,
    staffAssignments: Map<string, string[]>,
    courseId: string
  ): void {
    staff.forEach(assigned => {
      const person = this.findPerson(assigned.First, assigned.Last);
      if (person) {
        // Calculate hours based on role, not from the assignment data
        const hoursPerAssignment = role === 'PLA' ? 10 : 20;
        const currentHours = staffHours.get(person.Email.toLowerCase()) || 0;
        const newTotal = currentHours + hoursPerAssignment;
        staffHours.set(person.Email.toLowerCase(), newTotal);
        
        const assignments = staffAssignments.get(person.Email.toLowerCase()) || [];
        if (!assignments.includes(courseId)) {
          assignments.push(courseId);
          staffAssignments.set(person.Email.toLowerCase(), assignments);
        }

        console.log(`Added ${hoursPerAssignment} hours for ${person.First} ${person.Last} (${role}) in ${courseId}, total: ${newTotal}`);
      } else {
        console.warn(`Could not find person for assignment: ${assigned.First} ${assigned.Last}`);
      }
    });
  }

  private calculateRequiredHours(enrollment: number): number {
    const roundedUp = Math.ceil(enrollment / 5) * 5;
    const divided = roundedUp / 2;
    return Math.floor(divided / 10) * 10;
  }

  private getTotalAssignedHours(assignment: Assignment): number {
    // Handle both calculated hours and explicit hours fields
    let taHours = 0;
    let plaHours = 0;
    let glaHours = 0;

    // Method 1: Calculate based on count (if Hours field is missing or 0)
    if (assignment.TAs.every(ta => !ta.Hours || ta.Hours === 0)) {
      taHours = assignment.TAs.length * 20;
    } else {
      taHours = assignment.TAs.reduce((sum, ta) => sum + (ta.Hours || 0), 0);
    }

    if (assignment.PLAs.every(pla => !pla.Hours || pla.Hours === 0)) {
      plaHours = assignment.PLAs.length * 10;
    } else {
      plaHours = assignment.PLAs.reduce((sum, pla) => sum + (pla.Hours || 0), 0);
    }

    if (assignment.GLAs.every(gla => !gla.Hours || gla.Hours === 0)) {
      glaHours = assignment.GLAs.length * 20;
    } else {
      glaHours = assignment.GLAs.reduce((sum, gla) => sum + (gla.Hours || 0), 0);
    }

    const total = taHours + plaHours + glaHours;

    console.log(`Course ${this.getCourseId(assignment.Section)}: TA hours=${taHours} (${assignment.TAs.length} TAs), PLA hours=${plaHours} (${assignment.PLAs.length} PLAs), GLA hours=${glaHours} (${assignment.GLAs.length} GLAs), total=${total}`);
    return total;
  }

  private findPerson(first: string, last: string): Person | undefined {
    // Try multiple name formats for matching
    const searchKeys = [
      `${first} ${last}`.toLowerCase(),
      `${last} ${first}`.toLowerCase(),
      first.toLowerCase(),
      last.toLowerCase()
    ];

    for (const key of searchKeys) {
      const person = this.people.get(key);
      if (person) {
        console.log(`Found person ${first} ${last} using key: ${key}`);
        return person;
      }
    }

    console.warn(`Could not find person: ${first} ${last}`);
    return undefined;
  }

  private getCourseId(section: {Course: string; Subsection: string}): string {
    return `${section.Course}-${section.Subsection}`;
  }

  private getBaseCourseId(fullCourseId: string): string {
    if (!fullCourseId) return '';
    const parts = fullCourseId.split('-');
    return parts[0]?.trim() || fullCourseId;
  }
}