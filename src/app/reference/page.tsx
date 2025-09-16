import React from "react";
import { ReferenceTable } from "@/app/reference/_components/referenceTable";
import { connection } from "next/server";

export default async function ParentReferencePage() {
  await connection(); // Ensure the client connection is established
  return <ReferenceTable />;
}
