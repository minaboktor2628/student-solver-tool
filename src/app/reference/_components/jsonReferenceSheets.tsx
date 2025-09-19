"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AllocationWithoutAssistantsSchema,
  AssistantSchema,
  AllocationSchema,
} from "@/types/excel";
import { json } from "stream/consumers";

const allocationsRefInfo = [
  {
    jsonKey: "Academic Period",
    description:
      AllocationWithoutAssistantsSchema.shape["Academic Period"].description,
    format: "Year + Season + Term",
    example: "2025 Fall A Term",
    type: "String",
  },
  {
    jsonKey: "Section",
    description: AllocationWithoutAssistantsSchema.shape.Section.description,
    format: "{ Course: String, Subsection: String, Title: String }",
    example: `{ "Course": "CS 1005", "Subsection": "AL01", "Title": "Introduction to Program Design" }`,
    type: "Object",
  },
  {
    jsonKey: "CrossListed",
    description:
      AllocationWithoutAssistantsSchema.shape.CrossListed.description,
    format: "true | false",
    example: "false",
    type: "Boolean",
  },
  {
    jsonKey: "Meeting Pattern(s)",
    description:
      AllocationWithoutAssistantsSchema.shape["Meeting Pattern(s)"].description,
    format: "Days | Start Time - End Time",
    example: "M-T-R-F | 10:00 AM - 10:50 AM",
    type: "String",
  },
  {
    jsonKey: "Instructors",
    description:
      AllocationWithoutAssistantsSchema.shape.Instructors.description,
    format: "Instructor Name(s)",
    example: "Joseph Quinn",
    type: "String",
  },
  {
    jsonKey: "Reserved Cap",
    description:
      AllocationWithoutAssistantsSchema.shape["Reserved Cap"].description,
    format: "Integer",
    example: "2",
    type: "Integer",
  },
  {
    jsonKey: "Cap Breakdown",
    description:
      AllocationWithoutAssistantsSchema.shape["Cap Breakdown"].description,
    format: "Object | null",
    example:
      "80 - reserved for Student Records - Student is a First Year for 2025-2026 or Mass Academy until 08/11/2025",
    type: "Object | Null",
  },
  {
    jsonKey: "Section Cap",
    description:
      AllocationWithoutAssistantsSchema.shape["Section Cap"].description,
    format: "Integer",
    example: "30",
    type: "Integer",
  },
  {
    jsonKey: "Enrollment",
    description: AllocationWithoutAssistantsSchema.shape.Enrollment.description,
    format: "Integer",
    example: "19",
    type: "Integer",
  },
  {
    jsonKey: "Waitlist Count",
    description:
      AllocationWithoutAssistantsSchema.shape["Waitlist Count"].description,
    format: "Integer",
    example: "0",
    type: "Integer",
  },
  {
    jsonKey: "Student Hour Allocation",
    description:
      AllocationWithoutAssistantsSchema.shape["Student Hour Allocation"]
        .description,
    format: "{ Calculated: Integer, MOEOver: Integer, MOEShort: Integer }",
    example: `{ "Calculated": 10, "MOEOver": 10, "MOEShort": 5 }`,
    type: "Object",
  },
  {
    jsonKey: "TAs",
    description: AllocationSchema.shape.TAs.description,
    format:
      "Array of { First: String, Last: String, Email: String, Locked: Boolean, Hours: Integer }",
    example:
      '[{ "First": "Peter", "Last": "Griffin", "Email": pgriffin@wpi.edu"}]',
    type: "Array",
  },
  {
    jsonKey: "PLAs",
    description: AllocationSchema.shape.PLAs.description,
    format:
      "Array of { First: String, Last: String, Email: String, Locked: Boolean, Hours: Integer }",
    example:
      '[{ "First": "Peter", "Last": "Griffin", "Email": pgriffin@wpi.edu}]',
    type: "Array",
  },
  {
    jsonKey: "GLAs",
    description: AllocationSchema.shape.GLAs.description,
    format:
      "Array of { First: String, Last: String, Email: String, Locked: Boolean, Hours: Integer }",
    example:
      '[{ "First": "Peter", "Last": "Griffin", "Email": pgriffin@wpi.edu}]',
    type: "Array",
  },
];

export function AllocationsReference() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Example</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allocationsRefInfo.map((sheet) => (
          <TableRow key={sheet.jsonKey}>
            <TableCell>{sheet.jsonKey}</TableCell>
            <TableCell className="whitespace-normal">
              {sheet.description}
            </TableCell>
            <TableCell>{sheet.format}</TableCell>
            <TableCell className="whitespace-normal">{sheet.example}</TableCell>
            <TableCell>{sheet.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const plaPrefRef = [
  {
    jsonKey: "First",
    description: AssistantSchema.shape.First.description,
    format: "String",
    example: "Peter",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: AssistantSchema.shape.Last.description,
    format: "String",
    example: "Griffin",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: AssistantSchema.shape.Email.description,
    format: "String",
    example: "pgriffin@wpi.edu",
    type: "String",
  },
  {
    jsonKey: "Comments",
    description:
      "Additional notes provided by the PLA, often about course preferences or past instructors.",
    format: "String",
    example: `"3043 (I'd like to work with Professor Reeds again) > 3013 > 1005"`,
    type: "String",
  },
  {
    jsonKey: "Available",
    description: "Indicates whether the PLA is available during the term.",
    format: "Boolean",
    example: "true",
    type: "Boolean",
  },
  {
    jsonKey: "Class Name",
    description:
      "Each course code is listed as its own type, with a Boolean indicating if the PLA is available for that course.",
    format: "Course Code: Boolean",
    example: `"CS 1005": true`,
    type: "Boolean",
  },
  {
    jsonKey: "Time Slot",
    description:
      "Each available time slot is listed as its own type, with a Boolean indicating the PLAs availability.",
    format: "Time Range: Boolean",
    example: `"T-F 3:00 PM - 4:50 PM": true`,
    type: "Boolean",
  },
];

export function PlaPreferenceReference() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Example</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plaPrefRef.map((sheet) => (
          <TableRow key={sheet.jsonKey}>
            <TableCell>{sheet.jsonKey}</TableCell>
            <TableCell className="whitespace-normal">
              {sheet.description}
            </TableCell>
            <TableCell>{sheet.format}</TableCell>
            <TableCell className="whitespace-normal">{sheet.example}</TableCell>
            <TableCell>{sheet.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const taPrefRef = [
  {
    jsonKey: "First",
    description: AssistantSchema.shape.First.description,
    format: "String",
    example: "Peter",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: AssistantSchema.shape.Last.description,
    format: "String",
    example: "Griffin",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: AssistantSchema.shape.Email.description,
    format: "String",
    example: "pgriffin@wpi.edu",
    type: "String",
  },
  {
    jsonKey: "Comments",
    description:
      "Additional notes provided by the TA, often about course preferences or past instructors.",
    format: "String",
    example: `"3043 (I'd like to work with Professor Reeds again) > 3013 > 1005"`,
    type: "String",
  },
  {
    jsonKey: "Available",
    description: "Indicates whether the TA is available for the term.",
    format: "Boolean",
    example: "true",
    type: "Boolean",
  },
  {
    jsonKey: "Class Name",
    description:
      "Each course code is listed as its own type, with a Boolean indicating if the TA is available for that course.",
    format: "Course Code: Boolean",
    example: `"CS 1005": true`,
    type: "Boolean",
  },
  {
    jsonKey: "Time Slot",
    description:
      "Each available time slot is listed as its own type, with a Boolean indicating the TAs availability.",
    format: "Time Range: Boolean",
    example: `"T-F 3:00 PM - 4:50 PM": true`,
    type: "Boolean",
  },
];

export function TaPreferenceReference() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Example</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {taPrefRef.map((sheet) => (
          <TableRow key={sheet.jsonKey}>
            <TableCell>{sheet.jsonKey}</TableCell>
            <TableCell className="whitespace-normal">
              {sheet.description}
            </TableCell>
            <TableCell>{sheet.format}</TableCell>
            <TableCell className="whitespace-normal">{sheet.example}</TableCell>
            <TableCell>{sheet.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
