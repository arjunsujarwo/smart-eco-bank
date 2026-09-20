"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import {
  getAdminStockData,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductLocationStock,
  isLowStock,
} from "@/lib/adminApi";
import type { AdminProduct, AdminLocation } from "@/lib/adminTypes";
import { useTranslation } from "react-i18next";

const NO_IMAGE = "/images/noimages.svg";
const REWARD_CATEGORIES = ["Elektronik", "Pangan", "Wearables", "Aksesoris", "Peralatan Rumah"];

type EditEntry = { name: string; category: string; pointCost: number; image?: File | null; imageUrl?: string | null; imagePreview?: string | null };
type Toast = { msg: string; type: "success" | "error" };
type LocationStockEdits = Record<string, Record<number, number>>;

export default function AdminStockPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMap, setEditMap] = useState<Record<string, EditEntry>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [locationStockEdits, setLocationStockEdits] = useState<LocationStockEdits>({});
  const [updatingLocationStock, setUpdatingLocationStock] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<{ name: string; category: string; pointCost: number; image: File | null; imagePreview: string | null }>({ name: "", category: "", pointCost: 0, image: null, imagePreview: null });

  const { t } = useTranslation();

  function initEdits(productList: AdminProduct[]) {
    const map: Record<string, EditEntry> = {};
    const locStocks: LocationStockEdits = {};
    productList.forEach((p) => {
      map[p.id] = { name: p.name, category: p.category, pointCost: p.pointCost, imageUrl: p.imageUrl };
      locStocks[p.id] = Object.fromEntries(p.locationStocks.map((ls) => [ls.locationId, ls.stock]));
    });
    setEditMap(map);
    setLocationStockEdits(locStocks);
  }

  useEffect(() => {
    getAdminStockData().then((data) => {
      setProducts(data.products);
      setLocations(data.locations);
      initEdits(data.products);
      setLoading(false);
    });
  }, []);

  function setField(id: string, field: keyof EditEntry, val: EditEntry[keyof EditEntry]) {
    setEditMap((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }

  function setLocationStock(productId: string, locationId: number, stock: number) {
    setLocationStockEdits((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [locationId]: stock },
    }));
  }

  function getLocationStockValue(productId: string, locationId: number, product: AdminProduct): number {
    const edits = locationStockEdits[productId];
    if (edits && locationId in edits) return edits[locationId];
    return product.locationStocks.find((ls) => ls.locationId === locationId)?.stock ?? 0;
  }

  function toggleExpand(productId: string) {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function handleImageChange(id: string | null, file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (id === null) {
        setNewProduct((prev) => ({ ...prev, image: file, imagePreview: e.target?.result as string }));
      } else {
        setEditMap((prev) => ({ ...prev, [id]: { ...prev[id], image: file, imagePreview: e.target?.result as string } }));
      }
    };
    reader.readAsDataURL(file);
  }

  function showToast(msg: string, type: Toast["type"] = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function refreshData() {
    const data = await getAdminStockData();
    setProducts(data.products);
    setLocations(data.locations);
    initEdits(data.products);
  }

  async function handleUpdate(product: AdminProduct) {
    const edit = editMap[product.id];
    if (!edit) return;
    setUpdating(product.id);
    try {
      await updateProduct(product.id, { name: edit.name, category: edit.category, pointCost: edit.pointCost, image: edit.image });
      await refreshData();
      showToast("Produk berhasil diperbarui");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memperbarui", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleUpdateLocationStock(product: AdminProduct, locationId: number) {
    const key = `${product.id}-${locationId}`;
    const stock = getLocationStockValue(product.id, locationId, product);
    setUpdatingLocationStock(key);
    try {
      await updateProductLocationStock(product.id, locationId, stock);
      await refreshData();
      showToast("Stok berhasil diperbarui");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memperbarui stok", "error");
    } finally {
      setUpdatingLocationStock(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setEditMap((prev) => { const m = { ...prev }; delete m[id]; return m; });
      showToast(t("admin.stock.deleteSuccess"));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreate() {
    if (!newProduct.name.trim()) return;
    setCreating(true);
    try {
      await createProduct({ name: newProduct.name.trim(), category: newProduct.category.trim() || undefined, requiredPoints: newProduct.pointCost, image: newProduct.image });
      await refreshData();
      setNewProduct({ name: "", category: "", pointCost: 0, image: null, imagePreview: null });
      setShowCreate(false);
      showToast("Produk baru berhasil ditambahkan");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menambah produk", "error");
    } finally {
      setCreating(false);
    }
  }

  const lowCount = products.filter(isLowStock).length;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-10 py-4 bg-surface border-b border-surface-variant">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">{t("admin.stock.title")}</h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant hidden md:block">{t("admin.stock.subtitle")}</p>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-10 py-6 md:py-8 overflow-y-auto">
        {/* Title + add button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface">{t("admin.stock.inventoryTitle")}</h2>
            <p className="text-body-md text-on-surface-variant mt-2 max-w-xl">{t("admin.stock.inventorySubtitle")}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-button shadow-lg hover:brightness-95 active:scale-95 transition-all shrink-0"
          >
            <Icon name="add" />
            {t("admin.stock.addProduct")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col justify-between">
            <p className="text-label-sm font-label-sm text-outline mb-1">{t("admin.stock.totalProducts")}</p>
            <h3 className="text-headline-lg font-headline-lg">{products.length}</h3>
          </div>
          <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-label-sm font-label-sm text-outline mb-1">{t("admin.stock.criticalStock")}</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-headline-lg font-headline-lg text-error">{lowCount}</span>
                <span className="text-body-md text-on-surface-variant">{t("admin.stock.needsRestock")}</span>
              </div>
            </div>
            <Icon name="warning" fill className="text-error opacity-10 absolute right-4 bottom-0" style={{ fontSize: 100 }} />
          </div>
        </div>

        {/* Mobile cards */}
        {!loading && (
          <div className="md:hidden space-y-3 mb-4">
            {products.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                <Icon name="inventory_2" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
                <p>{t("admin.stock.noProducts")}</p>
              </div>
            )}
            {products.map((product) => {
              const edit = editMap[product.id] ?? { name: product.name, pointCost: product.pointCost };
              const low = isLowStock(product);
              const isExpanded = expandedProducts.has(product.id);
              return (
                <div key={product.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
                  {/* Name + image */}
                  <div className="flex items-center gap-3">
                    <label className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant shrink-0 cursor-pointer overflow-hidden relative group">
                      <img
                        src={edit.imagePreview || edit.imageUrl || NO_IMAGE}
                        alt="Product"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Icon name="photo_camera" className="text-white" style={{ fontSize: 14 }} />
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(product.id, e.target.files?.[0] || null)} />
                    </label>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={edit.name}
                        onChange={(e) => setField(product.id, "name", e.target.value)}
                        className="w-full font-bold text-on-surface bg-transparent border-b border-outline-variant focus:outline-none focus:border-primary py-0.5"
                      />
                      <select
                        value={edit.category}
                        onChange={(e) => setField(product.id, "category", e.target.value)}
                        className="w-full text-xs text-on-surface-variant bg-transparent border-b border-outline-variant/40 focus:outline-none focus:border-primary py-0.5 mt-1"
                      >
                        <option value="">— Pilih Kategori —</option>
                        {REWARD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Total stock + expand */}
                  <div
                    className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(product.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="inventory_2" className="text-on-surface-variant" style={{ fontSize: 18 }} />
                      <span className="text-label-sm font-label-sm text-outline uppercase font-bold">Total Stok</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-body-md ${low ? "text-error" : "text-on-surface"}`}>
                        {product.stock}
                      </span>
                      {low && <span className="text-[10px] text-error font-medium">Rendah</span>}
                      <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-on-surface-variant" style={{ fontSize: 18 }} />
                    </div>
                  </div>

                  {/* Per-location stock (expanded) */}
                  {isExpanded && (
                    <div className="space-y-2 pl-2">
                      {locations.length === 0 && (
                        <p className="text-body-sm text-on-surface-variant text-center py-2">Belum ada posko terdaftar</p>
                      )}
                      {locations.map((loc) => {
                        const locKey = `${product.id}-${loc.id}`;
                        const stockVal = getLocationStockValue(product.id, loc.id, product);
                        return (
                          <div key={loc.id} className="flex items-center gap-2">
                            <Icon name="subdirectory_arrow_right" className="text-outline shrink-0" style={{ fontSize: 14 }} />
                            <span className="text-body-sm text-on-surface-variant flex-1 truncate">{loc.locationName}</span>
                            <input
                              type="number"
                              min={0}
                              value={stockVal}
                              onChange={(e) => setLocationStock(product.id, loc.id, parseInt(e.target.value) || 0)}
                              className="w-20 bg-surface border border-outline-variant rounded-lg px-2 py-1.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                              onClick={() => handleUpdateLocationStock(product, loc.id)}
                              disabled={updatingLocationStock === locKey}
                              className="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-lg text-label-sm font-bold hover:brightness-95 transition-all disabled:opacity-60 shrink-0"
                            >
                              {updatingLocationStock === locKey ? "..." : "Simpan"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Points */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-tighter text-outline font-bold">Poin</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={edit.pointCost}
                        onChange={(e) => setField(product.id, "pointCost", parseInt(e.target.value) || 0)}
                        className="w-full bg-surface border border-outline-variant rounded-lg pl-3 pr-9 py-2 text-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold">PTS</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="flex items-center gap-1 text-error hover:bg-error-container px-3 py-2 rounded-lg transition-colors text-label-sm font-label-sm font-bold disabled:opacity-60"
                    >
                      <Icon name="delete" style={{ fontSize: 16 }} />
                      {deleting === product.id ? "..." : t("admin.stock.delete")}
                    </button>
                    <button
                      onClick={() => handleUpdate(product)}
                      disabled={updating === product.id}
                      className="flex-1 bg-primary-container text-on-primary-container py-2 rounded-lg text-label-sm font-label-sm font-bold hover:brightness-95 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {updating === product.id ? t("admin.stock.save") : t("admin.stock.edit")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col className="w-[42%]" />
                <col className="w-[16%]" />
                <col className="w-[20%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {[t("admin.stock.tableName"), "Total Stok", t("admin.stock.tablePoints"), t("admin.stock.tableActions")].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-label-sm font-label-sm text-on-surface-variant ${i === 3 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">{t("admin.stock.loading")}</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant">
                      <Icon name="inventory_2" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
                      <p>{t("admin.stock.noProducts")}</p>
                    </td>
                  </tr>
                ) : (
                  products.flatMap((product) => {
                    const edit = editMap[product.id] ?? { name: product.name, pointCost: product.pointCost };
                    const low = isLowStock(product);
                    const isExpanded = expandedProducts.has(product.id);

                    const productRow = (
                      <tr key={product.id} className="hover:bg-surface-bright transition-colors">
                        {/* Name */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <label className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant shrink-0 cursor-pointer overflow-hidden relative group">
                              <img
                                src={edit.imagePreview || edit.imageUrl || NO_IMAGE}
                                alt="Product"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon name="photo_camera" className="text-white" style={{ fontSize: 20 }} />
                              </div>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(product.id, e.target.files?.[0] || null)} />
                            </label>
                            <div className="min-w-0">
                              <input
                                type="text"
                                value={edit.name}
                                onChange={(e) => setField(product.id, "name", e.target.value)}
                                className="font-bold text-on-surface bg-transparent border-b border-outline-variant focus:outline-none focus:border-primary py-0.5 w-full max-w-[200px]"
                              />
                              <select
                                value={edit.category}
                                onChange={(e) => setField(product.id, "category", e.target.value)}
                                className="text-xs text-on-surface-variant bg-transparent border-b border-outline-variant/40 focus:outline-none focus:border-primary py-0.5 w-full max-w-[200px] mt-0.5"
                              >
                                <option value="">— Kategori —</option>
                                {REWARD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* Total stock — click to expand */}
                        <td
                          className="px-6 py-5 cursor-pointer select-none hover:bg-surface-bright transition-colors"
                          onClick={() => toggleExpand(product.id)}
                        >
                          <span className={`font-bold text-body-md ${low ? "text-error" : "text-on-surface"}`}>
                            {product.stock}
                          </span>
                          {low && <span className="block text-[10px] text-error font-medium">Stok Rendah</span>}
                        </td>

                        {/* Points */}
                        <td className="px-6 py-5">
                          <div className="relative w-32">
                            <input
                              type="number"
                              min={0}
                              value={edit.pointCost}
                              onChange={(e) => setField(product.id, "pointCost", parseInt(e.target.value) || 0)}
                              className="w-full bg-surface border border-outline-variant rounded-lg pl-3 pr-10 py-2 text-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold">PTS</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleting === product.id}
                              className="inline-flex items-center gap-1 text-error hover:bg-error-container px-2 py-2 rounded-lg transition-colors disabled:opacity-60"
                            >
                              <Icon name="delete" style={{ fontSize: 18 }} />
                              <span className="text-label-sm font-label-sm font-bold">
                                {deleting === product.id ? "..." : t("admin.stock.delete")}
                              </span>
                            </button>
                            <button
                              onClick={() => handleUpdate(product)}
                              disabled={updating === product.id}
                              className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-label-sm font-label-sm font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
                            >
                              {updating === product.id ? t("admin.stock.save") : t("admin.stock.edit")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );

                    if (!isExpanded) return [productRow];

                    const locationRows = locations.map((loc) => {
                      const locKey = `${product.id}-${loc.id}`;
                      const stockVal = getLocationStockValue(product.id, loc.id, product);
                      return (
                        <tr key={locKey} className="bg-surface-container-low border-t border-outline-variant/50">
                          <td className="pl-16 pr-6 py-3">
                            <div className="flex items-center gap-2">
                              <Icon name="subdirectory_arrow_right" className="text-outline shrink-0" style={{ fontSize: 16 }} />
                              <span className="text-body-sm text-on-surface-variant">{loc.locationName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <input
                                type="number"
                                min={0}
                                value={stockVal}
                                onChange={(e) => setLocationStock(product.id, loc.id, parseInt(e.target.value) || 0)}
                                className="w-16 min-w-0 bg-surface border border-outline-variant rounded-lg px-2 py-1.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <button
                                onClick={() => handleUpdateLocationStock(product, loc.id)}
                                disabled={updatingLocationStock === locKey}
                                className="bg-secondary-container text-on-secondary-container px-2 py-1.5 rounded-lg text-label-sm font-bold hover:brightness-95 transition-all disabled:opacity-60 shrink-0"
                              >
                                {updatingLocationStock === locKey ? "..." : "Simpan"}
                              </button>
                            </div>
                          </td>
                          <td colSpan={2} />
                        </tr>
                      );
                    });

                    if (locations.length === 0) {
                      locationRows.push(
                        <tr key={`${product.id}-empty`} className="bg-surface-container-low">
                          <td colSpan={4} className="pl-16 py-3 text-body-sm text-on-surface-variant">
                            Belum ada posko terdaftar
                          </td>
                        </tr>
                      );
                    }

                    return [productRow, ...locationRows];
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="px-6 py-4 bg-surface-container-low">
              <span className="text-label-sm font-label-sm text-on-surface-variant">Menampilkan {products.length} produk</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-primary p-5">
              <h3 className="font-bold text-white text-lg">{t("admin.stock.addTitle")}</h3>
              <p className="text-white/80 text-xs mt-0.5">Stok dapat diatur per posko setelah produk dibuat</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center mb-2">
                <label className="w-24 h-24 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant shrink-0 cursor-pointer overflow-hidden relative group">
                  {newProduct.imagePreview ? (
                    <img src={newProduct.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="add_a_photo" fill className="text-primary opacity-60" style={{ fontSize: 32 }} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icon name="photo_camera" className="text-white" style={{ fontSize: 24 }} />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(null, e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-label-sm font-label-sm text-outline uppercase text-xs font-bold">{t("admin.stock.nameLabel")}</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Contoh: Tumbler Eco"
                  className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-sm font-label-sm text-outline uppercase text-xs font-bold">Kategori</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Pilih Kategori —</option>
                  {REWARD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label-sm font-label-sm text-outline uppercase text-xs font-bold">{t("admin.stock.pointsLabel")}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={newProduct.pointCost}
                    onChange={(e) => setNewProduct((p) => ({ ...p, pointCost: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 pr-10 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold">PTS</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowCreate(false); setNewProduct({ name: "", category: "", pointCost: 0, image: null, imagePreview: null }); }}
                  className="flex-1 py-3 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors"
                >
                  {t("admin.stock.cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newProduct.name.trim() || creating}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button text-sm hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {creating ? <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} /> : <Icon name="add" style={{ fontSize: 16 }} />}
                  {creating ? t("admin.stock.save") : t("admin.stock.addProduct")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <div className={`${toast.type === "error" ? "bg-error-container border border-error/20" : "bg-on-background"} rounded-xl px-5 py-4 shadow-xl flex items-center gap-3`}>
            <Icon name={toast.type === "error" ? "error" : "check_circle"} fill className={toast.type === "error" ? "text-error" : "text-primary-fixed"} />
            <p className={`text-sm font-medium ${toast.type === "error" ? "text-error" : "text-surface"}`}>{toast.msg}</p>
          </div>
        </div>
      )}
    </>
  );
}
