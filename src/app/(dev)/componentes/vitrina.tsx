"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Rol } from "@/shared/lib/roles";
import { AppHeader } from "@/shared/ui/app-header";
import { BarraInferior } from "@/shared/ui/bottom-nav-barra";
import { BotonLima, Button } from "@/shared/ui/button";
import { CartaCrack, type NivelCarta } from "@/shared/ui/carta-crack";
import { ChipMarcador } from "@/shared/ui/chip-marcador";
import { RoleSwitcher, type OpcionRol } from "@/shared/ui/role-switcher";

// Datos de muestra del deck (El Chícharo, Liga Dominical Iztapalapa). Solo para la vitrina.
const PORTALES = { siglas: "DP", nombre: "Portales", color: "#0250B0", colorFranja: "#FFFFFF" };
const TIGRES = { siglas: "TL", nombre: "Tigres", color: "#F28C1B", colorFranja: "#050608" };
const CONDESA = { siglas: "RC", nombre: "Condesa", color: "#8A1C2B", colorFranja: "#FFFFFF" };

const OPCIONES: OpcionRol[] = [
  {
    id: "jugador-portales",
    rol: "jugador",
    titulo: "Dep. Portales",
    ligaCorta: "LDI",
    detalle: "Liga Dominical Iztapalapa · J15",
    extra: "#9",
    escudo: PORTALES,
  },
  {
    id: "delegado-compas",
    rol: "delegado",
    titulo: "Los Compas FC",
    ligaCorta: "CBF7",
    detalle: "Copa Barrio Fut 7 · Semis",
    escudo: { color: "#6B2FD6", colorFranja: "#FFFFFF" },
    pendiente: "POR FIRMAR",
  },
  {
    id: "arbitro-ldi",
    rol: "arbitro",
    titulo: "Liga Dominical Iztapalapa",
    ligaCorta: "LDI",
    detalle: "2 partidos hoy · Deportivo Cuitláhuac",
    escudo: { color: "#08716D", colorFranja: "#FFFFFF" },
  },
  {
    id: "aficionado-portales",
    rol: "aficionado",
    titulo: "Porra de Portales",
    ligaCorta: "LDI",
    detalle: "Sigues a 3 equipos",
    escudo: PORTALES,
  },
  {
    id: "liga-ldi",
    rol: "liga",
    titulo: "Liga Dominical Iztapalapa",
    ligaCorta: "LDI",
    detalle: "Apertura 2026 · J16 de 18",
    escudo: { color: "#262B33", colorFranja: "#C6D0DD" },
  },
];

const HREF_CENTRAL: Partial<Record<Rol, string>> = {
  delegado: "/equipo/los-compas-fc/pase-de-lista",
  liga: "/admin/dominical-iztapalapa/calendario",
};

const TIRA: {
  nivel: NivelCarta;
  media: number;
  posicion: string;
  nombre: string;
  stats: [number, number, number];
}[] = [
  { nivel: "bronce", media: 68, posicion: "MC", nombre: "Toñito", stats: [2, 13, 3] },
  { nivel: "plata", media: 76, posicion: "EXT", nombre: "La Pulga", stats: [4, 14, 6] },
  { nivel: "oro", media: 87, posicion: "DC", nombre: "El Chícharo", stats: [19, 14, 7] },
  { nivel: "leyenda", media: 90, posicion: "DFC", nombre: "Memo Salas", stats: [3, 312, 9] },
  { nivel: "especial", media: 89, posicion: "MCO", nombre: "El Brujo", stats: [11, 15, 9] },
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="etiqueta text-xs font-extrabold tracking-[0.16em] text-muted-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

export function Vitrina() {
  const [activoId, setActivoId] = useState(OPCIONES[0].id);
  const activo = OPCIONES.find((o) => o.id === activoId) ?? OPCIONES[0];

  // El acento por rol vive en <body data-role> (línea de 2 px arriba incluida)
  useEffect(() => {
    document.body.dataset.role = activo.rol;
    return () => {
      delete document.body.dataset.role;
    };
  }, [activo.rol]);

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <AppHeader avisos={3} avatar={{ iniciales: "CH" }} degradado>
        <RoleSwitcher
          opciones={OPCIONES}
          activoId={activoId}
          onCambiar={(o) => setActivoId(o.id)}
          hrefUnirme="/mi-liga"
        />
      </AppHeader>

      <main className="flex flex-col gap-8 px-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground">Fase 0 · componentes de marca</p>
          <h1 className="titular-momento text-5xl">Vitrina</h1>
        </div>

        <Seccion titulo="Tarjeta principal (color del rol)">
          <div className="flex flex-col gap-4 rounded-2xl bg-role-card p-4 text-white">
            <span className="etiqueta text-[11px] font-extrabold tracking-[0.16em] text-brand-lime">
              Próximo · J16
            </span>
            <p className="titular-momento text-5xl">
              Te toca <span className="text-brand-lime">el domingo</span>
            </p>
            <div className="flex items-center gap-2">
              <BotonLima className="flex-1">Confirmo que voy</BotonLima>
              <Button
                variant="quieto"
                size="cta"
                className="border border-white/50 text-white hover:bg-white/10"
              >
                No voy
              </Button>
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Botones">
          <BotonLima>Presume tu golazo</BotonLima>
          <Button variant="whatsapp" size="cta">
            <MessageCircle aria-hidden />
            Contactar por WhatsApp
          </Button>
          <BotonLima disabled>Cerrar cédula</BotonLima>
        </Seccion>

        <Seccion titulo="Chip de marcador">
          {/* Desde la banda, en vivo: siempre NO OFICIAL (regla 1) */}
          <ChipMarcador
            local={PORTALES}
            visitante={TIGRES}
            golesLocal={1}
            golesVisitante={0}
            fuente={{ tipo: "banda", enVivo: true, minuto: 34 }}
          />
          {/* Desde la banda, ya terminó pero la cédula no está validada */}
          <ChipMarcador
            local={PORTALES}
            visitante={TIGRES}
            golesLocal={1}
            golesVisitante={0}
            fuente={{ tipo: "banda", enVivo: false }}
          />
          {/* Cédula validada */}
          <ChipMarcador
            local={PORTALES}
            visitante={CONDESA}
            golesLocal={3}
            golesVisitante={2}
            conNombres
            fuente={{ tipo: "cedula", arbitro: "J. Mendoza" }}
          />
        </Seccion>

        <Seccion titulo="Carta de crack · niveles">
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-6">
            {TIRA.map((c) => (
              <CartaCrack
                key={c.nivel}
                nivel={c.nivel}
                media={c.media}
                posicion={c.posicion}
                nombre={c.nombre}
                escudo={PORTALES}
                zona="Iztapalapa"
                ancho={170}
                stats={[
                  { valor: c.stats[0], etiqueta: "GOL" },
                  { valor: c.stats[1], etiqueta: "PJ" },
                  { valor: c.stats[2], etiqueta: "AST" },
                ]}
              />
            ))}
          </div>
        </Seccion>

        <Seccion titulo="En construcción · reverso">
          <div className="flex flex-wrap justify-center gap-4">
            <CartaCrack
              nivel="bronce"
              enConstruccion
              posicion="MC"
              nombre="Neto"
              escudo={PORTALES}
              zona="Iztapalapa"
              ancho={170}
              stats={[
                { valor: 0, etiqueta: "GOL" },
                { valor: 1, etiqueta: "PJ" },
                { valor: 0, etiqueta: "AST" },
              ]}
            />
            <CartaCrack
              nivel="oro"
              lado="reverso"
              media={87}
              posicion="DC"
              nombre="El Chícharo"
              escudo={PORTALES}
              torneo="Apertura 2026"
              ancho={170}
              stats={[
                { valor: 19, etiqueta: "GOL" },
                { valor: 14, etiqueta: "PJ" },
                { valor: 7, etiqueta: "AST" },
              ]}
              atributos={[
                { clave: "DEF", nombre: "Definición", valor: 91 },
                { clave: "PAS", nombre: "Pase", valor: 74 },
                { clave: "CON", nombre: "Constancia", valor: 88 },
                { clave: "DIS", nombre: "Disciplina", valor: 70 },
                { clave: "CRK", nombre: "Crack · votos MVP", valor: 86 },
                { clave: "RES", nombre: "Respeto · rivales", valor: 79 },
              ]}
              nota="RES lo votan los rivales después de cada partido"
            />
          </div>
        </Seccion>
      </main>

      {/* La vitrina no es una ruta de la barra: se marca Inicio como activo para ver el color del rol */}
      <BarraInferior rol={activo.rol} hrefCentral={HREF_CENTRAL[activo.rol]} pathname="/inicio" />
    </div>
  );
}
