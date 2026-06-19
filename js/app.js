// Variable global en memoria para sostener el estado actual del cálculo
let calculoActual = null;

// Instancia del gráfico de Chart.js (se recrea en cada cálculo)
let chartCosto = null;

// Escuchar el evento de carga inicial de la página web para renderizar el historial guardado anteriormente
document.addEventListener("DOMContentLoaded", () => {
    actualizarTablaHistorial();

    // Permitir ejecutar el cálculo presionando Enter en cualquiera de los campos
    ['nombreSim', 'energia', 'latencia'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                procesarCalculo();
            }
        });
    });
});

function procesarCalculo() {
    // 1. Capturar los elementos del Front-end
    let nombre = document.getElementById('nombreSim').value.trim() || "Simulación General";
    let energiaRaw = document.getElementById('energia').value.trim();
    let latenciaRaw = document.getElementById('latencia').value.trim();

    // 2. Control de Errores y Validaciones Técnicas
    if (energiaRaw === "" || latenciaRaw === "") {
        mostrarToast("Por favor complete ambos campos numéricos antes de calcular.", "error");
        return;
    }

    let a = Number(energiaRaw);
    let b = Number(latenciaRaw);

    if (isNaN(a) || isNaN(b)) {
        mostrarToast("Los valores ingresados deben ser numéricos.", "error");
        return;
    }
    if (a <= 0 || b <= 0) {
        mostrarToast("Los valores deben ser estrictamente mayores a cero.", "error");
        return;
    }
    if (!isFinite(a) || !isFinite(b)) {
        mostrarToast("Los valores ingresados son demasiado grandes para procesar.", "error");
        return;
    }

    // 3. Algoritmo Lógico Basado en Cálculo Diferencial
    // Minimizando C(x) = ax + b/x  => C'(x) = a - b/x^2 = 0 => x = sqrt(b/a)
    let x_optimo = Math.sqrt(b / a);
    let x_redondeado = Math.round(x_optimo);
    if (x_redondeado < 1) x_redondeado = 1; // Seguridad de infraestructura: mínimo 1 servidor encendido

    // Calcular el costo mínimo total sustituyendo la x óptima en la función original
    let costo_minimo_total = (a * x_redondeado) + (b / x_redondeado);

    // Segunda derivada C''(x) = 2b/x^3, evaluada en el punto óptimo, para confirmar que es un mínimo
    let segunda_derivada_valor = (2 * b) / Math.pow(x_redondeado, 3);
    let esMinimoConfirmado = segunda_derivada_valor > 0;

    // 4. Guardar temporalmente los resultados en un objeto de estado
    calculoActual = {
        id: Date.now(),
        nombre: nombre,
        energia: a,
        latencia: b,
        servidores: x_redondeado,
        costoTotal: costo_minimo_total.toFixed(2)
    };

    // 5. Renderizar los resultados de forma dinámica en la interfaz
    document.getElementById('numServidores').innerText = x_redondeado;
    document.getElementById('costoMinimo').innerText = `$${costo_minimo_total.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;

    // Mostrar fórmulas aplicadas dinámicamente con los números del usuario
    document.getElementById('eqBase').innerText = `C(x) = ${a}x + ${b}/x`;
    document.getElementById('eqDerivada').innerText = `C'(x) = ${a} - ${b}/x²`;
    document.getElementById('eqSegundaDerivada').innerText = `C''(x) = 2(${b})/x³ = ${segunda_derivada_valor.toFixed(4)} en x = ${x_redondeado}`;

    let confirmacion = document.getElementById('confirmacionMinimo');
    if (esMinimoConfirmado) {
        confirmacion.innerHTML = `<strong style="color:#4ade80;">✔ Mínimo confirmado:</strong> C''(x) &gt; 0, la curva es cóncava hacia arriba en este punto.`;
    } else {
        confirmacion.innerHTML = `<strong style="color:#f87171;">✘ Advertencia:</strong> no se pudo confirmar concavidad positiva.`;
    }

    // Mostrar la sección de resultados ocultos con efecto visual directo
    document.getElementById('cardResultado').style.display = 'block';

    // 6. Dibujar el gráfico de la curva de costo total con el punto óptimo marcado
    dibujarGraficoCosto(a, b, x_redondeado, costo_minimo_total);
}

function dibujarGraficoCosto(a, b, x_optimo, costo_optimo) {
    const ctx = document.getElementById('chartCosto');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        // La librería Chart.js no llegó a cargar desde el CDN (sin internet, CDN bloqueado, etc.)
        console.error('Chart.js no está disponible: revisa la conexión a internet o si el CDN está bloqueado.');
        ctx.parentElement.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 30px 0;">⚠️ No se pudo cargar la librería del gráfico (Chart.js). Verifica tu conexión a internet y recarga la página.</p>';
        return;
    }

    // Generar un rango de puntos alrededor del óptimo para trazar C(x)
    let xMax = Math.max(x_optimo * 3, 10);
    let paso = xMax / 60;
    let puntos = [];
    for (let x = paso; x <= xMax; x += paso) {
        puntos.push({ x: parseFloat(x.toFixed(2)), y: (a * x) + (b / x) });
    }

    if (chartCosto) {
        chartCosto.destroy();
    }

    chartCosto = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'C(x) = costo total',
                    data: puntos,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.08)',
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 2,
                    tension: 0.15
                },
                {
                    label: 'Punto óptimo',
                    data: [{ x: x_optimo, y: costo_optimo }],
                    borderColor: '#16a34a',
                    backgroundColor: '#16a34a',
                    pointRadius: 6,
                    pointHoverRadius: 7,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Servidores activos (x)', color: '#64748b' },
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(15,23,42,0.06)' }
                },
                y: {
                    title: { display: true, text: 'Costo total ($)', color: '#64748b' },
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(15,23,42,0.06)' }
                }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#1e293b' } }
            }
        }
    });
}

function guardarEnHistorial() {
    if (!calculoActual) return;

    // Obtener lo que ya esté en la base de datos local (localStorage) o crear un arreglo vacío si es la primera vez
    let historial = JSON.parse(localStorage.getItem('abpro_simulaciones')) || [];

    // Añadir la simulación actual al registro
    historial.push(calculoActual);

    // Volver a escribir en el almacenamiento del navegador en formato JSON string
    localStorage.setItem('abpro_simulaciones', JSON.stringify(historial));

    // Indicar éxito al alumno mediante notificación no bloqueante
    mostrarToast(`Simulación "${calculoActual.nombre}" guardada en el registro.`, "success");

    // Forzar renderizado actualizado de la tabla
    actualizarTablaHistorial();
}

function actualizarTablaHistorial() {
    let historial = JSON.parse(localStorage.getItem('abpro_simulaciones')) || [];
    let tbody = document.querySelector('#tablaHistorial tbody');
    let emptyState = document.getElementById('historialVacio');

    // Limpiar registros antiguos antes de pintar
    tbody.innerHTML = "";

    if (historial.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    // Iterar cada simulación guardada y armar las filas de forma segura (sin innerHTML con datos de usuario)
    historial.forEach((sim) => {
        let fila = document.createElement('tr');

        let tdNombre = document.createElement('td');
        let strongNombre = document.createElement('strong');
        strongNombre.textContent = sim.nombre;
        tdNombre.appendChild(strongNombre);

        let tdEnergia = document.createElement('td');
        tdEnergia.textContent = `$${sim.energia}/u`;

        let tdLatencia = document.createElement('td');
        tdLatencia.textContent = `$${sim.latencia}`;

        let tdSolucion = document.createElement('td');
        let spanServ = document.createElement('span');
        spanServ.style.color = 'var(--success)';
        spanServ.style.fontWeight = 'bold';
        spanServ.textContent = `${sim.servidores} serv.`;
        let br = document.createElement('br');
        let small = document.createElement('small');
        small.style.color = 'var(--text-muted)';
        small.textContent = `Costo: $${parseFloat(sim.costoTotal).toLocaleString('es-CL')}`;
        tdSolucion.appendChild(spanServ);
        tdSolucion.appendChild(br);
        tdSolucion.appendChild(small);

        let tdAcciones = document.createElement('td');
        let btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-danger';
        btnEliminar.textContent = 'Eliminar';
        // Identificamos cada registro por su id único (no por índice de array), evitando borrar el registro equivocado
        btnEliminar.addEventListener('click', () => eliminarRegistro(sim.id));
        tdAcciones.appendChild(btnEliminar);

        fila.appendChild(tdNombre);
        fila.appendChild(tdEnergia);
        fila.appendChild(tdLatencia);
        fila.appendChild(tdSolucion);
        fila.appendChild(tdAcciones);

        tbody.appendChild(fila);
    });
}

function eliminarRegistro(id) {
    let historial = JSON.parse(localStorage.getItem('abpro_simulaciones')) || [];
    historial = historial.filter(sim => sim.id !== id);
    localStorage.setItem('abpro_simulaciones', JSON.stringify(historial));
    actualizarTablaHistorial();
    mostrarToast("Registro eliminado.", "success");
}

// Exporta el historial completo a un archivo descargable (CSV o JSON)
function exportarHistorial(formato) {
    let historial = JSON.parse(localStorage.getItem('abpro_simulaciones')) || [];

    if (historial.length === 0) {
        mostrarToast("No hay simulaciones guardadas para exportar.", "error");
        return;
    }

    let contenido, tipoMime, nombreArchivo;

    if (formato === 'json') {
        contenido = JSON.stringify(historial, null, 2);
        tipoMime = 'application/json';
        nombreArchivo = 'historial_simulaciones.json';
    } else {
        let encabezados = ['nombre', 'energia', 'latencia', 'servidores', 'costoTotal'];
        let filas = historial.map(sim =>
            encabezados.map(campo => `"${String(sim[campo]).replace(/"/g, '""')}"`).join(',')
        );
        contenido = [encabezados.join(','), ...filas].join('\n');
        tipoMime = 'text/csv';
        nombreArchivo = 'historial_simulaciones.csv';
    }

    let blob = new Blob([contenido], { type: `${tipoMime};charset=utf-8;` });
    let url = URL.createObjectURL(blob);
    let enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    mostrarToast(`Historial exportado como ${nombreArchivo}`, "success");
}

// Sistema simple de notificaciones (toasts) para reemplazar alert() bloqueante
function mostrarToast(mensaje, tipo = "success") {
    let contenedor = document.getElementById('toastContainer');
    if (!contenedor) {
        // Respaldo por si el contenedor no existe en el HTML
        alert(mensaje);
        return;
    }

    let toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);

    // Auto-remover el toast después de unos segundos
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
