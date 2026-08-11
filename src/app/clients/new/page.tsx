import { ClientForm } from "@/components/client-form";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">Nouveau client</h1>
      <div className="mt-8">
        <ClientForm action={createClientAction} submitLabel="Créer le client" />
      </div>
    </div>
  );
}
