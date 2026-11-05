import Link from "next/link";

// Página temporal de arranque (Fase 0). Se reemplaza por la pantalla 01 "Entrar".
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="etiqueta text-sm text-muted-foreground">La red del fútbol llanero</p>
      <h1 className="titular-momento text-6xl">
        Del llano a <span className="text-brand-blue dark:text-brand-lime">tu celular.</span>
      </h1>
      <Link
        href="/entrar"
        className="etiqueta inline-flex h-12 items-center rounded-lg bg-primary px-6 text-primary-foreground"
      >
        Entrar
      </Link>
    </main>
  );
}
