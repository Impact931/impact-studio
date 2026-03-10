import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold text-brand-white">
          Impact Studio
        </Link>
        <Link
          href="/book"
          className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-accent-hover"
        >
          Book Equipment
        </Link>
      </div>
    </header>
  );
}
