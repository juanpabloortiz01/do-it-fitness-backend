-- Ejecuta esto en el SQL Editor de Supabase
-- Panel: https://app.supabase.com → Tu proyecto → SQL Editor

CREATE TABLE pending_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_preference_id  TEXT NOT NULL,
  mp_payment_id     TEXT,
  nombre            TEXT NOT NULL,
  email             TEXT NOT NULL,
  celular           TEXT NOT NULL,
  fecha_nacimiento  TEXT NOT NULL,
  plan              TEXT NOT NULL,
  valor             NUMERIC NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_pending_preference ON pending_payments(mp_preference_id);
CREATE INDEX idx_pending_payment    ON pending_payments(mp_payment_id);
CREATE INDEX idx_pending_email      ON pending_payments(email);
CREATE INDEX idx_pending_status     ON pending_payments(status);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pending_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
