import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080';
const emptyMedicine = { fullName: '', notes: '', expiryDate: '', quantity: '0', price: '', brand: '' };

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.title || `Request failed (${response.status})`);
  return body;
}

function dateLabel(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function App() {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyMedicine);
  const [saleMedicineId, setSaleMedicineId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [activeTab, setActiveTab] = useState('inventory');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData(query = search) {
    setLoading(true);
    try {
      const [medicineData, salesData] = await Promise.all([
        request(`/api/medicines${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`),
        request('/api/sales')
      ]);
      setMedicines(medicineData);
      setSales(salesData);
      setError('');
    } catch (e) {
      setError(`${e.message}. Check that the .NET API is running at ${API}.`);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(''); }, []);
  useEffect(() => {
    const timer = setTimeout(() => loadData(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => ({
    medicines: medicines.length,
    units: medicines.reduce((sum, m) => sum + m.quantity, 0),
    lowStock: medicines.filter(m => m.quantity < 10).length,
    salesValue: sales.reduce((sum, s) => sum + s.totalAmount, 0)
  }), [medicines, sales]);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function addMedicine(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await request('/api/medicines', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          price: Number(form.price)
        })
      });
      setForm(emptyMedicine);
      setMessage('Medicine added successfully.');
      await loadData(search);
    } catch (e) { setError(e.message); }
  }

  async function recordSale(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await request('/api/sales', {
        method: 'POST',
        body: JSON.stringify({ medicineId: saleMedicineId, quantitySold: Number(saleQuantity) })
      });
      setMessage('Sale recorded and stock updated.');
      setSaleQuantity('1');
      await loadData(search);
    } catch (e) { setError(e.message); }
  }

  function rowClass(medicine) {
    const days = Math.ceil((new Date(`${medicine.expiryDate}T00:00:00`) - new Date(new Date().toDateString())) / 86400000);
    if (days < 30) return 'expiry-row';
    if (medicine.quantity < 10) return 'stock-row';
    return '';
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon">✚</div><div><strong>ABC Pharmacy</strong><small>Inventory Console</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>▦ <span>Medicine Inventory</span></button>
      <button className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>↗ <span>Sales Records</span></button>
      <div className="sidebar-bottom"><div className="status-dot"></div><span>Local server storage</span></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><span className="eyebrow">PHARMACY MANAGEMENT</span><h1>{activeTab === 'inventory' ? 'Medicine Inventory' : 'Sales Records'}</h1><p>Manage medicine stock, expiry dates and sales in one place.</p></div><div className="avatar">AB</div></header>

      {message && <div className="notice success">{message}<button onClick={() => setMessage('')}>×</button></div>}
      {error && <div className="notice error">{error}<button onClick={() => setError('')}>×</button></div>}

      <section className="stats-grid">
        <div className="stat-card"><span className="stat-icon blue">▦</span><div><small>Medicines listed</small><strong>{stats.medicines}</strong></div></div>
        <div className="stat-card"><span className="stat-icon purple">▤</span><div><small>Total units in stock</small><strong>{stats.units}</strong></div></div>
        <div className="stat-card"><span className="stat-icon amber">!</span><div><small>Low stock items</small><strong>{stats.lowStock}</strong></div></div>
        <div className="stat-card"><span className="stat-icon green">₹</span><div><small>Total recorded sales</small><strong>₹{stats.salesValue.toFixed(2)}</strong></div></div>
      </section>

      {activeTab === 'inventory' ? <>
        <section className="panel">
          <div className="panel-heading"><div><h2>Medicine list</h2><p>Review availability and identify medicines needing attention.</p></div><button className="primary-btn" onClick={() => document.getElementById('add-medicine').scrollIntoView({ behavior: 'smooth' })}>＋ Add medicine</button></div>
          <div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine name..." /></div><div className="legend"><span><i className="legend-red"></i>Expiry under 30 days</span><span><i className="legend-yellow"></i>Stock under 10</span></div></div>
          <div className="table-wrap"><table><thead><tr><th>MEDICINE</th><th>BRAND</th><th>EXPIRY DATE</th><th>QUANTITY</th><th>PRICE</th><th>STATUS</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="6" className="empty">Loading medicines…</td></tr> : medicines.length === 0 ? <tr><td colSpan="6" className="empty">No medicines found. Add a medicine or change your search.</td></tr> : medicines.map(m => {
              const days = Math.ceil((new Date(`${m.expiryDate}T00:00:00`) - new Date(new Date().toDateString())) / 86400000);
              const expired = days < 0;
              const expiring = days < 30;
              return <tr key={m.id} className={rowClass(m)}>
                <td><strong>{m.fullName}</strong><small className="sub-cell">{m.notes ? 'Notes available' : '—'}</small></td>
                <td>{m.brand}</td><td>{dateLabel(m.expiryDate)}{expiring && <small className="sub-cell">{expired ? 'Expired' : `${days} days remaining`}</small>}</td>
                <td><span className={`quantity ${m.quantity < 10 ? 'quantity-low' : ''}`}>{m.quantity} units</span></td><td>₹{Number(m.price).toFixed(2)}</td>
                <td>{expired ? <span className="pill danger">Expired</span> : expiring ? <span className="pill danger">Expiring soon</span> : m.quantity < 10 ? <span className="pill warning">Low stock</span> : <span className="pill good">In stock</span>}</td>
              </tr>;
            })}</tbody></table></div>
          <div className="table-footer">Showing {medicines.length} medicine(s) · Notes are intentionally excluded from the grid.</div>
        </section>

        <section className="panel form-panel" id="add-medicine">
          <div className="panel-heading"><div><h2>Add a medicine</h2><p>Enter the medicine details below. Price supports two decimal places.</p></div></div>
          <form onSubmit={addMedicine} className="form-grid">
            <label>Full name *<input name="fullName" value={form.fullName} onChange={updateForm} minLength="2" maxLength="120" required placeholder="e.g. Paracetamol 500mg" /></label>
            <label>Brand *<input name="brand" value={form.brand} onChange={updateForm} required maxLength="100" placeholder="Manufacturer / brand" /></label>
            <label>Expiry date *<input type="date" name="expiryDate" value={form.expiryDate} onChange={updateForm} required /></label>
            <label>Quantity *<input type="number" name="quantity" value={form.quantity} onChange={updateForm} min="0" step="1" required /></label>
            <label>Price (₹) *<input type="number" name="price" value={form.price} onChange={updateForm} min="0.01" max="9999999.99" step="0.01" required placeholder="0.00" /></label>
            <label className="full-width">Notes<textarea name="notes" value={form.notes} onChange={updateForm} maxLength="1000" rows="3" placeholder="Optional notes about this medicine" /></label>
            <div className="form-actions full-width"><button type="reset" className="secondary-btn" onClick={() => setForm(emptyMedicine)}>Clear</button><button className="primary-btn" type="submit">Save medicine</button></div>
          </form>
        </section>
      </> : <>
        <section className="panel">
          <div className="panel-heading"><div><h2>Record a sale</h2><p>Sales reduce stock automatically and are saved to the server JSON file.</p></div></div>
          <form className="sale-form" onSubmit={recordSale}>
            <label>Medicine<select required value={saleMedicineId} onChange={e => setSaleMedicineId(e.target.value)}><option value="">Select a medicine</option>{medicines.map(m => <option key={m.id} value={m.id} disabled={m.quantity < 1}>{m.fullName} — {m.quantity} available (₹{Number(m.price).toFixed(2)})</option>)}</select></label>
            <label>Quantity sold<input type="number" min="1" step="1" required value={saleQuantity} onChange={e => setSaleQuantity(e.target.value)} /></label>
            <button className="primary-btn sale-submit" type="submit">Record sale</button>
          </form>
        </section>
        <section className="panel"><div className="panel-heading"><div><h2>Sales history</h2><p>Previously recorded transactions.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>MEDICINE</th><th>DATE / TIME (UTC)</th><th>QTY SOLD</th><th>UNIT PRICE</th><th>TOTAL</th></tr></thead><tbody>
            {sales.length === 0 ? <tr><td colSpan="5" className="empty">No sales recorded yet.</td></tr> : sales.map(s => <tr key={s.id}><td><strong>{s.medicineName}</strong></td><td>{new Date(s.soldAtUtc).toLocaleString()}</td><td>{s.quantitySold}</td><td>₹{Number(s.unitPrice).toFixed(2)}</td><td><strong>₹{Number(s.totalAmount).toFixed(2)}</strong></td></tr>)}
          </tbody></table></div><div className="table-footer">{sales.length} sale record(s)</div>
        </section>
      </>}
      <footer>ABC Pharmacy <span>•</span> Inventory & Sales Management</footer>
    </main>
  </div>;
}

export default App;
