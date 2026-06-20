// Templates de accesorios por tipo de proyecto
const ACC_TEMPLATES = {
  llavero: [
    { nombre: 'Argolla partida 20mm', cant: 1, precio: 200 },
    { nombre: 'Mosquetón chico', cant: 1, precio: 250 },
  ],
  lampara: [
    { nombre: 'Portalámparas E27', cant: 1, precio: 3000 },
    { nombre: 'Cable H05VV-F 1.5m', cant: 1, precio: 2500 },
    { nombre: 'Enchufe', cant: 1, precio: 1500 },
    { nombre: 'Interruptor', cant: 1, precio: 2000 },
    { nombre: 'Bombilla LED', cant: 1, precio: 3000 },
  ],
  soporte: [
    { nombre: 'Adhesivo 3M VHB', cant: 1, precio: 1000 },
  ],
  macetero: [
    { nombre: 'Cordel 3mm (1m)', cant: 1, precio: 300 },
    { nombre: 'Bandeja recolectora', cant: 1, precio: 1500 },
  ],
  juguete: [
    { nombre: 'Ojos seguridad 10mm', cant: 1, precio: 300 },
  ],
  caja: [
    { nombre: 'Bisagra pequeña', cant: 1, precio: 1500 },
    { nombre: 'Imán neodimio 10x3mm', cant: 2, precio: 500 },
  ],
  electronico: [
    { nombre: 'Arduino / RPi', cant: 1, precio: 15000 },
    { nombre: 'Cables + conectores', cant: 1, precio: 3000 },
    { nombre: 'Fuente de poder', cant: 1, precio: 5000 },
  ],
  otro: [],
  ninguno: [],
};

// Empaque costs
const EMPAQUE_COSTS = {
  ninguno: 0,
  bolsa: 150,
  cajaChica: 400,
  cajaMediana: 1000,
  personalizado: 0,
};

// DOM refs
const $ = id => document.getElementById(id);

const form = $('calcForm');
const nombre = $('nombre');
const tipoProyecto = $('tipoProyecto');
const precioRollo = $('precioRollo');
const pesoRollo = $('pesoRollo');
const gramosUsados = $('gramosUsados');
const potencia = $('potencia');
const tiempoHoras = $('tiempoHoras');
const tiempoMinutos = $('tiempoMinutos');
const tarifaLuz = $('tarifaLuz');
const precioImpresora = $('precioImpresora');
const vidaUtil = $('vidaUtil');
const mantenimiento = $('mantenimiento');
const manoObraHoras = $('manoObraHoras');
const valorHora = $('valorHora');
const tipoEmpaque = $('tipoEmpaque');
const costoEmpaque = $('costoEmpaque');
const costoSticker = $('costoSticker');
const margen = $('margen');
const accesoriosContainer = $('accesoriosContainer');
const addAccBtn = $('addAccesorio');

const resultados = $('resultados');
const costoTotalDisplay = $('costoTotalDisplay');
const precioVentaDisplay = $('precioVentaDisplay');
const margenDisplay = $('margenDisplay');
const breakdownIds = ['Filamento','Electricidad','Depreciacion','Mantenimiento','Accesorios','Envoltorio','ManoObra'];
const historial = $('historial');
const historialLista = $('historialLista');
const themeToggle = $('themeToggle');

let chart = null;

// Init: load from localStorage
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadFromLocalStorage();
  setupEventListeners();
  actualizarAccesorios();
  calcular();
  cargarHistorial();
});

function setupEventListeners() {
  // All inputs trigger calculate
  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', calcular);
    el.addEventListener('change', calcular);
  });

  // Accesorio template on project type change
  tipoProyecto.addEventListener('change', actualizarAccesorios);

  // Add/remove accesorio
  addAccBtn.addEventListener('click', addAccesorioRow);
  accesoriosContainer.addEventListener('click', e => {
    if (e.target.classList.contains('remove-acc')) {
      e.target.closest('.accesorio-row').remove();
      calcular();
    }
  });
  accesoriosContainer.addEventListener('input', calcular);

  // Empaque type -> auto cost
  tipoEmpaque.addEventListener('change', () => {
    const val = tipoEmpaque.value;
    if (val !== 'personalizado') {
      costoEmpaque.value = EMPAQUE_COSTS[val];
    }
    calcular();
  });

  // Save / export / clear
  $('guardarBtn').addEventListener('click', guardarHistorial);
  $('exportBtn').addEventListener('click', exportCSV);
  $('limpiarHistorial').addEventListener('click', limpiarHistorial);
  themeToggle.addEventListener('click', toggleTheme);
}

// ====== ACCESORIOS ======
function actualizarAccesorios() {
  const tipo = tipoProyecto.value;
  const template = ACC_TEMPLATES[tipo] || [];
  accesoriosContainer.innerHTML = '';
  if (template.length === 0) {
    addAccesorioRow(); // empty row
  } else {
    template.forEach((acc, i) => {
      const row = createAccRow(acc.nombre, acc.cant, acc.precio);
      accesoriosContainer.appendChild(row);
    });
  }
  calcular();
}

function addAccesorioRow() {
  const row = createAccRow('', 1, 0);
  accesoriosContainer.appendChild(row);
  calcular();
}

function createAccRow(nombre = '', cant = 1, precio = 0) {
  const div = document.createElement('div');
  div.className = 'accesorio-row';
  div.innerHTML = `
    <input type="text" class="acc-nombre" placeholder="Nombre" value="${nombre}">
    <input type="number" class="acc-cant" placeholder="Cant" value="${cant}" min="0" step="1">
    <input type="number" class="acc-precio" placeholder="$ c/u" value="${precio}" min="0" step="50">
    <button type="button" class="icon-btn remove-acc" title="Eliminar">✕</button>
  `;
  return div;
}

function leerAccesorios() {
  const rows = accesoriosContainer.querySelectorAll('.accesorio-row');
  let total = 0;
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const nombre = inputs[0]?.value || '';
    const cant = parseFloat(inputs[1]?.value) || 0;
    const precio = parseFloat(inputs[2]?.value) || 0;
    if (nombre && cant > 0) total += cant * precio;
  });
  return total;
}

// ====== CÁLCULO ======
function calcular() {
  const gUsados = parseFloat(gramosUsados.value) || 0;
  const pRollo = parseFloat(precioRollo.value) || 0;
  const gRollo = parseFloat(pesoRollo.value) || 1000;
  const costoFil = gUsados > 0 && pRollo > 0 ? (pRollo / gRollo) * gUsados : 0;

  const pot = parseFloat(potencia.value) || 0;
  const h = parseFloat(tiempoHoras.value) || 0;
  const min = parseFloat(tiempoMinutos.value) || 0;
  const totalHoras = h + min / 60;
  const tarifa = parseFloat(tarifaLuz.value) || 0;
  const costoElec = totalHoras > 0 ? (pot / 1000) * totalHoras * tarifa : 0;

  const pImp = parseFloat(precioImpresora.value) || 0;
  const vUtil = parseFloat(vidaUtil.value) || 3000;
  const costoDep = totalHoras > 0 && pImp > 0 ? (pImp / vUtil) * totalHoras : 0;

  const mant = parseFloat(mantenimiento.value) || 0;
  const costoMant = totalHoras > 0 ? mant * totalHoras : 0;

  const costoAcc = leerAccesorios();

  const empaque = parseFloat(costoEmpaque.value) || 0;
  const sticker = parseFloat(costoSticker.value) || 0;
  const costoEnv = empaque + sticker;

  const moHoras = parseFloat(manoObraHoras.value) || 0;
  const moValor = parseFloat(valorHora.value) || 0;
  const costoMO = moHoras * moValor;

  const total = costoFil + costoElec + costoDep + costoMant + costoAcc + costoEnv + costoMO;

  const margenPct = parseFloat(margen.value) || 0;
  const precioVenta = total > 0 ? total * (1 + margenPct / 100) : 0;

  // Display
  if (total > 0) {
    resultados.classList.remove('hidden');
    costoTotalDisplay.textContent = '$' + total.toLocaleString('es-CL', {maximumFractionDigits:0});
    precioVentaDisplay.textContent = '$' + precioVenta.toLocaleString('es-CL', {maximumFractionDigits:0});
    margenDisplay.textContent = `(+${margenPct}%)`;

    const costs = [costoFil, costoElec, costoDep, costoMant, costoAcc, costoEnv, costoMO];
    const labels = ['🧵 Filamento','⚡ Electricidad','🖨️ Depreciación','🔧 Mantenimiento','🔧 Accesorios','📦 Envoltorio','👷 Mano de obra'];
    const ids = ['costoFilamento','costoElectricidad','costoDepreciacion','costoMantenimiento','costoAccesorios','costoEnvoltorio','costoManoObra'];

    ids.forEach((id, i) => {
      $(id).textContent = '$' + costs[i].toLocaleString('es-CL', {maximumFractionDigits:0});
    });

    updateChart(labels, costs);
  } else {
    resultados.classList.add('hidden');
  }
}

// ====== CHART ======
function updateChart(labels, data) {
  const filteredLabels = [];
  const filteredData = [];
  data.forEach((v, i) => {
    if (v > 0) { filteredLabels.push(labels[i]); filteredData.push(v); }
  });

  if (filteredData.length === 0) return;

  if (chart) chart.destroy();

  const ctx = document.getElementById('costChart').getContext('2d');
  const colors = ['#f59e0b','#3b82f6','#22c55e','#ef4444','#a855f7','#ec4899','#06b6d4'];

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filteredLabels,
      datasets: [{
        data: filteredData,
        backgroundColor: colors.slice(0, filteredData.length),
        borderColor: '#1a1a2e',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e0e0e0', font: { size: 11 }, padding: 8 }
        }
      }
    }
  });
}

// ====== HISTORIAL ======
function guardarHistorial() {
  const name = nombre.value.trim() || 'Sin nombre';
  const totalText = costoTotalDisplay.textContent;
  const total = parseFloat(totalText.replace(/[$,]/g, '')) || 0;
  if (total === 0) return;

  const entry = {
    id: Date.now(),
    fecha: new Date().toLocaleDateString('es-CL'),
    nombre: name,
    total: total,
    detalle: document.getElementById('breakdown').innerHTML,
  };

  let hist = JSON.parse(localStorage.getItem('printCostHistory') || '[]');
  hist.unshift(entry);
  if (hist.length > 50) hist = hist.slice(0, 50);
  localStorage.setItem('printCostHistory', JSON.stringify(hist));
  cargarHistorial();
  calcular(); // refresh
}

function cargarHistorial() {
  const hist = JSON.parse(localStorage.getItem('printCostHistory') || '[]');
  if (hist.length === 0) {
    historial.classList.add('hidden');
    return;
  }
  historial.classList.remove('hidden');
  historialLista.innerHTML = '';
  hist.forEach(h => {
    const div = document.createElement('div');
    div.className = 'historial-item';
    div.innerHTML = `
      <div>
        <div class="hi-name">${h.nombre}</div>
        <div class="hi-date">${h.fecha}</div>
      </div>
      <div class="hi-cost">$${h.total.toLocaleString('es-CL', {maximumFractionDigits:0})}</div>
    `;
    historialLista.appendChild(div);
  });
}

function exportCSV() {
  const hist = JSON.parse(localStorage.getItem('printCostHistory') || '[]');
  if (hist.length === 0) return;
  let csv = 'Fecha,Nombre,Costo Total\n';
  hist.forEach(h => { csv += `${h.fecha},"${h.nombre}",${h.total}\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'costos-3d-historial.csv'; a.click();
  URL.revokeObjectURL(url);
}

function limpiarHistorial() {
  if (!confirm('¿Eliminar todo el historial?')) return;
  localStorage.removeItem('printCostHistory');
  cargarHistorial();
}

// ====== THEME ======
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  themeToggle.textContent = isLight ? '🌙' : '☀️';
  // Refresh chart colors
  const totalText = costoTotalDisplay.textContent;
  if (totalText && totalText !== '$0') calcular();
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = '🌙';
  } else {
    themeToggle.textContent = '☀️';
  }
}

// ====== PERSISTENCIA DE CAMPOS ======
function saveToLocalStorage() {
  // Save current input values
  const inputs = form.querySelectorAll('input, select');
  const data = {};
  inputs.forEach(el => {
    if (el.id) data[el.id] = el.value;
  });
  // Save accessories
  const accs = [];
  accesoriosContainer.querySelectorAll('.accesorio-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    accs.push({
      nombre: inputs[0]?.value || '',
      cant: inputs[1]?.value || '1',
      precio: inputs[2]?.value || '0',
    });
  });
  data.accesorios = accs;
  localStorage.setItem('printCostForm', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('printCostForm');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    Object.keys(data).forEach(key => {
      if (key === 'accesorios') return;
      const el = $(key);
      if (el) el.value = data[key];
    });
    if (data.accesorios && data.accesorios.length > 0) {
      accesoriosContainer.innerHTML = '';
      data.accesorios.forEach(acc => {
        const row = createAccRow(acc.nombre, parseInt(acc.cant) || 1, parseInt(acc.precio) || 0);
        accesoriosContainer.appendChild(row);
      });
    }
  } catch(e) {}
}

// Auto-save periodically
setInterval(saveToLocalStorage, 5000);
// Also save on page unload
window.addEventListener('beforeunload', saveToLocalStorage);
