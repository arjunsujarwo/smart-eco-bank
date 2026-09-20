"use client";

import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import {
  getAdminLocations,
  createAdminLocation,
  updateAdminLocation,
  deleteAdminLocation,
} from "@/lib/adminApi";
import type { AdminLocation } from "@/lib/adminTypes";
import Map, { NavigationControl, GeolocateControl, Marker } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Swal from "sweetalert2";

// ── Edit/Create Modal ────────────────────────────────────────────────────────
function LocationModal({
  location,
  onClose,
  onSave,
}: {
  location?: AdminLocation | null;
  onClose: () => void;
  onSave: (loc: AdminLocation) => void;
}) {
  const isEdit = !!location;
  const [form, setForm] = useState({
    locationName: location?.locationName ?? "",
    address: location?.address ?? "",
    latitude: location?.latitude ?? -6.200000,
    longitude: location?.longitude ?? 106.816666,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    setForm((prev) => ({
      ...prev,
      latitude: e.lngLat.lat,
      longitude: e.lngLat.lng,
    }));
  }, []);

  async function handleSave() {
    if (!form.locationName.trim() || !form.address.trim()) {
      setError("Nama dan alamat wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit && location) {
        const res = await updateAdminLocation(location.id, form);
        onSave({ ...location, ...res });
      } else {
        const res = await createAdminLocation(form);
        onSave(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="bg-primary p-5 shrink-0 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">
              {isEdit ? "Edit Location" : "Add Location"}
            </h3>
            <p className="text-white/80 text-xs mt-0.5">
              Set the name, address, and map pin for the deposit point
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Icon name="close" style={{ fontSize: 24 }} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-outline uppercase">
                Location Name
              </label>
              <input
                type="text"
                value={form.locationName}
                onChange={(e) => setForm((p) => ({ ...p, locationName: e.target.value }))}
                placeholder="e.g. Smart Eco Harmoni"
                className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-outline uppercase">
                Full Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Street address..."
                className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-outline uppercase flex items-center gap-2">
              <Icon name="pin_drop" style={{ fontSize: 16 }} className="text-primary" />
              Set Pin on Map (Click to Place)
            </label>
            <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-outline bg-surface-variant">
              <Map
                initialViewState={{
                  longitude: form.longitude,
                  latitude: form.latitude,
                  zoom: 14,
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                onClick={handleMapClick}
                cursor="pointer"
              >
                <NavigationControl position="top-right" />
                <GeolocateControl position="top-right" />
                <Marker longitude={form.longitude} latitude={form.latitude} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold text-white mb-1 whitespace-nowrap">
                      {form.locationName || "Drop Point"}
                    </div>
                    <Icon
                      name="location_on"
                      fill
                      className="text-primary drop-shadow-md"
                      style={{ fontSize: 40 }}
                    />
                  </div>
                </Marker>
              </Map>
            </div>
            <div className="flex gap-4 mt-2">
              <p className="text-xs text-outline font-mono">
                Lat: {form.latitude.toFixed(6)}
              </p>
              <p className="text-xs text-outline font-mono">
                Lng: {form.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-error font-medium">{error}</p>}

          <div className="flex gap-3 pt-4 border-t border-surface-variant">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button text-sm hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} />}
              {saving ? "Saving..." : "Save Location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLoc, setEditLoc] = useState<AdminLocation | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminLocations()
      .then(setLocations)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(loc: AdminLocation) {
    const res = await Swal.fire({
      title: "Delete Location?",
      text: `Are you sure you want to delete "${loc.locationName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c7b6d",
      confirmButtonText: "Yes, Delete!",
      cancelButtonText: "Cancel",
    });

    if (res.isConfirmed) {
      try {
        await deleteAdminLocation(loc.id);
        setLocations((prev) => prev.filter((l) => l.id !== loc.id));
        Swal.fire("Deleted!", "Location has been deleted.", "success");
      } catch (e) {
        Swal.fire("Failed", e instanceof Error ? e.message : "Failed to delete", "error");
      }
    }
  }

  const filtered = locations.filter(
    (l) =>
      l.locationName.toLowerCase().includes(search.toLowerCase()) ||
      l.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-10 py-4 bg-surface border-b border-surface-variant">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">
            Location Management
          </h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant hidden md:block">
            Manage deposit points and capacity for users to submit waste
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-button text-sm shadow hover:brightness-95 active:scale-95 transition-all"
        >
          <Icon name="add_location" style={{ fontSize: 18 }} />
          <span className="hidden sm:inline">Add Location</span>
        </button>
      </header>

      <div className="flex-1 px-4 md:px-10 py-6 overflow-y-auto">
        <div className="relative mb-6 max-w-md">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            style={{ fontSize: 18 }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              Memuat data lokasi...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-on-surface-variant">
              <Icon name="location_off" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
              <p>Tidak ada lokasi yang ditemukan</p>
            </div>
          ) : (
            filtered.map((loc) => (
              <div
                key={loc.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <Icon name="storefront" style={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface leading-tight">
                        {loc.locationName}
                      </h3>
                      <p className="text-xs text-outline line-clamp-1 mt-0.5">
                        {loc.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <Icon name="map" style={{ fontSize: 16 }} />
                    <span>Lat: {loc.latitude.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <Icon name="map" style={{ fontSize: 16 }} />
                    <span>Lng: {loc.longitude.toFixed(4)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-surface-variant">
                  <button
                    onClick={() => setEditLoc(loc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-outline-variant text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant transition-colors"
                  >
                    <Icon name="edit" style={{ fontSize: 16 }} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(loc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-error/30 text-error rounded-lg text-xs font-bold hover:bg-error-container transition-colors"
                  >
                    <Icon name="delete" style={{ fontSize: 16 }} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(showModal || editLoc) && (
        <LocationModal
          location={editLoc}
          onClose={() => {
            setShowModal(false);
            setEditLoc(null);
          }}
          onSave={(updated) => {
            if (editLoc) {
              setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
              Swal.fire("Success", "Location updated successfully.", "success");
            } else {
              setLocations((prev) => [updated, ...prev]);
              Swal.fire("Success", "New location added successfully.", "success");
            }
            setShowModal(false);
            setEditLoc(null);
          }}
        />
      )}
    </>
  );
}
