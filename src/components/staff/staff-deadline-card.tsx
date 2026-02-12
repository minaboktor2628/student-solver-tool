"use client";
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
    <Card className="mb-6 gap-2">
      <CardHeader>
        {!isSubmitted && (
          <div>
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <AlertCircle className="text-destructive h-5 w-5" />
              ) : isUrgent ? (
                <Clock className="text-warning h-5 w-5" />
              ) : (
                <Calendar className="text-primary h-5 w-5" />
              )}
              <CardTitle>Preferences Form</CardTitle>
            </div>
            <div className="mt-2">
              <CardDescription>Submit your course preferences</CardDescription>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-semibold">
                Due Date&nbsp; - &nbsp;
                {deadlineDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        )}
        {isSubmitted && (
          <div>
            <div className="my-2 flex items-center justify-between">
              <CardTitle>Assistant Preferences Deadline</CardTitle>
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Submitted</span>
              </div>
            </div>
            <div>
              <span className="text-2xl font-semibold">
                Due Date&nbsp; - &nbsp;
                {deadlineDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div>
          {isSubmitted && (
            <div>
              <Link href="/preferences-form">
                <Button className="w-full sm:w-auto" size="lg">
                  {isOverdue
                    ? "Edit Preferences (Will be overdue)"
                    : "Edit Preferences (Will override previous preferences)"}
                </Button>
              </Link>
              <p className="text-muted-foreground mt-2 text-sm">
                {isOverdue
                  ? "May not receive new preferences if changed because due date has passed"
                  : ""}
              </p>
            </div>
          )}

          {!isSubmitted && (
            <div>
              <div className="flex items-center">
                {isOverdue ? (
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-destructive text-sm font-medium">
                      Overdue by {Math.abs(daysUntilDeadline)} day
                      {Math.abs(daysUntilDeadline) !== 1 ? "s" : ""}
                    </p>
                  </div>
                ) : isUrgent ? (
                  <div className="bg-warning/10 rounded-lg p-3">
                    <p className="text-warning text-sm font-medium">
                      {daysUntilDeadline} day
                      {daysUntilDeadline !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                ) : (
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-primary text-sm font-medium">
                      {daysUntilDeadline} day
                      {daysUntilDeadline !== 1 ? "s" : ""} until deadline
                    </p>
                  </div>
                )}
              </div>
              <Link href="/preferences-form">
                <Button className="mt-2 w-full sm:w-auto" size="lg">
                  {isOverdue
                    ? "Submit Preferences (Overdue)"
                    : "Submit Preferences"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
