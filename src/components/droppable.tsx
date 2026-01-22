"use client";
import { useDroppable } from "@dnd-kit/core";

export function Droppable({
  children,
  id,
  data,
  ...props
}: React.ComponentProps<"div"> & {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
}) {
  const { setNodeRef } = useDroppable({ id, data });

  return (
    <div ref={setNodeRef} {...props}>
      {children}
    </div>
  );
}
