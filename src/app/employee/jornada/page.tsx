'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useJornada } from '@/lib/employee/jornada/useJornada'
import { AttendanceKpis } from '@/components/employee/jornada/AttendanceKpis'
import { TimerRing } from '@/components/employee/jornada/TimerRing'
import { ControlPanel } from '@/components/employee/jornada/ControlPanel'

export default function JornadaPage() {
  const {
    employeeId, attendance, timerState, elapsed, pauseCount, loading, errorMsg,
    tasks, selectedTaskId, setSelectedTaskId, taskLoading, loadToday,
    handleCompleteTask, handleStart, handlePause, handleResume, handleStop,
    hoursToday, sessionStart, stateLabel, progress
  } = useJornada()

  if (!employeeId) {
    return (
      <DashboardLayout pageTitle="Jornada laboral" navItems={NAV_ITEMS} onReload={() => loadToday()}>
        <div className="text-center py-16 text-[var(--color-nc-dark)]/40 font-subtitles">Verificando sesión…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      pageTitle="Jornada laboral"
      navItems={NAV_ITEMS}
      onReload={() => loadToday()}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
        Jornada laboral
      </h2>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-subtitles text-red-700">
          {errorMsg}
        </div>
      )}

      <AttendanceKpis
        hoursToday={hoursToday}
        attendance={attendance}
        pauseCount={pauseCount}
        stateLabel={stateLabel}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <TimerRing
          elapsed={elapsed}
          progress={progress}
          stateLabel={stateLabel}
          timerState={timerState}
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          setSelectedTaskId={setSelectedTaskId}
          onCompleteTask={handleCompleteTask}
          taskLoading={taskLoading}
        />

        <ControlPanel
          timerState={timerState}
          loading={loading}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          sessionStart={sessionStart}
          pauseCount={pauseCount}
          stateLabel={stateLabel}
        />
      </div>
    </DashboardLayout>
  )
}
