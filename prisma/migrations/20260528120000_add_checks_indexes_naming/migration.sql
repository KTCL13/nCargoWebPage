-- =============================================================================
-- Migration: add_checks_indexes_naming
-- 1. CHECK constraints on bounded numeric columns
-- 2. Composite secondary indexes on high-frequency filter patterns
-- 3. Schema-level comment documenting naming convention boundary
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1 – CHECK CONSTRAINTS
-- All constraints are added NOT VALID first (no full-table lock on existing
-- rows), then validated with a lighter ShareUpdateExclusiveLock.
-- ---------------------------------------------------------------------------

-- contracts: salary and hourly_rate must be positive when present
ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_salary_positive
    CHECK (salary IS NULL OR salary > 0) NOT VALID;
ALTER TABLE contracts VALIDATE CONSTRAINT chk_contracts_salary_positive;

ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_hourly_rate_positive
    CHECK (hourly_rate IS NULL OR hourly_rate > 0) NOT VALID;
ALTER TABLE contracts VALIDATE CONSTRAINT chk_contracts_hourly_rate_positive;

-- quotations: physical quantities and monetary values
ALTER TABLE quotations
  ADD CONSTRAINT chk_quotations_weight_positive
    CHECK (weight_lbs > 0) NOT VALID;
ALTER TABLE quotations VALIDATE CONSTRAINT chk_quotations_weight_positive;

ALTER TABLE quotations
  ADD CONSTRAINT chk_quotations_declared_value_nn
    CHECK (declared_value >= 0) NOT VALID;
ALTER TABLE quotations VALIDATE CONSTRAINT chk_quotations_declared_value_nn;

ALTER TABLE quotations
  ADD CONSTRAINT chk_quotations_total_price_nn
    CHECK (total_price >= 0) NOT VALID;
ALTER TABLE quotations VALIDATE CONSTRAINT chk_quotations_total_price_nn;

ALTER TABLE quotations
  ADD CONSTRAINT chk_quotations_pickup_distance_nn
    CHECK (pickup_distance_miles IS NULL OR pickup_distance_miles >= 0) NOT VALID;
ALTER TABLE quotations VALIDATE CONSTRAINT chk_quotations_pickup_distance_nn;

-- cotizacion_records: package dimensions, weights, and all cost components
ALTER TABLE cotizacion_records
  ADD CONSTRAINT chk_cr_dimensions_positive
    CHECK (height_in > 0 AND width_in > 0 AND length_in > 0) NOT VALID;
ALTER TABLE cotizacion_records VALIDATE CONSTRAINT chk_cr_dimensions_positive;

ALTER TABLE cotizacion_records
  ADD CONSTRAINT chk_cr_weights_positive
    CHECK (actual_weight_lb > 0 AND volumetric_weight_lb >= 0 AND chargeable_weight_lb > 0) NOT VALID;
ALTER TABLE cotizacion_records VALIDATE CONSTRAINT chk_cr_weights_positive;

ALTER TABLE cotizacion_records
  ADD CONSTRAINT chk_cr_costs_nn
    CHECK (
      declared_value_usd >= 0 AND
      transport          >= 0 AND
      insurance          >= 0 AND
      customs            >= 0 AND
      city_delivery      >= 0 AND
      pickup             >= 0 AND
      total              >= 0
    ) NOT VALID;
ALTER TABLE cotizacion_records VALIDATE CONSTRAINT chk_cr_costs_nn;

ALTER TABLE cotizacion_records
  ADD CONSTRAINT chk_cr_pickup_miles_nn
    CHECK (pickup_miles IS NULL OR pickup_miles >= 0) NOT VALID;
ALTER TABLE cotizacion_records VALIDATE CONSTRAINT chk_cr_pickup_miles_nn;

-- shipping_rates: price must be positive
ALTER TABLE shipping_rates
  ADD CONSTRAINT chk_shipping_rates_price_positive
    CHECK (price > 0) NOT VALID;
ALTER TABLE shipping_rates VALIDATE CONSTRAINT chk_shipping_rates_price_positive;

-- shipments: weight when present must be positive
ALTER TABLE shipments
  ADD CONSTRAINT chk_shipments_weight_positive
    CHECK (weight_lbs IS NULL OR weight_lbs > 0) NOT VALID;
ALTER TABLE shipments VALIDATE CONSTRAINT chk_shipments_weight_positive;

-- attendance: worked hours are non-negative when present
ALTER TABLE attendance
  ADD CONSTRAINT chk_attendance_worked_hours_nn
    CHECK (worked_hours IS NULL OR worked_hours >= 0) NOT VALID;
ALTER TABLE attendance VALIDATE CONSTRAINT chk_attendance_worked_hours_nn;

-- offices: geographic coordinates and coverage radius
ALTER TABLE offices
  ADD CONSTRAINT chk_offices_latitude_range
    CHECK (latitude BETWEEN -90 AND 90) NOT VALID;
ALTER TABLE offices VALIDATE CONSTRAINT chk_offices_latitude_range;

ALTER TABLE offices
  ADD CONSTRAINT chk_offices_longitude_range
    CHECK (longitude BETWEEN -180 AND 180) NOT VALID;
ALTER TABLE offices VALIDATE CONSTRAINT chk_offices_longitude_range;

ALTER TABLE offices
  ADD CONSTRAINT chk_offices_radius_positive
    CHECK (coverage_radius_miles IS NULL OR coverage_radius_miles > 0) NOT VALID;
ALTER TABLE offices VALIDATE CONSTRAINT chk_offices_radius_positive;

-- employee_kpis: counts, time, and score bounds
ALTER TABLE employee_kpis
  ADD CONSTRAINT chk_kpis_counts_nn
    CHECK (tasks_completed >= 0 AND tasks_pending >= 0) NOT VALID;
ALTER TABLE employee_kpis VALIDATE CONSTRAINT chk_kpis_counts_nn;

ALTER TABLE employee_kpis
  ADD CONSTRAINT chk_kpis_time_nn
    CHECK (avg_task_time_minutes IS NULL OR avg_task_time_minutes >= 0) NOT VALID;
ALTER TABLE employee_kpis VALIDATE CONSTRAINT chk_kpis_time_nn;

ALTER TABLE employee_kpis
  ADD CONSTRAINT chk_kpis_worked_hours_nn
    CHECK (total_worked_hours IS NULL OR total_worked_hours >= 0) NOT VALID;
ALTER TABLE employee_kpis VALIDATE CONSTRAINT chk_kpis_worked_hours_nn;

ALTER TABLE employee_kpis
  ADD CONSTRAINT chk_kpis_productivity_score_range
    CHECK (productivity_score IS NULL OR (productivity_score >= 0 AND productivity_score <= 100)) NOT VALID;
ALTER TABLE employee_kpis VALIDATE CONSTRAINT chk_kpis_productivity_score_range;

-- task_analytics: duration must be non-negative when present
ALTER TABLE task_analytics
  ADD CONSTRAINT chk_task_analytics_duration_nn
    CHECK (duration_minutes IS NULL OR duration_minutes >= 0) NOT VALID;
ALTER TABLE task_analytics VALIDATE CONSTRAINT chk_task_analytics_duration_nn;

-- workload_snapshots: task counts and score bounds
ALTER TABLE workload_snapshots
  ADD CONSTRAINT chk_workload_tasks_nn
    CHECK (active_tasks >= 0 AND completed_tasks >= 0) NOT VALID;
ALTER TABLE workload_snapshots VALIDATE CONSTRAINT chk_workload_tasks_nn;

ALTER TABLE workload_snapshots
  ADD CONSTRAINT chk_workload_score_range
    CHECK (workload_score IS NULL OR (workload_score >= 0 AND workload_score <= 100)) NOT VALID;
ALTER TABLE workload_snapshots VALIDATE CONSTRAINT chk_workload_score_range;

-- ---------------------------------------------------------------------------
-- SECTION 2 – COMPOSITE INDEXES
-- ---------------------------------------------------------------------------

-- attendance: employee history (ordered) + open-session lookup
CREATE INDEX IF NOT EXISTS idx_attendance_employee_started
  ON attendance(employee_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_status
  ON attendance(employee_id, status);

-- tasks: employee inbox + status filter + due-soon cron
CREATE INDEX IF NOT EXISTS idx_tasks_employee_created
  ON tasks(employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_employee_status
  ON tasks(employee_id, status_id);

-- Partial index: only tasks that have a deadline — used by the due-soon cron
CREATE INDEX IF NOT EXISTS idx_tasks_status_endtime
  ON tasks(status_id, end_time)
  WHERE end_time IS NOT NULL;

-- notifications: unread badge + inbox fetch
CREATE INDEX IF NOT EXISTS idx_notifications_employee_read
  ON notifications(employee_id, read, created_at DESC);

-- cotizacion_records: replace two single-column indexes with composites
-- (previous schema had @@index([source]) and @@index([createdAt]) separately)
DROP INDEX IF EXISTS "cotizacion_records_source_idx";
DROP INDEX IF EXISTS "cotizacion_records_created_at_idx";

CREATE INDEX IF NOT EXISTS idx_cotizacion_source_created
  ON cotizacion_records(source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizacion_employee_created
  ON cotizacion_records(employee_id, created_at DESC);

-- audit_logs: entity audit trail + user activity stream
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_performer
  ON audit_logs(performed_by, created_at DESC);

-- shipment_events: event stream per shipment
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment
  ON shipment_events(shipment_id, created_at DESC);

-- contracts: active-contract lookup (most common join in employee queries)
CREATE INDEX IF NOT EXISTS idx_contracts_employee_active
  ON contracts(employee_id, is_active);

-- quotations: employee quotation history
CREATE INDEX IF NOT EXISTS idx_quotations_employee_created
  ON quotations(employee_id, created_at DESC);

-- password_reset_tokens: token validity check per employee
CREATE INDEX IF NOT EXISTS idx_prt_employee_expires
  ON password_reset_tokens(employee_id, expires_at DESC);

-- ---------------------------------------------------------------------------
-- SECTION 3 – NAMING CONVENTION DOCUMENTATION
-- The public schema uses snake_case throughout (enforced by Prisma @map()
-- directives on every multi-word field and @@map() on every table).
-- The neon_auth schema is managed externally by Neon Auth and uses camelCase
-- column names (userId, createdAt, etc.). This mismatch is a known boundary
-- (OB-10): the neon_auth schema is read-only from our side; no renaming is
-- possible or needed in that schema.
-- ---------------------------------------------------------------------------
COMMENT ON SCHEMA public IS
  'Application schema. Column and table names follow snake_case convention. '
  'neon_auth schema is owned by Neon Auth (external) and uses camelCase — '
  'treat as a read-only integration boundary (OB-10).';
