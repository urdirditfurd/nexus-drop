import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, Truck, CheckCircle, Circle } from "lucide-react";
import { getOrder } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: `Commande ${params.id} — NEXUS-DROP` };
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default async function OrderPage({ params }: Props) {
  const { data: order, fallback } = await getOrder(params.id);

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {fallback && (
        <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
          Mode démo — API indisponible
        </p>
      )}

      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/account" className="hover:text-accent">
          Mon compte
        </Link>
        <span className="mx-2">/</span>
        <span>Commande {order.id}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Commande {order.id}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Passée le{" "}
            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent dark:bg-accent/20">
          {statusLabels[order.status]}
        </span>
      </div>

      {order.trackingSteps && (
        <section className="mb-10 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Suivi de livraison</h2>
          </div>
          {order.trackingNumber && (
            <p className="mb-6 text-sm text-zinc-500">
              N° de suivi :{" "}
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                {order.trackingNumber}
              </span>
            </p>
          )}
          <div className="space-y-4">
            {order.trackingSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {step.completed ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      step.completed
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-zinc-500">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Articles</h2>
          </div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {order.items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-medium hover:text-accent"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-zinc-500">Qté : {quantity}</p>
              </div>
              <p className="text-sm font-medium">
                {formatPrice(product.price * quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
