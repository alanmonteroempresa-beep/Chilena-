"use client";

import { useEffect } from "react";
import type { Rol } from "@/shared/lib/roles";

/** El acento del rol vive en <body data-role> (línea superior de 2 px incluida · docs/DISENO.md §3.3) */
export function RolEnBody({ rol }: { rol: Rol }) {
  useEffect(() => {
    document.body.dataset.role = rol;
    return () => {
      delete document.body.dataset.role;
    };
  }, [rol]);
  return null;
}
