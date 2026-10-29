import Link from "next/link";
import { HOME_PATH } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-primary-text uppercase">Erro 404</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight text-ink select-none">
        Página não encontrada
      </h1>
      <p className="mt-6 max-w-md text-base text-ink-3">
        Parece que essa rota saiu do mapa. O conteúdo que você procura não existe ou foi movido para
        outro lugar.
      </p>
      <Link
        href={HOME_PATH}
        className="mt-10 inline-flex h-11 items-center justify-center rounded-md bg-cta px-5 text-sm font-semibold text-white transition hover:bg-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
