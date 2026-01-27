import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { Section } from "@/components/professor/professor-dashboard/professor-homepage";

type CoursesCardProps = {
  sections: Record<string, Section> | undefined;
};
export const CoursesCard: React.FC<CoursesCardProps> = ({ sections }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Courses</CardTitle>
        <CardDescription>
          Please email mahrens@wpi.edu if your assigned courses are incorrect
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mock course data */}
          {Object.values(sections ?? {}).map((course) => (
            <div key={course.courseCode} className="rounded-lg border p-4">
              <h3 className="font-semibold">
                {course.courseSection}-{course.courseCode} -{" "}
                {course.courseTitle}
              </h3>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
