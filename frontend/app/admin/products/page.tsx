"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  listAdminProducts,
  updateAdminProduct,
  deleteAdminProduct,
  type AdminProduct,
} from "@/lib/api-client";
import { resolveProductImage } from "@/components/admin/StatusBadge";

type EditForm = {
  title: string;
  sell_price: string;
  cost_price: string;
  stock: string;
  status: string;
  category: string;
};

function productToForm(p: AdminProduct): EditForm {
  return {
    title: p.title,
    sell_price: String(p.sell_price),
    cost_price: String(p.cost_price),
    stock: String(p.stock),
    status: p.status,
    category: p.category ?? "",
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await listAdminProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleEdit = (product: AdminProduct) => {
    setOpenMenuId(null);
    setEditing(product);
    setEditForm(productToForm(product));
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm) return;
    setSaving(true);
    try {
      await updateAdminProduct(editing.id, {
        title: editForm.title.trim(),
        sell_price: parseFloat(editForm.sell_price) || 0,
        cost_price: parseFloat(editForm.cost_price) || 0,
        stock: parseInt(editForm.stock, 10) || 0,
        status: editForm.status,
        category: editForm.category.trim() || undefined,
      });
      setEditing(null);
      setEditForm(null);
      showToast("Produit mis à jour avec succès.");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: number, title: string) => {
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Supprimer définitivement « ${title} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;
    try {
      await deleteAdminProduct(productId);
      showToast("Produit supprimé.");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de la suppression");
    }
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-sm text-zinc-500">
            {products.length} produit{products.length > 1 ? "s" : ""} · API live
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <span>{error}</span>
          <button type="button" onClick={load} className="flex items-center gap-1 underline">
            <RefreshCw className="h-3.5 w-3.5" /> Réessayer
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer les produits..."
            className="w-full rounded-lg border border-zinc-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-accent dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Chargement des produits...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun produit trouvé.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Produit</th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 sm:table-cell">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Prix</th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 md:table-cell">
                  Stock
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-zinc-500 lg:table-cell">
                  Statut
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((product) => {
                const image = resolveProductImage(product.image_urls?.[0]);
                const priceCents = Math.round(Number(product.sell_price) * 100);
                return (
                  <tr key={product.id} className="bg-white dark:bg-zinc-950">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700">
                          <Image
                            src={image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <span className="font-medium line-clamp-1">{product.title}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                      {product.category ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatPrice(priceCents)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          product.stock > 0
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 capitalize lg:table-cell">
                      {product.status}
                    </td>
                    <td className="relative px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Modifier"
                          aria-label={`Modifier ${product.title}`}
                        >
                          <Edit className="h-4 w-4 text-zinc-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.title)}
                          className="rounded p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Supprimer"
                          aria-label={`Supprimer ${product.title}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                        <div className="relative" ref={openMenuId === product.id ? menuRef : undefined}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId((id) => (id === product.id ? null : product.id))
                            }
                            className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Menu"
                            aria-label="Menu actions"
                          >
                            <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                          </button>
                          {openMenuId === product.id && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                <Edit className="h-4 w-4" /> Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id, product.title)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" /> Supprimer
                              </button>
                              {product.keyword && (
                                <a
                                  href={`/admin/auto-publish`}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                >
                                  <ExternalLink className="h-4 w-4" /> Auto-publish
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Modifier le produit</h2>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setEditForm(null);
                }}
                className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-zinc-500">Titre</span>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-zinc-500">Prix vente (€)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.sell_price}
                    onChange={(e) => setEditForm({ ...editForm, sell_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-500">Coût (€)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.cost_price}
                    onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-zinc-500">Stock</span>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-500">Statut</span>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="published">published</option>
                    <option value="quarantine">quarantine</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="text-zinc-500">Catégorie</span>
                <input
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setEditForm(null);
                }}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
