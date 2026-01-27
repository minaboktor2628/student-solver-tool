import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, Calendar } from "lucide-react";
import Link from "next/link";

type DeadlineCardProps = {
  deadlineDate: Date;
  isSubmitted: boolean;
};

export const DeadlineCard: React.FC<DeadlineCardProps> = ({
  deadlineDate,
  isSubmitted,
}) => {
  const today = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  return (
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
          Submit your assistant preferences for each course you&apos;re teaching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Deadline Date</p>
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
  );
};
