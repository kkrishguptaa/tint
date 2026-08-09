"use client";

type Props = {
  title?: string;
  body: string;
  continueLabel: string;
  onContinue: () => void;
};

export function PassDevice({
  title = "Pass the device",
  body,
  continueLabel,
  onContinue,
}: Props) {
  return (
    <section className="flex flex-col gap-6 py-8">
      <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
        {title}
      </p>
      <h1 className="text-4xl leading-tight">{body}</h1>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 rounded-full btn-primary px-6 py-3 font-medium"
      >
        {continueLabel}
      </button>
    </section>
  );
}
