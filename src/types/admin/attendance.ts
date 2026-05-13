export interface AttendanceEmployee {
  id: number;
  firstName: string;
  lastName: string;
}

export interface AttendanceRegistry {
  id: number;
  employeeId: number;
  employee?: AttendanceEmployee;
  status: "OPEN" | "PAUSED" | "CLOSED";
  startedAt: string;
  endedAt: string | null;
  workedHours: number | null;
}

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  PAUSED: "En Pausa",
  CLOSED: "Finalizada",
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700 border-green-200",
  PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-100 text-gray-500 border-gray-200",
};
