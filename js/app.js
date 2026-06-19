// Variable global en memoria para sostener el estado actual del cálculo
let calculoActual = null;

// Escuchar el evento de carga inicial de la página web para renderizar el historial guardado anteriormente
document.addEventListener("DOMContentLoaded", () => {
    actualizarTablaHistorial();
});

function procesarCalculo() {
    // 1. Capturar los elementos del Front-end
    let nombre = document.getElementById('nombreSim').value.trim() || "Simulación General";
    let a = parseFloat(document.getElementById('energia').value);
    let b = parseFloat(document.getElementById('latencia').value);
    
    // 2. Control de Errores y Validaciones Técnicas
    if(isNaN(a) || isNaN(b) || a <= 0 || b <= 0) {
        alert("Error de entrada: Por favor, ingrese valores numéricos válidos superiores a cero.");
        return;
    }
    
    // 3. Algoritmo Lógico Basado en Cálculo Diferencial
    // Minimizando C(x) = ax + b/x  => C'(x) = a - b/x^2 = 0 => x = sqrt(b/a)
    let x_optimo = Math.sqrt(b / a);
    let x_redondeado = Math.round(x_optimo);
    if(x_redondeado < 1) x_redondeado = 1; // Seguridad de infraestructura: mínimo 1 servidor encendido
    
    // Calcular el costo mínimo total sustituyendo la x óptima en la función original
    let costo_minimo_total = (a * x_redondeado) + (b / x_redondeado);

    // 4. Guardar temporalmente los resultados en un objeto de estado
    calculoActual = {
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
    
    // Mostrar la sección de resultados ocultos con efecto visual directo
    document.getElementById('cardResultado').style.display = 'block';
}

function guardarEnHistorial() {
    if (!calculoActual) return;

    // Obtener lo que ya esté en la base de datos local (localStorage) o crear un arreglo vacío si es la primera vez
    let historial = JSON.parse(localStorage.getItem('abpro_simulaciones')) || [];
    
    // Añadir la simulación actual al registro
    historial.push(calculoActual);
    
    // Volver a escribir en el almacenamiento del navegador en formato JSON string
    localStorage.setItem('abpro_simulaciones', JSON.stringify(historial));
    
    // Limpiar entradas e indicar éxito al alumno
    alert(`Éxito: La simulación "${calculoActual.nombre}" fue guardada en el registro del sistema.`);
    
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

    // Iterar cada simulación guardada y armar las filas HTML correspondientes
    historial.forEach((sim, index) => {
        let fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${sim.nombre}</strong></td>
            <td>$${sim.energia}/u</td>
            <td>$${sim.latencia}</td>
            <td><span style="color:var(--success); font-weight:bold;">${sim.servidores} serv.</span> <br><small style="color:var(--text-muted)">Cost: $${parseFloat(sim.costoTotal).toLocaleString('es-CL')}</small></td>
            <td>
                <button class="btn-danger" onclick="eliminarRegistro(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function eliminarRegistro(index) {
    let historial = JSON.parse(localStorage.getItem('abpro_simulaciones')) || [];
    historial.splice(index, 1); // Quitar el elemento de esa posición
    localStorage.setItem('abpro_simulaciones', JSON.stringify(historial));
    actualizarTablaHistorial();
}