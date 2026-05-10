-- Deduplicate any existing conflicting rows before adding the constraint.
-- For each (identification_type_id, identification_number) group with more than one employee,
-- keep only the one with the lowest id and mark the rest as INACTIVE with a mangled number
-- so the unique index can be applied cleanly.
DO $$
DECLARE
  rec RECORD;
  dup_id INT;
  counter INT;
BEGIN
  FOR rec IN
    SELECT identification_type_id, identification_number
    FROM employees
    GROUP BY identification_type_id, identification_number
    HAVING COUNT(*) > 1
  LOOP
    counter := 0;
    FOR dup_id IN
      SELECT id FROM employees
      WHERE identification_type_id = rec.identification_type_id
        AND identification_number  = rec.identification_number
      ORDER BY id ASC
      OFFSET 1  -- keep the first (lowest id), rename the rest
    LOOP
      counter := counter + 1;
      UPDATE employees
      SET identification_number = identification_number || '_dup_' || dup_id::text,
          status = 'INACTIVE'
      WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Add the composite unique index
CREATE UNIQUE INDEX "uq_employee_identification"
  ON "employees" ("identification_type_id", "identification_number");
