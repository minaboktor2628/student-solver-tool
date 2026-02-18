import * as z from "zod";

export const AcademicLevelSchema = z.enum(["Graduate", "Undergraduate"]);
export type AcademicLevel = z.infer<typeof AcademicLevelSchema>;

export const ReportEntrySchema = z.object({
  Course_Section_Start_Date: z.string(),
  CF_LRV_Cluster_Ref_ID: z.string(),
  Student_Course_Section_Cluster: z.string(),
  Meeting_Patterns: z.string(),
  Course_Title: z.string(),
  Locations: z.string(),
  Instructional_Format: z.string(),
  Waitlist_Waitlist_Capacity: z.string(),
  Course_Description: z.string(),
  Public_Notes: z.string(),
  Subject: z.string(),
  Delivery_Mode: z.string(),
  Academic_Level: AcademicLevelSchema,
  Section_Status: z.string(),
  Credits: z.string(),
  Section_Details: z.string(),
  Instructors: z.string(),
  Offering_Period: z.string(),
  Starting_Academic_Period_Type: z.string(),
  Course_Tags: z.string(),
  Academic_Units: z.string(),
  Course_Section: z.string(),
  Enrolled_Capacity: z.string(),
  Course_Section_End_Date: z.string(),
  Meeting_Day_Patterns: z.string(),
  Course_Section_Owner: z.string(),
});
export type ReportEntryRow = z.infer<typeof ReportEntrySchema>;

export const CourseListingApiSchema = z.object({
  Report_Entry: z.array(ReportEntrySchema),
});
export type CourseListingApi = z.infer<typeof CourseListingApiSchema>;
