"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { getLocations, updateSelectedLocation } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import type { DropLocation } from "@/lib/types";
import Map, {
  NavigationControl,
  GeolocateControl,
  Marker,
} from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_CENTER = { longitude: 112.768845, latitude: -7.250445 };
const NEAR_THRESHOLD_KM = 10;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationsPage() {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef>(null);
  const [nearLocations, setNearLocations] = useState<DropLocation[]>([]);
  const [allLocations, setAllLocations] = useState<DropLocation[]>([]);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingSelection, setPendingSelection] = useState<DropLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ longitude: number; latitude: number } | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ longitude: pos.coords.longitude, latitude: pos.coords.latitude });
        setGeoReady(true);
      },
      () => setGeoReady(true),
      { timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (!geoReady) return;
    setLoading(true);
    getLocations(query, userCoords?.latitude, userCoords?.longitude)
      .then(({ near, all, selectedLocation }) => {
        setNearLocations(near);
        setAllLocations(all);
        setActiveId((prev) => prev ?? near[0]?.id ?? all[0]?.id ?? null);
        if (selectedLocation) {
          setSelectedId(String(selectedLocation.id));
        }
      })
      .catch((e) => showToast(e instanceof Error ? e.message : "Gagal memuat lokasi", "error"))
      .finally(() => setLoading(false));
  }, [query, geoReady, userCoords]);

  // Desktop: mount map as soon as geo is ready
  useEffect(() => {
    if (geoReady && typeof window !== "undefined" && window.innerWidth >= 768) {
      setMapMounted(true);
    }
  }, [geoReady]);

  // Mobile: mount map when user first switches to map tab, then resize
  useEffect(() => {
    if (mobileTab === "map" && geoReady) {
      setMapMounted(true);
      setTimeout(() => mapRef.current?.resize(), 150);
    }
  }, [mobileTab, geoReady]);

  const flyTo = useCallback((loc: DropLocation) => {
    mapRef.current?.flyTo({
      center: [loc.lng, loc.lat],
      zoom: 16,
      duration: 1200,
    });
    setActiveId(loc.id);
    if (mobileTab === "list") setMobileTab("map");
  }, [mobileTab]);

  async function handleSelectLocation(loc: DropLocation) {
    if (!loc.isOpen) return;
    try {
      await updateSelectedLocation(loc.id);
      setSelectedId(loc.id);
      setPendingSelection(null);
      showToast(`Lokasi "${loc.name}" dipilih sebagai tempat setor sampah.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memilih lokasi", "error");
    }
  }

  function handlePickLocation(loc: DropLocation) {
    flyTo(loc);
    setPendingSelection(loc);
  }

  const backendNearIds = new Set(nearLocations.map((l) => l.id));
  const clientNearIds: Set<string> = userCoords
    ? new Set(
        allLocations
          .filter(
            (l) =>
              haversineKm(userCoords.latitude, userCoords.longitude, l.lat, l.lng) <=
              NEAR_THRESHOLD_KM,
          )
          .map((l) => l.id),
      )
    : new Set();
  const nearIds = new Set([...backendNearIds, ...clientNearIds]);

  // Near locations merged with their distance data; non-near appended after
  const nearLocationsWithDist: DropLocation[] = allLocations
    .filter((l) => nearIds.has(l.id))
    .map((l) => {
      const fromBackend = nearLocations.find((n) => n.id === l.id);
      const distKm = userCoords
        ? haversineKm(userCoords.latitude, userCoords.longitude, l.lat, l.lng)
        : (fromBackend?.distanceKm ?? 0);
      return { ...l, distanceKm: distKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const sidebarLocations: DropLocation[] = [
    ...nearLocationsWithDist,
    ...allLocations.filter((l) => !nearIds.has(l.id)),
  ];
  const activeNear = sidebarLocations.find((l) => l.id === activeId);

  return (
    <AppShell>
      {toast && <Toast {...toast} />}

      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-surface-variant bg-surface sticky top-16 z-10">
        {(["list", "map"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-button text-sm transition-colors ${
              mobileTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-on-surface-variant"
            }`}
          >
            <Icon name={tab === "list" ? "list" : "map"} fill={mobileTab === tab} />
            {tab === "list" ? t("locations.tabList") : t("locations.tabMap")}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-160px)]">
        {/* Sidebar list */}
        <aside
          className={`w-full md:w-1/3 flex flex-col bg-surface-container-low border-r border-surface-variant ${
            mobileTab === "map" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-stack-md flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-headline-md font-headline-md text-primary">
                {t("locations.title")}
              </h1>
              <p className="text-body-md text-on-surface-variant">
                {t("locations.subtitle")}
              </p>
            </div>
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("locations.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-stack-lg custom-scrollbar space-y-4">
            {loading ? (
              <div className="py-12 text-center text-on-surface-variant">
                <Icon name="sync" className="animate-spin text-primary text-3xl mb-2" />
                <p className="text-sm">{t("locations.loading")}</p>
              </div>
            ) : sidebarLocations.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <Icon name="location_off" className="text-4xl mb-2" />
                <p className="text-sm">{t("locations.noResults")}</p>
              </div>
            ) : (
              sidebarLocations.map((loc) => {
                const active = loc.id === activeId;
                const chosen = loc.id === selectedId;
                const isNear = nearIds.has(loc.id);
                return (
                  <div
                    key={loc.id}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      active
                        ? "bg-primary-container/15 border-2 border-primary shadow-md"
                        : isNear
                          ? "bg-primary-container/10 border-2 border-primary/40"
                          : "bg-surface border border-outline-variant"
                    }`}
                  >
                    {/* Header row */}
                    <button
                      onClick={() => handlePickLocation(loc)}
                      className="w-full text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusChip loc={loc} />
                          {isNear && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                              <Icon name="near_me" className="text-[10px]" />
                              Terdekat
                            </span>
                          )}
                        </div>
                        <span className="text-label-sm text-outline font-label-sm shrink-0">
                          {loc.distanceKm > 0 ? `${loc.distanceKm.toFixed(1)} ${t("locations.kmAway")}` : ""}
                        </span>
                      </div>
                      <h3 className="text-body-lg font-bold text-on-surface">
                        {loc.name}
                      </h3>
                      {loc.address && (
                        <p className="text-body-md text-on-surface-variant mb-3">
                          {loc.address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-on-surface-variant mb-3">
                        <Icon
                          name={loc.isOpen ? "group" : loc.isFull ? "do_not_disturb" : "schedule"}
                          className="text-[18px]"
                        />
                        <span className="text-label-sm">{loc.openInfo}</span>
                      </div>
                    </button>

                    {/* Pilih / Dipilih / Pending button */}
                    {chosen ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/30 text-primary rounded-xl text-sm font-bold w-full justify-center">
                        <Icon name="check_circle" fill className="text-base" />
                        {t("locations.selected")}
                      </div>
                    ) : pendingSelection?.id === loc.id ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary-container/40 text-secondary rounded-xl text-sm font-bold w-full justify-center">
                        <Icon name="pending" fill className="text-base" />
                        Menunggu Konfirmasi…
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePickLocation(loc)}
                        disabled={!loc.isOpen}
                        className="w-full py-2 bg-primary text-on-primary rounded-xl text-sm font-button hover:brightness-95 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Icon name="where_to_vote" className="text-base" />
                        {loc.isFull ? "Lokasi Penuh" : !loc.isOpen ? "Tidak Tersedia" : t("locations.select")}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map */}
        <section
          className={`flex-1 relative bg-surface-variant overflow-hidden min-h-[400px] ${
            mobileTab === "list" ? "hidden md:block" : "block"
          }`}
          style={mobileTab === "map" ? { height: "calc(100dvh - 160px)" } : undefined}
        >
          {mapMounted && (
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: userCoords?.longitude ?? DEFAULT_CENTER.longitude,
              latitude: userCoords?.latitude ?? DEFAULT_CENTER.latitude,
              zoom: userCoords ? 14 : 13,
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <NavigationControl position="bottom-right" />
            <GeolocateControl position="bottom-right" />

            {/* Markers for all locations */}
            {allLocations.map((loc) => {
              const isChosen = loc.id === selectedId;
              const isActive = loc.id === activeId;
              const isPending = loc.id === pendingSelection?.id;
              return (
                <Marker
                  key={loc.id}
                  longitude={loc.lng}
                  latitude={loc.lat}
                  anchor="bottom"
                  onClick={() => {
                    const fullLoc = nearLocations.find((n) => n.id === loc.id) ?? loc;
                    handlePickLocation(fullLoc);
                  }}
                >
                  <div
                    title={loc.name}
                    className={`flex flex-col items-center cursor-pointer transition-transform ${isActive || isChosen || isPending ? "scale-125" : "hover:scale-110"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white ${
                        isChosen
                          ? "bg-primary"
                          : isPending
                            ? "bg-tertiary"
                            : isActive
                              ? "bg-secondary"
                              : "bg-error"
                      }`}
                    >
                      <Icon
                        name={isChosen ? "where_to_vote" : isPending ? "pending" : "recycling"}
                        fill
                        className="text-[14px]"
                      />
                    </div>
                    <div className="w-2 h-2 bg-inherit rounded-full -mt-1 shadow" />
                  </div>
                </Marker>
              );
            })}
          </Map>
          )}

          {/* Stats card */}
          <div className="hidden md:block absolute top-10 left-10 p-6 glass-card rounded-2xl shadow-2xl max-w-sm pointer-events-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="analytics" className="text-primary" />
              </div>
              <h2 className="text-body-lg font-extrabold text-on-surface">
                Area Jangkauan
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
                  Total Posko
                </span>
                <span className="text-headline-md font-bold text-primary">
                  {allLocations.length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
                  Tersedia
                </span>
                <span className="text-headline-md font-bold text-primary">
                  {allLocations.filter((l) => !l.isFull).length}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating confirm button */}
      {pendingSelection && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 bg-surface-container-highest border border-outline-variant rounded-2xl shadow-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col min-w-0 max-w-[180px]">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
              Lokasi dipilih:
            </span>
            <span className="text-sm font-bold text-on-surface truncate">
              {pendingSelection.name}
            </span>
          </div>
          <button
            onClick={() => handleSelectLocation(pendingSelection)}
            disabled={!pendingSelection.isOpen}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-button hover:brightness-95 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <Icon name="where_to_vote" fill className="text-base" />
            {t("locations.confirmBtn")}
          </button>
          <button
            onClick={() => setPendingSelection(null)}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors"
            aria-label={t("locations.cancelBtn")}
          >
            <Icon name="close" className="text-outline text-lg" />
          </button>
        </div>
      )}
    </AppShell>
  );
}

function StatusChip({ loc }: { loc: DropLocation }) {
  if (loc.isFull)
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container text-error text-label-sm font-label-sm">
        <span className="w-2 h-2 rounded-full bg-error mr-2" />
        Penuh
      </span>
    );
  if (loc.isOpen)
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/10 text-primary text-label-sm font-label-sm">
        <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
        Tersedia
      </span>
    );
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-label-sm">
      Tidak Aktif
    </span>
  );
}
