"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";
import { EmployeeSearch } from "@/components/ui/EmployeeSearch";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface AttendanceRegistry {
  id: number;
  employeeId: number;
  employee?: Employee;
  status: "OPEN" | "PAUSED" | "CLOSED";
  startedAt: string;
  endedAt: string | null;
  workedHours: number | null;
}

const LIMIT = 10;

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  PAUSED: "En Pausa",
  CLOSED: "Finalizada",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700 border-green-200",
  PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AsistenciaAdminPage() {
  const { token } = useAuth();
  const [registries, setRegistries] = useState<AttendanceRegistry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(LIMIT),
        ...(dateFilter && { date: dateFilter }),
        ...(employeeFilter && { employeeId: employeeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const auth = { Authorization: `Bearer ${token}` };
      const [res, empRes] = await Promise.all([
        fetch(`/api/attendance?${params}`, { headers: auth }),
        fetch("/api/employees?limit=100", { headers: auth }),
      ]);

      const data = await res.json();
      const empsData = await empRes.json();

      const emps = Array.isArray(empsData) ? empsData : (empsData.data ?? []);
      setEmployees(emps);

      const list = (data.data ?? []).map((r: AttendanceRegistry) => ({
        ...r,
        employee: emps.find((e: Employee) => e.id === r.employeeId),
      }));

      setRegistries(list);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [token, page, dateFilter, employeeFilter, statusFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleCloseJourney = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Seguro que deseas cerrar esta jornada manualmente?")) return;
    try {
      const res = await fetch(`/api/attendance/force-close?id=${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAttendance();
      } else {
        const err = await res.json();
        alert(err.message || "Error al cerrar jornada");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const fmtTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  };

  const openJourneys = useMemo(
    () => registries.filter((r) => r.status === "OPEN").length,
    [registries],
  );
  const pageCount = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout
      pageTitle="Control de Asistencia"
      navItems={NAV_ITEMS}
      onReload={fetchAttendance}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">
              Bitácora de Asistencia
            </h1>
            <p className="text-gray-500 text-sm">
              Monitoreo de entradas, salidas y tiempos de trabajo
            </p>
          </div>
          {openJourneys > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-[var(--radius-lg)] px-4 py-2 flex items-center gap-2 animate-pulse">
              <span className="text-red-600 text-sm font-bold">
                🚨 {openJourneys} Jornadas activas sin cerrar
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-[var(--radius-xl)] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
              Fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input w-full"
            />
          </div>
          <div className="flex-[2] min-w-[300px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
              Empleado
            </label>
            <EmployeeSearch
              onSelect={emp => setEmployeeFilter(emp ? String(emp.id) : "")}
              placeholder="Nombre o identificación..."
              className="w-full"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input w-full"
            >
              <option value="">Cualquier estado</option>
              <option value="OPEN">Abierta</option>
              <option value="PAUSED">En Pausa</option>
              <option value="CLOSED">Cerrada</option>
            </select>
          </div>
          <button
            onClick={() => {
              setPage(0);
              fetchAttendance();
            }}
            className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-[var(--radius-lg)] font-bold text-sm hover:opacity-90 transition"
          >
            Filtrar
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500">
                    Empleado
                  </th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500">
                    Entrada
                  </th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500">
                    Salida
                  </th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500">
                    Horas
                  </th>
                  <th className="px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right font-subtitles text-xs uppercase text-gray-500">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      Cargando bitácora...
                    </td>
                  </tr>
                ) : registries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      No hay registros para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  registries.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-[var(--color-foreground)]">
                        {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : `ID: ${r.employeeId}`}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {fmtDate(r.startedAt)}
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-700">
                        {fmtTime(r.startedAt)}
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-700">
                        {fmtTime(r.endedAt)}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {Number(r.workedHours || 0).toFixed(2)}h
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[r.status]}`}
                        >
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {r.status !== "CLOSED" && (
                          <button
                            onClick={() => handleCloseJourney(r.id)}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Cerrar manualmente
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-subtitles">
              Total de registros: {total}
            </p>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
