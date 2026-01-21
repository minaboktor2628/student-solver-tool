import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

type quickStatsCardProps = {
  numberOfCourses: number;
  isSubmitted: boolean;
};

export const NumCoursesCard: React.FC<quickStatsCardProps> = ({
  numberOfCourses,
  isSubmitted,
}) => {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Courses Teaching</CardDescription>
          <CardTitle className="text-3xl"> {numberOfCourses}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Preferences Status</CardDescription>
          <CardTitle className="text-lg">
            {isSubmitted ? (
              <span className="text-green-600">Complete</span>
            ) : (
              <span className="text-orange-600">Pending</span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};
