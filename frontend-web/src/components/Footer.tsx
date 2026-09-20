import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-stack-lg bg-surface-container-low border-t border-outline-variant mt-auto hidden md:block">
      <div className="flex flex-col md:flex-row justify-between items-center gap-stack-md px-container-padding-desktop max-w-[1280px] mx-auto w-full">
        <div className="flex items-center gap-2 text-headline-md font-headline-md font-bold text-primary">
          <img src="/logo.svg" alt="Smart Eco Bank" className="w-8 h-8 rounded-lg object-cover" />
          Smart Eco Bank
        </div>
        <div className="flex flex-wrap justify-center gap-gutter">
          <Link
            href="#"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Carbon Neutrality Report
          </Link>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center md:text-right">
          © 2026 Smart Eco Bank. Secure &amp; Sustainable.
        </p>
      </div>
    </footer>
  );
}
