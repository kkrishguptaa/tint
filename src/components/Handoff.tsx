"use client";

type Props = {
  fromName: string;
  onContinue: () => void;
};

export function Handoff({ fromName, onContinue }: Props) {
  return (
    <section className="flex flex-col gap-6 py-8">
      <p className="text-sm tracking-[0.2em] uppercase text-[var(--ink-muted)]">
        Pass the device
      </p>
      <h1 className="text-4xl leading-tight">
        {fromName}&apos;s answers are sealed.
      </h1>
      <p className="text-lg text-[var(--ink-muted)]">
        Hand the phone to your partner. Don&apos;t peek — results unlock only
        after both of you finish.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 rounded-full bg-[var(--accent)] px-6 py-3 font-medium text-[#1a1410]"
      >
        I&apos;m the second partner
      </button>
    </section>
  );
}
