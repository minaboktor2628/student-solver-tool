"use client";

import { useMemo } from "react";
import { Studio } from "@prisma/studio-core/ui";
import { createSQLiteAdapter } from "@prisma/studio-core/data/sqlite-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";

export default function EmbeddedPrismaStudioPage() {
  const adapter = useMemo(() => {
    const executor = createStudioBFFClient({
      url: "/api/studio",
    });

    return createSQLiteAdapter({ executor });
  }, []);

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <Studio adapter={adapter} />
    </main>
  );
}
