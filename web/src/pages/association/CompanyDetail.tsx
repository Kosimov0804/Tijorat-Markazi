import type { ReactNode } from "react";
import { formatDateTime } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { PasswordReset } from "./PasswordReset";
import type { MemberCompany, Product, ViewProps } from "./types";

type CompanyDetailProps = ViewProps & { company: MemberCompany; onBack: () => void };

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="show-card">
      {product.img ? (
        <img className="show-img" src={product.img} alt="" loading="lazy" />
      ) : (
        <div className="show-img show-img-ph">🛍️</div>
      )}
      <div className="show-body">
        <b>{product.name}</b>
        {product.price && <span className="show-price">{product.price}</span>}
        {product.desc && <p>{product.desc}</p>}
      </div>
    </div>
  );
}

export function CompanyDetail({ company, onBack, credentials, at }: CompanyDetailProps) {
  const { lang } = useI18n();
  const products = company.showroom;
  const cards = [
    { label: at("st_products"), value: products.length },
    { label: at("st_priced"), value: products.filter(product => product.price.trim()).length },
    { label: at("st_photo"), value: products.filter(product => product.img.trim()).length },
  ];
  const rows: { label: string; value: ReactNode }[] = [
    { label: at("i_name"), value: company.name },
    { label: at("i_sector"), value: company.sector || "—" },
    { label: at("i_login"), value: <code>{company.login}</code> },
    {
      label: at("i_pass"),
      value: (
        <>
          <span className="ac-label">{at("pw_hidden")}</span>{" "}
          <PasswordReset companyId={company.id} credentials={credentials} at={at} style={{ marginLeft: 8 }} />
        </>
      ),
    },
    { label: at("i_created"), value: company.created ? formatDateTime(company.created, lang) : "—" },
    { label: at("i_products"), value: products.length },
  ];

  return (
    <>
      <button type="button" className="btn btn-ghost" id="cdBack" style={{ marginBottom: 14 }} onClick={onBack}>
        {at("cd_back")}
      </button>
      <div className="admin-cards">
        {cards.map(card => (
          <div className="admin-card" key={card.label}>
            <div className="ac-label">{card.label}</div>
            <div className="ac-val">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <h2>{company.name}</h2>
        <table className="admin-table">
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td style={{ color: "var(--muted)", width: 200 }}>{row.label}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-panel">
        <h2>{at("cd_products")}</h2>
        <div className="show-grid">
          {products.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
          {!products.length && <p className="ac-label">{at("cd_empty")}</p>}
        </div>
      </div>
    </>
  );
}
