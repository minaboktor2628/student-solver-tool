"use client"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/* Example format
const allocationsRefInfo = [
    {
        jsonKey: "",
        description: "",
        format: "",
        example: "",
        type: "",
    },
]

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
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
*/

const allocationsRefInfo = [
  {
    jsonKey: "Academic Period",
    description: "The year and academic term during which the course takes place.",
    format: "Year + Season + Term",
    example: "2025 Fall A Term",
    type: "String",
  },
  {
    jsonKey: "Section",
    description: "Identifies the specific course and subsection code.",
    format: "{ Course: String, Subsection: String }",
    example: `{ "Course": "CS 1005", "Subsection": "AL01" }`,
    type: "Object",
  },
  {
    jsonKey: "CrossListed",
    description: "Indicates whether the course is cross-listed under multiple course codes.",
    format: "true | false",
    example: "false",
    type: "Boolean",
  },
  {
    jsonKey: "Meeting Pattern(s)",
    description: "The scheduled meeting days and times for the course.",
    format: "Days | Start Time - End Time",
    example: "M-T-R-F | 10:00 AM - 10:50 AM",
    type: "String",
  },
  {
    jsonKey: "Instructors",
    description: "The instructor(s) teaching the course.",
    format: "Instructor Name(s)",
    example: "Joseph Quinn",
    type: "String",
  },
  {
    jsonKey: "Reserved Cap",
    description: "The number of reserved seats set aside for certain students",
    format: "Integer",
    example: "0",
    type: "Integer",
  },
  {
    jsonKey: "Cap Breakdown",
    description: "Breakdown of reserved seats by group, if applicable. Null if not specified.",
    format: "Object | null",
    example: "80 - reserved for Student Records - Student is a First Year for 2025-2026 or Mass Academy until 08/11/2025",
    type: "Object | Null",
  },
  {
    jsonKey: "Section Cap",
    description: "The maximum number of students allowed to enroll in the section.",
    format: "Integer",
    example: "30",
    type: "Integer",
  },
  {
    jsonKey: "Enrollment",
    description: "The current number of students enrolled in the section.",
    format: "Integer",
    example: "19",
    type: "Integer",
  },
  {
    jsonKey: "Waitlist Count",
    description: "The number of students currently on the waitlist for the section.",
    format: "Integer",
    example: "0",
    type: "Integer",
  },
  {
    jsonKey: "Student Hour Allocation",
    description: "Represents allocated student hours, including calculated values and margin of error.",
    format: "{ Calculated: Integer, MOE: Integer }",
    example: `{ "Calculated": 10, "MOE": 10 }`,
    type: "Object",
  },
]

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
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const assignmentsRefInfo = [
  {
    jsonKey: "Academic Period",
    description: "The year and academic term during which the course takes place.",
    format: "Year + Season + Term",
    example: "2025 Fall A Term",
    type: "String",
  },
  {
    jsonKey: "Section",
    description: "Identifies the specific course and subsection code.",
    format: "{ Course: String, Subsection: String }",
    example: `{ "Course": "CS 1005", "Subsection": "AL01" }`,
    type: "Object",
  },
  {
    jsonKey: "CrossListed",
    description: "Indicates whether the course is cross-listed under multiple course codes.",
    format: "true | false",
    example: "false",
    type: "Boolean",
  },
  {
    jsonKey: "Meeting Pattern(s)",
    description: "The scheduled meeting days and times for the course.",
    format: "Days | Start Time - End Time",
    example: "M-T-R-F | 10:00 AM - 10:50 AM",
    type: "String",
  },
  {
    jsonKey: "Instructors",
    description: "The instructor(s) teaching the course.",
    format: "Instructor Name(s)",
    example: "Tom Holland",
    type: "String",
  },
  {
    jsonKey: "Reserved Cap",
    description: "The number of reserved seats set aside for certain students",
    format: "Integer",
    example: "0",
    type: "Integer",
  },
  {
    jsonKey: "Cap Breakdown",
    description: "Breakdown of reserved seats by group, if applicable. Null if not specified.",
    format: "Object | null",
    example: "80 - reserved for Student Records - Student is a First Year for 2025-2026 or Mass Academy until 08/11/2025",
    type: "Object | Null",
  },
  {
    jsonKey: "Section Cap",
    description: "The maximum number of students allowed to enroll in the section.",
    format: "Integer",
    example: "30",
    type: "Integer",
  },
  {
    jsonKey: "Enrollment",
    description: "The current number of students enrolled in the section.",
    format: "Integer",
    example: "18",
    type: "Integer",
  },
  {
    jsonKey: "Waitlist Count",
    description: "The number of students currently on the waitlist for the section.",
    format: "Integer",
    example: "0",
    type: "Integer",
  },
  {
    jsonKey: "TAs",
    description: "List of Teaching Assistants assigned to the course section. Each entry contains their info and hours.",
    format: "Array of { First: String, Last: String, Locked: Boolean, Hours: Number }",
    example: `[{"First": "Pedro", "Last": "Pascal", "Locked": false, "Hours": 10}]`,
    type: "Array",
  },
  {
    jsonKey: "PLAs",
    description: "List of Peer Learning Assistants assigned to the course section. Each entry contains their info and hours.",
    format: "Array of { First: String, Last: String, Locked: Boolean, Hours: Number }",
    example: `[{"First": "Pedro", "Last": "Pascal", "Locked": false, "Hours": 10}]`,
    type: "Array",
  },
  {
    jsonKey: "GLAs",
    description: "List of Graduate Learning Assistants assigned to the course section. Each entry contains their info and hours.",
    format: "Array of { First: String, Last: String, Locked: Boolean, Hours: Number }",
    example: `[{"First": "Pedro", "Last": "Pascal", "Locked": false, "Hours": 10}]`,
    type: "Array",
  },
]

export function AssignmentsReference() {
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
                {assignmentsRefInfo.map((sheet) => (
                    <TableRow key={sheet.jsonKey}>
                        <TableCell>{sheet.jsonKey}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const taRefInfo = [
  {
    jsonKey: "First",
    description: "The first name of the Teaching Assistant.",
    format: "String",
    example: "Albert",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: "The last name of the Teaching Assistant.",
    format: "String",
    example: "Einstein",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: "The email address of the Teaching Assistant.",
    format: "String",
    example: "aeinstein@wpi.edu",
    type: "String",
  },
]

export function TaReference() {
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
                {taRefInfo.map((sheet) => (
                    <TableRow key={sheet.jsonKey}>
                        <TableCell>{sheet.jsonKey}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const plaRefInfo = [
  {
    jsonKey: "First",
    description: "The first name of the Peer Learning Assistant.",
    format: "String",
    example: "Marie",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: "The last name of the Peer Learning Assistant.",
    format: "String",
    example: "Curie",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: "The email address of the Peer Learning Assistant.",
    format: "String",
    example: "mcurie@wpi.edu",
    type: "String",
  },
]

export function PlaReference() {
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
                {plaRefInfo.map((sheet) => (
                    <TableRow key={sheet.jsonKey}>
                        <TableCell>{sheet.jsonKey}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const glaRefInfo = [
  {
    jsonKey: "First",
    description: "The first name of the Graduate Learning Assistant.",
    format: "String",
    example: "Isaac",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: "The last name of the Graduate Learning Assistant.",
    format: "String",
    example: "Newton",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: "The email address of the Graduate Learning Assistant.",
    format: "String",
    example: "inewton@wpi.edu",
    type: "String",
  },
]

export function GlaReference() {
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
                {glaRefInfo.map((sheet) => (
                    <TableRow key={sheet.jsonKey}>
                        <TableCell>{sheet.jsonKey}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const plaPrefRef = [
  {
    jsonKey: "First",
    description: "The first name of the Peer Learning Assistant.",
    format: "String",
    example: "Peter",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: "The last name of the Peer Learning Assistant.",
    format: "String",
    example: "Griffin",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: "The email address of the Peer Learning Assistant.",
    format: "String",
    example: "pgriffin@wpi.edu",
    type: "String",
  },
  {
    jsonKey: "Comments",
    description: "Additional notes provided by the PLA, often about course preferences or past instructors.",
    format: "String",
    example: `"3043 (I'd like to work with Professor Reeds again) > 3013 > 1005"`,
    type: "String",
  },
  {
    jsonKey: "Available A Term? (Y/N)",
    description: "Indicates whether the PLA is available during A Term.",
    format: "Boolean",
    example: "true",
    type: "Boolean",
  },
  {
    jsonKey: "Class Name",
    description: "Each course code is listed as a key, with a Boolean indicating if the PLA is available for that course.",
    format: "Course Code: Boolean",
    example: `"CS 1005": true`,
    type: "Object (keys as course codes, values as Boolean)",
  },
  {
    jsonKey: "Time Slot",
    description: "Each available time slot is listed as a key, with a Boolean indicating the PLAs availability.",
    format: "Time Range: Boolean",
    example: `"T-F 3:00 PM - 4:50 PM": true`,
    type: "Object (keys as time ranges, values as Boolean)",
  },
]

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
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const taPrefRef = [
  {
    jsonKey: "First",
    description: "The first name of the Teaching Assistant.",
    format: "String",
    example: "Peter",
    type: "String",
  },
  {
    jsonKey: "Last",
    description: "The last name of the Teaching Assistant.",
    format: "String",
    example: "Griffin",
    type: "String",
  },
  {
    jsonKey: "Email",
    description: "The email address of the Teaching Assistant.",
    format: "String",
    example: "pgriffin@wpi.edu",
    type: "String",
  },
  {
    jsonKey: "Comments",
    description: "Additional notes provided by the TA, often about course preferences or past instructors.",
    format: "String",
    example: `"3043 (I'd like to work with Professor Reeds again) > 3013 > 1005"`,
    type: "String",
  },
  {
    jsonKey: "Available A Term? (Y/N)",
    description: "Indicates whether the TA is available during A Term.",
    format: "Boolean",
    example: "true",
    type: "Boolean",
  },
  {
    jsonKey: "Class Name",
    description: "Each course code is listed as a key, with a Boolean indicating if the TA is available for that course.",
    format: "Course Code: Boolean",
    example: `"CS 1005": true`,
    type: "Object (keys as course codes, values as Boolean)",
  },
  {
    jsonKey: "Time Slot",
    description: "Each available time slot is listed as a key, with a Boolean indicating the TAs availability.",
    format: "Time Range: Boolean",
    example: `"T-F 3:00 PM - 4:50 PM": true`,
    type: "Object (keys as time ranges, values as Boolean)",
  },
]

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
                        <TableCell className="whitespace-normal">{sheet.description}</TableCell>
                        <TableCell>{sheet.format}</TableCell>
                        <TableCell className="whitespace-normal">{sheet.example}</TableCell>
                        <TableCell>{sheet.type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}