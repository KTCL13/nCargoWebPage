-- Seed default quotation shipping rates into system_config.
-- Using INSERT ... ON CONFLICT DO NOTHING so existing overrides are preserved.

INSERT INTO system_config (key, value, description, updated_at) VALUES
  (
    'quotation_volumetric_divisor',
    '153'::jsonb,
    'Divisor volumétrico para cotizaciones internas (in³ → lb)',
    NOW()
  ),
  (
    'quotation_insurance_rate',
    '0.10'::jsonb,
    'Tasa de seguro para cotizaciones internas (10 %)',
    NOW()
  ),
  (
    'quotation_brackets',
    '[{"minLb":1,"maxLb":14,"type":"FIXED","fixed":36,"perLb":null},{"minLb":15,"maxLb":70,"type":"PER_LB","fixed":null,"perLb":2.95},{"minLb":71,"maxLb":110,"type":"PER_LB","fixed":null,"perLb":3.15}]'::jsonb,
    'Tramos de tarifa para cotizaciones internas',
    NOW()
  )
ON CONFLICT (key) DO NOTHING;
