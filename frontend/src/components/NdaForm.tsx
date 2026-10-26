"use client";

import { useId, useState, type ReactNode } from "react";
import type { NdaData, Party } from "@/lib/nda";

interface NdaFormProps {
  data: NdaData;
  onChange: (data: NdaData) => void;
}

const inputClass =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-100 disabled:text-stone-400";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <legend className="px-1 text-xs font-semibold tracking-wider text-stone-500 uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

interface TextFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

function TextField({ label, hint, value, onChange, multiline }: TextFieldProps) {
  const id = useId();
  const props = {
    id,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    className: `${inputClass} w-full`,
    "aria-describedby": hint ? `${id}-hint` : undefined,
  };
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-stone-800">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-stone-500">
          {hint}
        </p>
      )}
      <div className="mt-1">{multiline ? <textarea rows={3} {...props} /> : <input {...props} />}</div>
    </div>
  );
}

function PartyFields({ title, party, onChange }: { title: string; party: Party; onChange: (party: Party) => void }) {
  const field = (key: keyof Party) => ({ value: party[key], onChange: (value: string) => onChange({ ...party, [key]: value }) });
  return (
    <Section title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Company" {...field("company")} />
        <TextField label="Signer name" {...field("name")} />
        <TextField label="Title" {...field("title")} />
        <TextField label="Notice address" hint="Email or postal address" {...field("noticeAddress")} />
      </div>
    </Section>
  );
}

/** Whole number of years (1–99); the field may be emptied while typing without resetting it. */
function YearsInput({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (years: number) => void }) {
  const [text, setText] = useState(String(value));
  return (
    <input
      type="number"
      min={1}
      max={99}
      value={text}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => {
        setText(e.target.value);
        const years = Number(e.target.value);
        if (Number.isInteger(years) && years >= 1 && years <= 99) onChange(years);
      }}
      onBlur={() => setText(String(value))}
      className={`${inputClass} w-20`}
    />
  );
}

interface TermChoiceProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  yearsOption: { value: T; label: string };
  otherOption: { value: T; label: string };
  years: number;
  onSelect: (value: T) => void;
  onYearsChange: (years: number) => void;
}

/** Radio group: either a number of years, or an open-ended alternative. */
function TermChoice<T extends string>({ legend, name, value, yearsOption, otherOption, years, onSelect, onYearsChange }: TermChoiceProps<T>) {
  const radio = (option: { value: T; label: string }) => (
    <label className="flex items-center gap-2 text-sm whitespace-nowrap text-stone-800">
      <input
        type="radio"
        name={name}
        checked={value === option.value}
        onChange={() => onSelect(option.value)}
        className="accent-indigo-600"
      />
      {option.label}
    </label>
  );
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium text-stone-800">{legend}</legend>
      <div className="flex items-center gap-2">
        {radio(yearsOption)}
        <YearsInput
          label={`${legend} in years`}
          value={years}
          disabled={value !== yearsOption.value}
          onChange={onYearsChange}
        />
        <span className="text-sm text-stone-600">year(s)</span>
      </div>
      {radio(otherOption)}
    </fieldset>
  );
}

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaData>(key: K, value: NdaData[K]) => onChange({ ...data, [key]: value });
  const dateId = useId();

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <PartyFields title="Party 1" party={data.party1} onChange={(party) => set("party1", party)} />
      <PartyFields title="Party 2" party={data.party2} onChange={(party) => set("party2", party)} />

      <Section title="Agreement">
        <TextField
          label="Purpose"
          hint="How Confidential Information may be used"
          multiline
          value={data.purpose}
          onChange={(value) => set("purpose", value)}
        />
        <div>
          <label htmlFor={dateId} className="text-sm font-medium text-stone-800">
            Effective date
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id={dateId}
              type="date"
              className={`${inputClass} min-w-0 flex-1`}
              value={data.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
            <button
              type="button"
              onClick={() => set("effectiveDate", todayIso())}
              className="shrink-0 rounded-md border border-stone-300 px-3 text-sm text-stone-700 hover:bg-stone-50"
            >
              Today
            </button>
          </div>
        </div>
      </Section>

      <Section title="Terms">
        <TermChoice
          legend="MNDA term"
          name="mndaTerm"
          value={data.mndaTerm}
          yearsOption={{ value: "expires", label: "Expires after" }}
          otherOption={{ value: "untilTerminated", label: "Continues until terminated" }}
          years={data.mndaTermYears}
          onSelect={(value) => set("mndaTerm", value)}
          onYearsChange={(years) => set("mndaTermYears", years)}
        />
        <TermChoice
          legend="Term of confidentiality"
          name="confidentialityTerm"
          value={data.confidentialityTerm}
          yearsOption={{ value: "years", label: "Protected for" }}
          otherOption={{ value: "perpetual", label: "In perpetuity" }}
          years={data.confidentialityYears}
          onSelect={(value) => set("confidentialityTerm", value)}
          onYearsChange={(years) => set("confidentialityYears", years)}
        />
      </Section>

      <Section title="Governing law & jurisdiction">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Governing law"
            hint="State, e.g. Delaware"
            value={data.governingLaw}
            onChange={(value) => set("governingLaw", value)}
          />
          <TextField
            label="Jurisdiction"
            hint="e.g. courts located in New Castle, DE"
            value={data.jurisdiction}
            onChange={(value) => set("jurisdiction", value)}
          />
        </div>
        <TextField
          label="MNDA modifications"
          hint="Optional — leave blank for none"
          multiline
          value={data.modifications}
          onChange={(value) => set("modifications", value)}
        />
      </Section>
    </form>
  );
}
