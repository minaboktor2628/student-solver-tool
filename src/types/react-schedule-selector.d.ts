declare module "react-schedule-selector" {
  import type { ComponentType } from "react";

  export interface ScheduleSelectorProps {
    selection?: Date[];
    numDays?: number;
    minTime?: number;
    maxTime?: number;
    hourlyChunks?: number;
    onChange?: (selection: Date[]) => void;
    renderDate?: (date: Date) => React.ReactNode;
    renderTime?: (hour: number) => React.ReactNode;
    selectionColor?: string;
    rowGap?: number | string;
    className?: string;
    style?: React.CSSProperties;
  }

  const ScheduleSelector: ComponentType<ScheduleSelectorProps>;
  export default ScheduleSelector;
}
