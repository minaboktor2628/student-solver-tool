import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type CoursesCardProps = {
  courses: { code: string; name: string; section: string }[];
};
export const CoursesCard: React.FC<CoursesCardProps> = ({ courses }) => {
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
          {courses.map((course) => (
            <div key={course.code} className="rounded-lg border p-4">
              <h3 className="font-semibold">
                {course.section}-{course.code} - {course.name}
              </h3>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
