import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, Users, DoorOpen, FlaskConical, Building2, X } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, ProgressBar } from "@/components/ui-kit";
import { db, type Room } from "@/lib/store";

export const Route = createFileRoute("/app/classrooms")({
  head: () => ({ meta: [{ title: "Classrooms — SchoolByte ERP" }] }),
  component: ClassroomsPage,
});

const floorLabel: Record<string, string> = { "ground": "Ground Floor", "1st": "1st Floor", "2nd": "2nd Floor", "3rd": "3rd Floor" };

function ClassroomsPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [floorF, setFloorF] = useState("");
  const [typeF, setTypeF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);

  const filtered = useMemo(() => state.rooms.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (floorF && r.floor !== floorF) return false;
    if (typeF && r.type !== typeF) return false;
    if (statusF && r.status !== statusF) return false;
    return true;
  }), [state.rooms, q, floorF, typeF, statusF]);

  const groupsInRoom = (roomId: string) => state.groups.filter((g) => g.roomId === roomId && g.status === "active").length;

  return (
    <>
      <PageHeader
        title="Classrooms"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.rooms.length}</b> rooms</>}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 pr-3 h-10 w-56 sm:w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={floorF} onChange={(e) => setFloorF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Floors</option>
              {Object.entries(floorLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Types</option><option value="classroom">Classroom</option><option value="lab">Lab</option><option value="hall">Hall</option>
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Status</option><option value="in-use">In Use</option><option value="available">Available</option><option value="maintenance">Maintenance</option>
            </select>
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Room
            </button>
          </>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Room</th>
                <th className="py-4 font-semibold">Type</th>
                <th className="py-4 font-semibold">Capacity</th>
                <th className="py-4 font-semibold">Equipment</th>
                <th className="py-4 font-semibold">Occupancy</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const gCount = groupsInRoom(r.id);
                const slots = 12;
                const pct = Math.round((gCount / slots) * 100);
                const Icon = r.type === "lab" ? FlaskConical : r.type === "hall" ? Building2 : DoorOpen;
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">{floorLabel[r.floor]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {r.type === "lab" && <Badge tone="warning">Lab</Badge>}
                      {r.type === "classroom" && <Badge tone="info">Classroom</Badge>}
                      {r.type === "hall" && <Badge tone="success">Hall</Badge>}
                    </td>
                    <td className="py-3 font-semibold"><span className="inline-flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> {r.capacity}</span></td>
                    <td className="py-3 text-xs text-muted-foreground max-w-[240px]">{r.equipment || "—"}</td>
                    <td className="py-3 min-w-[180px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold">{gCount} / {slots} slots</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} tone={pct >= 80 ? "warning" : "success"} />
                    </td>
                    <td className="py-3">
                      {r.status === "in-use" && <Badge tone="success" dot>In Use</Badge>}
                      {r.status === "available" && <Badge tone="info" dot>Available</Badge>}
                      {r.status === "maintenance" && <Badge tone="warning" dot>Maintenance</Badge>}
                    </td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <button onClick={() => db.updateRoom(r.id, { status: r.status === "available" ? "in-use" : "available" })} title="Toggle" className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setEditing(r)} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => confirm(`Delete ${r.name}?`) && db.deleteRoom(r.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No rooms match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <RoomModal onClose={() => setShowAdd(false)} />}
      {editing && <RoomModal room={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return <label className={`block ${span === 2 ? "sm:col-span-2" : ""}`}><div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>{children}</label>;
}

function RoomModal({ room, onClose }: { room?: Room; onClose: () => void }) {
  const isEdit = !!room;
  const [name, setName] = useState(room?.name ?? "");
  const [floor, setFloor] = useState<Room["floor"]>(room?.floor ?? "ground");
  const [type, setType] = useState<Room["type"]>(room?.type ?? "classroom");
  const [capacity, setCapacity] = useState(room?.capacity ?? 25);
  const [equipment, setEquipment] = useState(room?.equipment ?? "");
  const [notes, setNotes] = useState(room?.notes ?? "");
  const [status, setStatus] = useState<Room["status"]>(room?.status ?? "available");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { alert("Room name is required"); return; }
    const payload = { name, floor, type, capacity: Number(capacity), equipment, notes, status };
    if (isEdit && room) db.updateRoom(room.id, payload);
    else db.addRoom(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">{isEdit ? "Edit Room" : "New Room"}</div>
          <button type="button" onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Room Name *" span={2}><input value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Floor">
            <select value={floor} onChange={(e) => setFloor(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              {Object.entries(floorLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="classroom">Classroom</option>
              <option value="lab">Lab</option>
              <option value="hall">Hall</option>
            </select>
          </Field>
          <Field label="Capacity *"><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </Field>
          <Field label="Equipment" span={2}><input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Whiteboard, Projector, PC…" className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Notes" span={2}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-md bg-background" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium">{isEdit ? "Save Changes" : "Create Room"}</button>
        </div>
      </form>
    </div>
  );
}
