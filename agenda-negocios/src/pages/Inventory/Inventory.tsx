import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Download,
  FileUp,
  Package,
  Plus,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { getMyBusiness } from "../../services/businesses.service";
import { createService, getServices } from "../../services/services.service";
import {
  createProduct,
  getProducts,
  updateProductBySku,
  updateProductStock,
} from "../../services/inventory.service";
import type { Product, Service } from "../../types";
import styles from "./Style/Inventory.module.css";

type Tab = "products" | "services";
type ImportMode = "new" | "upsert";
const columns = [
  "Nombre",
  "SKU",
  "Categoría",
  "Stock",
  "Stock mínimo",
  "Unidad",
  "Precio costo",
  "Precio venta",
  "Descripción",
];
const money = (value: number) =>
  value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
const csvValue = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
const normalize = (value: string) => value.trim().toLocaleLowerCase();

function parseCsv(text: string) {
  const separator =
    (text.split("\n")[0].match(/;/g) ?? []).length >
    (text.split("\n")[0].match(/,/g) ?? []).length
      ? ";"
      : ",";
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let quoted = false;
      for (const character of line) {
        if (character === '"') quoted = !quoted;
        else if (character === separator && !quoted) {
          cells.push(current.trim());
          current = "";
        } else current += character;
      }
      cells.push(current.trim());
      return cells;
    });
}

export default function Inventory() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("new");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("0");
  const [minimumStock, setMinimumStock] = useState("0");
  const [unit, setUnit] = useState("unidad");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (!business) return;
        const [productList, serviceList] = await Promise.all([
          getProducts(business.id),
          getServices(business.id),
        ]);
        setProducts(productList);
        setServices(serviceList);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el inventario",
        );
      }
    })();
  }, []);
  const lowStock = useMemo(
    () =>
      products.filter((product) => product.stock <= product.minimum_stock)
        .length,
    [products],
  );

  function resetForm() {
    setName("");
    setSku("");
    setCategory("");
    setStock("0");
    setMinimumStock("0");
    setUnit("unidad");
    setCostPrice("");
    setSalePrice("");
    setDescription("");
    setDuration("30");
  }
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const business = await getMyBusiness();
      if (!business) return;
      if (tab === "products") {
        const product = await createProduct({
          business_id: business.id,
          name,
          sku: sku || null,
          category: category || null,
          stock: Number(stock),
          minimum_stock: Number(minimumStock),
          unit,
          cost_price: Number(costPrice),
          sale_price: Number(salePrice),
          description: description || null,
        });
        setProducts((current) =>
          [...current, product].sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        const service = await createService({
          business_id: business.id,
          name,
          description: description || null,
          duration_minutes: Number(duration),
          price: Number(salePrice),
          active: true,
        });
        setServices((current) =>
          [...current, service].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      resetForm();
      setShowForm(false);
      setMessage(
        tab === "products"
          ? "Producto agregado al inventario."
          : "Servicio agregado al catálogo.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar",
      );
    }
  }
  async function changeStock(product: Product, amount: string) {
    const next = Number(amount);
    if (!Number.isFinite(next) || next < 0) return;
    try {
      const updated = await updateProductStock(product.id, next);
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? updated : item)),
      );
    } catch (stockError) {
      setError(
        stockError instanceof Error
          ? stockError.message
          : "No se pudo actualizar el stock",
      );
    }
  }
  function exportCsv() {
    const rows = [
      columns,
      ...products.map((product) => [
        product.name,
        product.sku,
        product.category,
        product.stock,
        product.minimum_stock,
        product.unit,
        product.cost_price,
        product.sale_price,
        product.description,
      ]),
    ];
    const blob = new Blob(
      ["\ufeff" + rows.map((row) => row.map(csvValue).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importCsv() {
    if (!file) return;
    try {
      const business = await getMyBusiness();
      if (!business) return;
      const rows = parseCsv(await file.text());
      const headers = rows.shift()?.map(normalize) ?? [];
      const index = (label: string) => headers.indexOf(normalize(label));
      let added = 0;
      let updated = 0;
      for (const row of rows) {
        const product = {
          business_id: business.id,
          name: row[index("Nombre")] ?? "",
          sku: row[index("SKU")] || null,
          category: row[index("Categoría")] || null,
          stock: Number(row[index("Stock")] || 0),
          minimum_stock: Number(row[index("Stock mínimo")] || 0),
          unit: row[index("Unidad")] || "unidad",
          cost_price: Number(row[index("Precio costo")] || 0),
          sale_price: Number(row[index("Precio venta")] || 0),
          description: row[index("Descripción")] || null,
        };
        if (!product.name) continue;
        if (importMode === "upsert" && product.sku) {
          const existing = await updateProductBySku(
            business.id,
            product.sku,
            product,
          );
          if (existing) {
            updated += 1;
            continue;
          }
        }
        await createProduct(product);
        added += 1;
      }
      setProducts(await getProducts(business.id));
      setMessage(
        `Importación completada: ${added} agregados${updated ? ` y ${updated} actualizados` : ""}.`,
      );
      setShowImport(false);
      setFile(null);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "No se pudo importar el CSV",
      );
    }
  }
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  return (
    <section className={styles.page}>
      <header className="page-header inventory-header">
        <div>
          <p className="eyebrow">Control de productos</p>
          <h1>Inventario y servicios</h1>
          <p>Productos con stock y servicios sin stock, en un mismo lugar.</p>
        </div>
        <div className="inventory-actions">
          <button
            className="button-secondary"
            type="button"
            onClick={() => setShowImport((current) => !current)}
          >
            <FileUp size={17} /> Importar CSV
          </button>
          <button
            className="button-primary"
            type="button"
            onClick={() => {
              resetForm();
              setShowForm((current) => !current);
            }}
          >
            <Plus size={17} /> Agregar{" "}
            {tab === "products" ? "producto" : "servicio"}
          </button>
        </div>
      </header>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}
      <div className="inventory-summary">
        <div className="inventory-summary-item">
          <Package size={19} />
          <strong>{products.length}</strong>
          <span>productos</span>
        </div>
        <div className="inventory-summary-item">
          <Wrench size={19} />
          <strong>{services.length}</strong>
          <span>servicios</span>
        </div>
        <div className={`inventory-summary-item ${lowStock ? "warning" : ""}`}>
          <RefreshCw size={19} />
          <strong>{lowStock}</strong>
          <span>stock bajo</span>
        </div>
        <button className="export-button" type="button" onClick={exportCsv}>
          <Download size={17} /> Exportar Excel
        </button>
      </div>
      <div className="segmented-control inventory-tabs">
        <button
          className={tab === "products" ? "selected" : ""}
          type="button"
          onClick={() => setTab("products")}
        >
          Productos con stock
        </button>
        <button
          className={tab === "services" ? "selected" : ""}
          type="button"
          onClick={() => setTab("services")}
        >
          Servicios sin stock
        </button>
      </div>
      {showImport && (
        <div className="panel import-panel">
          <div className="panel-header">
            <div>
              <h2>Importar productos desde CSV</h2>
              <p className="panel-subtitle">
                Separador `;` o `,`. Solo Nombre es obligatorio.
              </p>
            </div>
            <FileUp size={20} color="#39714d" />
          </div>
          <label className="file-drop">
            Archivo CSV *
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              onChange={chooseFile}
            />
            <span>{file?.name ?? "Seleccioná un archivo CSV"}</span>
          </label>
          <div className="import-options">
            <label>
              <input
                type="radio"
                checked={importMode === "new"}
                onChange={() => setImportMode("new")}
              />{" "}
              Solo agregar nuevos productos
            </label>
            <label>
              <input
                type="radio"
                checked={importMode === "upsert"}
                onChange={() => setImportMode("upsert")}
              />{" "}
              Agregar nuevos y actualizar existentes por SKU
            </label>
          </div>
          <button
            className="button-primary"
            type="button"
            disabled={!file}
            onClick={() => void importCsv()}
          >
            Importar productos
          </button>
        </div>
      )}
      {showForm && (
        <form
          className="panel inventory-form"
          onSubmit={(event) => void submitForm(event)}
        >
          <div className="panel-header">
            <div>
              <h2>Agregar {tab === "products" ? "producto" : "servicio"}</h2>
              <p className="panel-subtitle">
                {tab === "products"
                  ? "Definí el stock y los precios."
                  : "Los servicios no afectan el stock."}
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              Nombre *
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            {tab === "products" ? (
              <>
                <label className="field">
                  SKU
                  <input
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                  />
                </label>
                <label className="field">
                  Categoría
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </label>
                <label className="field">
                  Stock
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                  />
                </label>
                <label className="field">
                  Stock mínimo
                  <input
                    type="number"
                    min="0"
                    value={minimumStock}
                    onChange={(event) => setMinimumStock(event.target.value)}
                  />
                </label>
                <label className="field">
                  Unidad
                  <input
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </label>
                <label className="field">
                  Precio costo
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(event) => setCostPrice(event.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="field">
                Duración (minutos)
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                />
              </label>
            )}
            <label className="field">
              Precio venta
              <input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(event) => setSalePrice(event.target.value)}
                required
              />
            </label>
            <label className="field field-wide">
              Descripción
              <textarea
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              className="button-secondary"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button className="button-primary" type="submit">
              Guardar {tab === "products" ? "producto" : "servicio"}
            </button>
          </div>
        </form>
      )}
      <div className="panel inventory-table-panel">
        <div className="panel-header">
          <h2>
            {tab === "products"
              ? `${products.length} productos`
              : `${services.length} servicios`}
          </h2>
        </div>
        {tab === "products" ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio venta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small className="muted">{product.unit}</small>
                    </td>
                    <td>{product.sku ?? "-"}</td>
                    <td>{product.category ?? "-"}</td>
                    <td>
                      <input
                        className="stock-input"
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={(event) =>
                          void changeStock(product, event.target.value)
                        }
                      />{" "}
                      <small>/ mín. {product.minimum_stock}</small>
                    </td>
                    <td>{money(product.sale_price)}</td>
                    <td>
                      <span
                        className={`status ${product.stock <= product.minimum_stock ? "stock-low" : ""}`}
                      >
                        {product.stock <= product.minimum_stock
                          ? "Stock bajo"
                          : "Disponible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Duración</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <strong>{service.name}</strong>
                      <br />
                      <small className="muted">
                        {service.description ?? "Sin descripción"}
                      </small>
                    </td>
                    <td>{service.duration_minutes} min</td>
                    <td>{money(service.price)}</td>
                    <td>
                      <span className="status">Activo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
