import { useSyncExternalStore } from "react";
import { db, subscribe } from "./store";

export function useDb() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => db.all(),
    () => db.all(),
  );
}
