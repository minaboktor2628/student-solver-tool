import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { AssignmentValidator } from '@/lib/validator';
import { ValidationInputSchema } from '@/types/excel';
import type { Person, Course, Assignment } from '@/types/validation';

export const validationRouter = createTRPCRouter({
  validate: publicProcedure
    .input(ValidationInputSchema)
    .mutation(({ input }) => {
      try {
        console.log("Starting validation with input keys:", Object.keys(input));
        
        // Map Excel data to TypeScript interfaces - PLA Preferences
        const plaPeople: Person[] = ((input['PLA Preferences'] as any[]) || []).map((person: any) => {
          const preferences: Record<string, boolean> = {};
          
          // Look for course preference fields (e.g., "CS 1005": true)
          Object.entries(person).forEach(([key, value]) => {
            if (key.startsWith('CS ') && typeof value === 'boolean') {
              preferences[key] = value;
            }
          });
          
          return {
            First: person.First,
            Last: person.Last,
            Email: person.Email,
            Type: 'PLA' as const,
            Preferences: preferences
          };
        });

        // Map Excel data to TypeScript interfaces - TA Preferences
        const taPeople: Person[] = ((input['TA Preferences'] as any[]) || []).map((person: any) => {
          const preferences: Record<string, boolean> = {};
          
          // Look for course preference fields (e.g., "CS 1005": true)
          Object.entries(person).forEach(([key, value]) => {
            if (key.startsWith('CS ') && typeof value === 'boolean') {
              preferences[key] = value;
            }
          });
          
          return {
            First: person.First,
            Last: person.Last,
            Email: person.Email,
            Type: 'TA' as const,
            Preferences: preferences
          };
        });

        const allPeople: Person[] = [...plaPeople, ...taPeople];
        console.log(`Mapped ${allPeople.length} people (${plaPeople.length} PLAs, ${taPeople.length} TAs)`);

        // Extract courses from allocations
        const allocations = input.Allocations as any[] || [];
        const courses: Course[] = allocations.map(allocation => ({
          AcademicPeriod: allocation['Academic Period'],
          Section: allocation.Section,
          Enrollment: allocation.Enrollment || 0,
          Instructors: allocation.Instructors || '',
          RequiredHours: undefined
        }));

        console.log(`Mapped ${courses.length} courses`);

        // Map assignments data - DEBUG THE ASSIGNMENTS
        const assignmentsData = input.Assignments as any[] || [];
        console.log("Raw assignments data length:", assignmentsData.length);
        
        if (assignmentsData.length > 0) {
          console.log("First assignment sample:", JSON.stringify(assignmentsData[0], null, 2));
        }

        const assignments: Assignment[] = assignmentsData.map(assignment => {
          // Debug the assignment structure
          console.log("Assignment TAs:", assignment.TAs);
          console.log("Assignment PLAs:", assignment.PLAs);
          console.log("Assignment GLAs:", assignment.GLAs);

          return {
            AcademicPeriod: assignment['Academic Period'],
            Section: assignment.Section,
            TAs: (assignment.TAs || []).filter(Boolean).map((ta: any) => ({
              First: ta.First,
              Last: ta.Last,
              Locked: ta.Locked,
              Hours: ta.Hours || 0
            })),
            PLAs: (assignment.PLAs || []).filter(Boolean).map((pla: any) => ({
              First: pla.First,
              Last: pla.Last,
              Locked: pla.Locked,
              Hours: pla.Hours || 0
            })),
            GLAs: (assignment.GLAs || []).filter(Boolean).map((gla: any) => ({
              First: gla.First,
              Last: gla.Last,
              Locked: gla.Locked,
              Hours: gla.Hours || 0
            }))
          };
        });

        console.log(`Mapped ${assignments.length} assignments`);

        const validator = new AssignmentValidator(allPeople, courses, assignments);
        const result = validator.validateAll();
        
        console.log(`Validation completed: ${result.errors.length} errors, ${result.warnings.length} warnings`);
        
        return {
          success: true,
          result
        };
      } catch (error) {
        console.error('Validation error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown validation error'
        };
      }
    }),
});