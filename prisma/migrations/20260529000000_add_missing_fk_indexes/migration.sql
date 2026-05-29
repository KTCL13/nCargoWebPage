-- AddIndex: job_history.employee_id
CREATE INDEX IF NOT EXISTS "idx_job_history_employee" ON "job_history"("employee_id");

-- AddIndex: attendance_events.attendance_id + timestamp ASC
CREATE INDEX IF NOT EXISTS "idx_attendance_events_attendance" ON "attendance_events"("attendance_id", "timestamp" ASC);

-- AddIndex: user_sessions.employee_id + login_at DESC
CREATE INDEX IF NOT EXISTS "idx_sessions_employee" ON "user_sessions"("employee_id", "login_at" DESC);

-- AddIndex: shipments.locker_id + created_at DESC
CREATE INDEX IF NOT EXISTS "idx_shipments_locker" ON "shipments"("locker_id", "created_at" DESC);

-- AddIndex: shipments.status_id + created_at DESC
CREATE INDEX IF NOT EXISTS "idx_shipments_status_created" ON "shipments"("status_id", "created_at" DESC);

-- AddIndex: employee_alerts.employee_id + created_at DESC
CREATE INDEX IF NOT EXISTS "idx_alerts_employee" ON "employee_alerts"("employee_id", "created_at" DESC);

-- AddIndex: generated_documents.employee_id + created_at DESC
CREATE INDEX IF NOT EXISTS "idx_docs_employee" ON "generated_documents"("employee_id", "created_at" DESC);
