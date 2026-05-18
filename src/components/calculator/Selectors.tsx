import { PROVINCES } from "@/data/provinces";
import { SOURCES } from "@/data/sources";
import { Field, Input, Select } from "@/components/ui/Field";

export function SourceSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.values(SOURCES).map((s) => (
          <option key={s.key} value={s.key}>
            {s.name} — {s.type}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function ProvinceSelect({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <Field label={label}>
      <Select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      >
        {PROVINCES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.region}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function NumberField({
  value,
  onChange,
  label,
  min = 0.01,
  step = 0.01,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </Field>
  );
}

export { Field, Input, Select };
