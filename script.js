let tipoActual = "quiniela";
let registros = JSON.parse(localStorage.getItem("registros") || "[]");
let editandoId = null;
let offsetSemana = 0;

let fechaSeleccionada = obtenerFechaHoy();

// =========================
// 📅 MANEJO DE FECHAS
// =========================

function obtenerFechaHoy() {
  const hoy = new Date();
  return formatearFecha(hoy);
}

function formatearFecha(fecha) {
  const d = String(fecha.getDate()).padStart(2, "0");
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const a = fecha.getFullYear();
  return `${d}/${m}/${a}`;
}

// =========================
// 📅 SEMANA (BOTONES ARRIBA)
// =========================

function generarSemana() {
  const contenedor = document.getElementById("diasSemana");
  contenedor.innerHTML = "";

  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = (dia + 6) % 7;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diff);

  for (let i = -7; i <= 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);

    const fechaStr = formatearFecha(d);

    const btn = document.createElement("button");
    btn.textContent = fechaStr;

    if (fechaStr === fechaSeleccionada) {
      btn.classList.add("active");
    }

    btn.onclick = () => {
      fechaSeleccionada = fechaStr;
      generarSemana();
      render();
    };

    // 👉 DOBLE CLICK abre detalle
    btn.ondblclick = () => verDetalleDia(fechaStr);

    contenedor.appendChild(btn);
  }
}

// =========================
// 📅 HISTORIAL (PANTALLA COMPLETA)
// =========================

function abrirHistorial() {
  document.getElementById("pantallaPrincipal").style.display = "none";
  document.getElementById("pantallaHistorial").style.display = "block";
  generarHistorialSemanal();
}

function cambiarSemana(valor) {
  offsetSemana += valor;
  generarHistorialSemanal();
}

function cerrarHistorial() {
  document.getElementById("pantallaHistorial").style.display = "none";
  document.getElementById("pantallaPrincipal").style.display = "block";
}

// =========================
// 🎛 BOTONES
// =========================

document.getElementById("btnQuiniela").onclick = () => {
  tipoActual = "quiniela";
  activarBoton("btnQuiniela");
};

document.getElementById("btnLotipago").onclick = () => {
  tipoActual = "lotipago";
  activarBoton("btnLotipago");
};

function activarBoton(id) {
  document.getElementById("btnQuiniela").classList.remove("active");
  document.getElementById("btnLotipago").classList.remove("active");
  document.getElementById(id).classList.add("active");
}

// =========================
// 💾 GUARDAR
// =========================

function guardar() {
  const metodo = document.getElementById("metodo").value;
  const cliente = document.getElementById("cliente").value;
  const monto = parseFloat(document.getElementById("monto").value);

  if (!monto || monto <= 0) return;

  if (cliente === "propio" && metodo === "fiado") {
    alert("No podés fiarte a vos mismo");
    return;
  }

  let comision = 0;
  let arancel = 0;
  let ganancia = 0;

  if (tipoActual === "quiniela") {
    comision = monto * 0.15;
    arancel = comision * 0.1113;
    ganancia = comision - arancel;
  } else {
    ganancia = monto * 0.008;
  }

  const estado =
    metodo === "fiado" ? "fiado" :
    cliente === "propio" ? "propio" :
    "pagado";

  const registro = {
    id: editandoId ? editandoId : Date.now().toString(),
    fecha: fechaSeleccionada,
    tipo: tipoActual,
    metodo,
    cliente,
    monto,
    comision,
    arancel,
    ganancia,
    estado
  };

  if (editandoId) {
    const index = registros.findIndex(r => String(r.id) === String(editandoId));
    if (index !== -1) registros[index] = registro;
    editandoId = null;
  } else {
    registros.push(registro);
  }

  localStorage.setItem("registros", JSON.stringify(registros));
  document.getElementById("monto").value = "";

  render();
}

// =========================
// 🧾 RENDER
// =========================

function render() {
  const tabla = document.getElementById("tablaDatos");
  tabla.innerHTML = "";

  const filtroEstado = document.getElementById("filtroEstado").value;
  const filtroTipo = document.getElementById("filtroTipo").value;

  registros.forEach(r => {

    if (r.fecha !== fechaSeleccionada) return;
    if (filtroEstado !== "todos" && r.estado !== filtroEstado) return;
    if (filtroTipo !== "todos" && r.tipo !== filtroTipo) return;

    let clase = "verde";
    if (r.estado === "fiado") clase = "rojo";
    if (r.estado === "propio") clase = "amarillo";

    tabla.innerHTML += `
      <tr class="${clase}">
        <td>${r.fecha}</td>
        <td>${r.tipo}</td>
        <td>${r.metodo}</td>
        <td>${r.cliente}</td>
        <td>$${r.monto.toFixed(2)}</td>
        <td>$${r.comision.toFixed(2)}</td>
        <td>$${r.arancel.toFixed(2)}</td>
        <td>$${r.ganancia.toFixed(2)}</td>
        <td>
          <button onclick="editar('${r.id}')">✏️</button>
          <button onclick="eliminar('${r.id}')">🗑️</button>
          ${r.estado === "fiado" ? `<button onclick="saldar('${r.id}')">💰</button>` : ""}
        </td>
      </tr>
    `;
  });

  actualizarResumen();
  generarHistorialSemanal();
}

// =========================
// 📊 RESUMEN
// =========================

function actualizarResumen() {
  let qRec = 0, qGan = 0;
  let lRec = 0, lGan = 0;
  let totalFiado = 0;
  let totalGanancia = 0;
  let totalMovimiento = 0;

  registros.forEach(r => {
    if (r.fecha !== fechaSeleccionada) return;

    if (r.estado === "fiado") {
      totalFiado += r.monto;
      return;
    }

    if (r.estado === "propio") return;

    if (r.tipo === "quiniela") {
      qRec += r.monto;
      qGan += r.ganancia;
    } else {
      lRec += r.monto;
      lGan += r.ganancia;
    }

    totalGanancia += r.ganancia;
    totalMovimiento += r.monto;
  });

  document.getElementById("resumenContenido").innerHTML = `
    📅 <b>${fechaSeleccionada}</b><br><br>
    🎰 Quiniela: $${qRec.toFixed(2)} | Ganancia: $${qGan.toFixed(2)}<br>
    🧾 Lotipago: $${lRec.toFixed(2)} | Ganancia: $${lGan.toFixed(2)}<br><br>
    📒 Fiados: $${totalFiado.toFixed(2)}<br><br>
    🏆 Premios pendientes: $${totalPremiosPendientes().toFixed(2)}<br><br>
    💵TOTAL DEL DÍA: $${(totalMovimiento - premiosDelDia()).toFixed(2)}
    💰 <b>GANANCIA DEL DÍA: $${totalGanancia.toFixed(2)}</b>
  `;
}

// =========================
// 🔍 DETALLE DEL DÍA (NUEVO)
// =========================

function verDetalleDia(fecha) {

  let qRec = 0, qGan = 0;
  let lRec = 0, lGan = 0;
  let totalFiado = 0;
  let totalGanancia = 0;
  let totalMovimiento = 0;

  registros.forEach(r => {
    if (r.fecha !== fecha) return;

    if (r.estado === "fiado") {
      totalFiado += r.monto;
      return;
    }

    if (r.estado === "propio") return;

    if (r.tipo === "quiniela") {
      qRec += r.monto;
      qGan += r.ganancia;
    } else {
      lRec += r.monto;
      lGan += r.ganancia;
    }

    totalGanancia += r.ganancia;
    totalMovimiento += r.monto;
  });

  const html = `
    <h3>📅 ${fecha}</h3><br>

    🎰 Quiniela: $${qRec.toFixed(2)} | Ganancia: $${qGan.toFixed(2)}<br>
    🧾 Lotipago: $${lRec.toFixed(2)} | Ganancia: $${lGan.toFixed(2)}<br><br>

    📒 Fiados: $${totalFiado.toFixed(2)}<br><br>

    💵 <b>TOTAL DEL DÍA: $${totalMovimiento.toFixed(2)}</b><br>
    💰 <b>GANANCIA DEL DÍA: $${totalGanancia.toFixed(2)}</b>
  `;

  document.getElementById("detalleDiaContenido").innerHTML = html;

  // navegación tipo app
  document.getElementById("pantallaHistorial").style.display = "none";
  document.getElementById("pantallaDetalleDia").style.display = "block";
}

function cerrarDetalle() {
  document.getElementById("pantallaDetalleDia").style.display = "none";
  document.getElementById("pantallaHistorial").style.display = "block";
}

// =========================
// 📅 HISTORIAL SEMANAL
// =========================

function generarHistorialSemanal() {
  const contenedor = document.getElementById("historialSemanal");
  contenedor.innerHTML = "";

  const hoy = new Date();
  hoy.setDate(hoy.getDate() + offsetSemana);

  const dia = hoy.getDay();
  const diff = (dia + 6) % 7;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diff);

  for (let i = -7; i <= 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);

    const fecha = formatearFecha(d);

    let total = 0;
    let ganancia = 0;

    registros.forEach(r => {
      if (r.fecha !== fecha) return;
      if (r.estado === "fiado" || r.estado === "propio") return;

      total += r.monto;
      ganancia += r.ganancia;
    });

    const div = document.createElement("div");
    div.className = "itemHistorial";

    // 👉 CLICK abre detalle
    div.onclick = () => verDetalleDia(fecha);

    div.innerHTML = `
      <b>${fecha}</b><br>
      Total movido: $${total.toFixed(2)}<br>
      Ganancia: $${ganancia.toFixed(2)}
    `;

    contenedor.appendChild(div);
  }
}

// =========================
// 🧾 EXPORTAR SOLO EXCEL
// =========================

function exportarCierreCaja() {

  const filas = [];

  registros.forEach(r => {
    if (r.fecha !== fechaSeleccionada) return;

    filas.push({
      Fecha: r.fecha,
      Tipo: r.tipo,
      Metodo: r.metodo,
      Cliente: r.cliente,
      Monto: r.monto,
      Comision: r.comision,
      Arancel: r.arancel,
      Ganancia: r.ganancia,
      Estado: r.estado
    });
  });

  if (filas.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(filas);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Cierre");

  const fecha = fechaSeleccionada.replace(/\//g, "-");

  XLSX.writeFile(workbook, `Cierre_${fecha}.xlsx`);
}
//---------------------------

function editar(id) {
  const r = registros.find(x => x.id == id);
  if (!r) return;

  tipoActual = r.tipo;
  document.getElementById("monto").value = r.monto;
  document.getElementById("metodo").value = r.metodo;
  document.getElementById("cliente").value = r.cliente;

  editandoId = id;
}

function eliminar(id) {
  if (!confirm("¿Eliminar registro?")) return;
  registros = registros.filter(r => r.id != id);
  localStorage.setItem("registros", JSON.stringify(registros));
  render();
}

function saldar(id) {
  const r = registros.find(x => x.id == id);
  if (!r) return;

  r.estado = "pagado";
  r.metodo = "efectivo";

  localStorage.setItem("registros", JSON.stringify(registros));
  render();
}

// =========================
// PREMIOS
// =========================

let premios = JSON.parse(localStorage.getItem("premios") || "[]");

function registrarPremio(){

const monto = parseFloat(prompt("Monto del premio"));

if(!monto || monto<=0) return;

premios.push({
id: Date.now(),
fecha: fechaSeleccionada,
monto,
pagado:false
});

localStorage.setItem("premios", JSON.stringify(premios));

render();
}

function abrirPantallaPremios(){

document.getElementById("pantallaPrincipal").style.display="none";
document.getElementById("pantallaPremios").style.display="block";

renderPremios();
}

function cerrarPantallaPremios(){

document.getElementById("pantallaPremios").style.display="none";
document.getElementById("pantallaPrincipal").style.display="block";

}

function renderPremios(){

const cont=document.getElementById("listaPremios");

cont.innerHTML="";

premios.forEach(p=>{

if(p.pagado) return;

const div=document.createElement("div");

div.className="itemHistorial";

div.innerHTML=`

<b>${p.fecha}</b><br>

Premio: $${p.monto.toFixed(2)}

<br><br>

<button onclick="pagarPremio(${p.id})">

💰 Pagar premio

</button>

`;

cont.appendChild(div);

});

}

function pagarPremio(id){

if(!confirm("¿Pagar este premio?")) return;

const p=premios.find(x=>x.id==id);

if(!p) return;

p.pagado=true;

localStorage.setItem("premios", JSON.stringify(premios));

renderPremios();

render();

}

// =========================
// CALCULO TOTAL PREMIOS
// =========================

function totalPremiosPendientes(){

let total=0;

premios.forEach(p=>{

if(!p.pagado){

total+=p.monto;

}

});

return total;

}

function premiosDelDia(){

let total=0;

premios.forEach(p=>{

if(!p.pagado && p.fecha===fechaSeleccionada){

total+=p.monto;

}

});

return total;

}

// =========================
// 🚀 INICIO
// =========================

generarSemana();
render();