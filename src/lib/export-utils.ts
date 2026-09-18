export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function cell(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function escapeCsv(v: string) {
  const s = v.replace(/"/g, '""');
  return `"${s}"`;
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export function exportToCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]) {
  const head = columns.map((c) => escapeCsv(c.header)).join(";");
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(cell(c.value(row)))).join(";"))
    .join("\n");
  // BOM garante acentuação correta no Excel
  const blob = new Blob(["\uFEFF" + head + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}_${stamp()}.csv`);
}

export function exportToPdf<T>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
  subtitle?: string,
) {
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(cell(c.value(row)))}</td>`).join("")}</tr>`,
    )
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #2b1a12; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #8E1611; }
  p.sub { margin: 0 0 16px; font-size: 12px; color: #6b5a50; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #4d3227; color: #e8b57d; text-align: left; padding: 8px; text-transform: uppercase; letter-spacing: .05em; font-size: 10px; }
  td { padding: 7px 8px; border-bottom: 1px solid #e5ded8; }
  tr:nth-child(even) td { background: #faf6f2; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="sub">${escapeHtml(subtitle || "")}Gerado em ${new Date().toLocaleString("pt-BR")} — ${rows.length} registro(s)</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload = function(){ window.focus(); window.print(); }<\/script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

export function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}
