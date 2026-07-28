import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, Users, DoorOpen, FlaskConical, Building2 } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, ProgressBar } from "@/components/ui-kit";
import { db } from "@/lib/store";

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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or floor…" className="pl-9 pr-3 h-10 w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
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
            <button onClick={() => {
              const name = prompt("Room name"); if (!name) return;
              db.addRoom({ name, floor: "ground", type: "classroom", capacity: 25, status: "available" });
            }} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
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
                <th className="py-4 font-semibold">Groups</th>
                <th className="py-4 font-semibold">Occupancy</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const gCount = groupsInRoom(r.id);
                const slots = 12; // planning capacity per room
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
                    <td className="py-3 font-semibold flex items-center gap-2 pt-4"><Users className="w-4 h-4 text-muted-foreground" /> {r.capacity} seats</td>
                    <td className="py-3">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-lg font-bold">{gCount}</span>
                        <Badge tone="success" dot>Active</Badge>
                      </div>
                    </td>
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
                        <button className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => db.updateRoom(r.id, { status: r.status === "available" ? "in-use" : "available" })} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => confirm("Delete room?") && db.deleteRoom(r.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
