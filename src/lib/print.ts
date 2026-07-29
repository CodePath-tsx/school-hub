// Print utility: opens a fresh window with printable A4 content, runs print.
// Falls back to hidden iframe if popups are blocked.

const A4_CSS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  thead th { background: #f5f5f2; font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.06em; border-bottom: 2px solid #ddd; }
  .brand { display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 14px; border-bottom: 2px solid #2f5a3f; margin-bottom: 20px; }
  .brand .logo { color: #2f5a3f; font-weight: 800; font-size: 20px; letter-spacing: -.02em; }
  .brand .meta { text-align: right; font-size: 11px; color: #555; }
  .kv { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 24px; margin: 8px 0 4px; }
  .kv div { display: flex; justify-content: space-between; padding: 4px 0;
    border-bottom: 1px dotted #ddd; }
  .kv b { font-weight: 600; color: #333; }
  .kv span { color: #111; font-weight: 500; }
  .total { display: flex; justify-content: space-between; align-items: center;
    margin-top: 14px; padding: 12px 16px; background: #f0eee6;
    border: 1px solid #2f5a3f; border-radius: 8px; }
  .total .amt { font-size: 22px; font-weight: 800; color: #2f5a3f; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 10px; font-weight: 600; background: #eef4ef; color: #2f5a3f; }
  .foot { margin-top: 30px; padding-top: 12px; border-top: 1px dashed #bbb;
    display: flex; justify-content: space-between; font-size: 10px; color: #666; }
  .sig { margin-top: 40px; display: flex; justify-content: space-between; }
  .sig div { width: 45%; }
  .sig .line { border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 10px; }
  .cell-tight { padding: 6px 8px; }
  .row-strong td { font-weight: 700; background: #fafaf5; }
`;

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function build(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>${A4_CSS}</style></head><body>${body}
    <script>window.addEventListener('load',()=>{setTimeout(()=>{window.focus();window.print();},250);});</script>
    </body></html>`;
}

export function printHtml(title: string, body: string) {
  const html = build(title, body);
  const w = window.open("", "_blank", "width=900,height=1000");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    return;
  }
  // Fallback: hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 300);
}

export { esc };

export function brandHeader(schoolName: string, subtitle: string, taxId?: string, phone?: string, address?: string) {
  return `<div class="brand">
    <div>
      <div class="logo">${esc(schoolName || "SchoolByte ERP")}</div>
      <div style="font-size:11px;color:#666;margin-top:2px;">${esc(subtitle)}</div>
    </div>
    <div class="meta">
      ${address ? `<div>${esc(address)}</div>` : ""}
      ${phone ? `<div>Tel: ${esc(phone)}</div>` : ""}
      ${taxId ? `<div>Tax ID: ${esc(taxId)}</div>` : ""}
      <div>${new Date().toLocaleString("en-US")}</div>
    </div>
  </div>`;
}
