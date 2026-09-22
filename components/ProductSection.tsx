'use client'

import type { Product, ProductGroupId } from '@/data/products'
import ProductCard from './ProductCard'

interface Props {
  title: string
  caption?: string
  items: Product[]
  selectedIds: Set<string>
  suggestedIds: Set<string>
  onToggle: (id: string) => void
  groupId: ProductGroupId
  /** First card above the fold gets a priority image. */
  priorityFirst?: boolean
}

export default function ProductSection({
  title,
  caption,
  items,
  selectedIds,
  suggestedIds,
  onToggle,
  groupId,
  priorityFirst = false,
}: Props) {
  const isJustInCase = groupId === 'justincase'
  const headingId = `group-${groupId}`

  return (
    <section
      aria-labelledby={headingId}
      className={
        isJustInCase
          ? 'rounded-card border border-blush bg-blush-soft p-4'
          : undefined
      }
    >
      <div className="mb-3">
        <h2
          id={headingId}
          className="font-display text-[17px] font-extrabold leading-snug text-ink md:text-xl"
        >
          {title}
          {isJustInCase && <span aria-hidden="true"> 💛</span>}
        </h2>
        {caption && (
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">{caption}</p>
        )}
      </div>

      {/* One column on phones, two from iPad width up. */}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
        {items.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            selected={selectedIds.has(product.id)}
            suggested={suggestedIds.has(product.id)}
            onToggle={onToggle}
            priority={priorityFirst && i === 0}
          />
        ))}
      </div>
    </section>
  )
}
