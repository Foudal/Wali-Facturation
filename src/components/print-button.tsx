"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary no-print">
      Imprimer / Enregistrer en PDF
    </button>
  );
}
