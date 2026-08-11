import type { Client } from "@/generated/prisma/client";

export function ClientForm({
  action,
  client,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  client?: Pick<Client, "nom" | "email" | "telephone" | "adresse">;
  submitLabel: string;
}) {
  return (
    <form action={action} className="card flex flex-col gap-5 p-6 sm:p-8">
      <div className="field">
        <label htmlFor="nom">Nom du client *</label>
        <input id="nom" name="nom" required defaultValue={client?.nom} placeholder="Atelier Nour SARL" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={client?.email ?? ""} placeholder="contact@client.fr" />
        </div>
        <div className="field">
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" defaultValue={client?.telephone ?? ""} placeholder="06 12 34 56 78" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="adresse">Adresse</label>
        <textarea id="adresse" name="adresse" rows={3} defaultValue={client?.adresse ?? ""} placeholder="14 rue des Artisans, 75011 Paris" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
