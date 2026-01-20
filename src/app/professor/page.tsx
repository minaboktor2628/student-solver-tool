// TEMPORARY: Auth bypassed for mockup demo
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/dist/client/components/navigation";
import { auth } from "@/server/auth";

export default async function ProfessorHomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }
  const mockUserName = "Professor Smith";

  const deadlineDate = new Date("2025-12-15");
  const today = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  const isSubmitted = false;

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Professor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {mockUserName}
        </p>
      </div>

      <Card
        className={`mb-6 ${isOverdue ? "border-destructive" : isUrgent ? "border-warning" : ""}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <AlertCircle className="text-destructive h-5 w-5" />
              ) : isUrgent ? (
                <Clock className="text-warning h-5 w-5" />
              ) : (
                <Calendar className="text-primary h-5 w-5" />
              )}
              <CardTitle>Assistant Preferences Deadline</CardTitle>
            </div>
            {isSubmitted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Submitted</span>
              </div>
            )}
          </div>
          <CardDescription>
            Submit your assistant preferences for each course you're teaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm">
                Deadline Date
              </p>
              <p className="text-2xl font-semibold">
                {deadlineDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {isOverdue ? (
                <div className="bg-destructive/10 rounded-lg p-4">
                  <p className="text-destructive text-sm font-medium">
                    Overdue by {Math.abs(daysUntilDeadline)} day
                    {Math.abs(daysUntilDeadline) !== 1 ? "s" : ""}
                  </p>
                </div>
              ) : isUrgent ? (
                <div className="bg-warning/10 rounded-lg p-4">
                  <p className="text-warning text-sm font-medium">
                    {daysUntilDeadline} day{daysUntilDeadline !== 1 ? "s" : ""}{" "}
                    remaining
                  </p>
                </div>
              ) : (
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-primary text-sm font-medium">
                    {daysUntilDeadline} day{daysUntilDeadline !== 1 ? "s" : ""}{" "}
                    until deadline
                  </p>
                </div>
              )}
            </div>

            {!isSubmitted && (
              <Link href="/professor/preferences">
                <Button className="w-full sm:w-auto" size="lg">
                  {isOverdue
                    ? "Submit Preferences (Overdue)"
                    : "Submit Preferences"}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Courses Teaching</CardDescription>
            <CardTitle className="text-3xl">3</CardTitle>
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

      {/* Courses Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>
            Review and submit preferences for each course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock course data */}
            {[
              {
                code: "CS 1102",
                name: "Introduction to Program Design",
                hours: 20,
              },
              {
                code: "CS 2103",
                name: "Accelerated Object-Oriented Design Concepts",
                hours: 20,
              },
              { code: "CS 3733", name: "Software Engineering", hours: 20 },
            ].map((course) => (
              <div key={course.code} className="rounded-lg border p-4">
                <h3 className="font-semibold">{course.code}</h3>
                <p className="text-muted-foreground text-sm">{course.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {course.hours} hours needed
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
