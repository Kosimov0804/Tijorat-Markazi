import { safeImageUrl } from "./mk";

export type ProductTile = {
  id: string;
  name: string;
  price?: string;
  img?: string;
};

type ProductTilesProps = {
  products: readonly ProductTile[];
  emptyText: string;
  askPriceText: string;
};

/** The product grid shared by a company's page and its Business ID card. */
export function ProductTiles({ products, emptyText, askPriceText }: ProductTilesProps) {
  if (!products.length) return <p className="bid-empty">{emptyText}</p>;
  return (
    <div className="bid-goods">
      {products.map(product => {
        const source = safeImageUrl(product.img);
        return (
          <a className="bid-good" href={`mahsulot.html?id=${encodeURIComponent(product.id)}`} key={product.id}>
            {source ? (
              <img src={source} alt={product.name} loading="lazy" />
            ) : (
              <span className="bid-good-blank" aria-hidden="true" />
            )}{" "}
            <b>{product.name}</b> <span>{product.price || askPriceText}</span>
          </a>
        );
      })}
    </div>
  );
}
