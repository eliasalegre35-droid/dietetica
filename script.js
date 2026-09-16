function guardarProducto() {
    let nombre = document.getElementById("nombre").value;
    let precio = document.getElementById("precio").value;
    let cantidad = document.getElementById("cantidad").value;

    let producto = {
        nombre: nombre,
        precio: precio,
        cantidad: cantidad
    };

    let productos = JSON.parse(localStorage.getItem("productos")) || [];

    productos.push(producto);

    localStorage.setItem("productos", JSON.stringify(productos));

    alert("Producto guardado correctamente");
}


function verProductos() {
    let productos = JSON.parse(localStorage.getItem("productos")) || [];

    let lista = document.getElementById("listaProductos");

    lista.innerHTML = "";

    if (productos.length === 0) {
        lista.innerHTML = "<p>No hay productos guardados.</p>";
        return;
    }

    productos.forEach(function(producto) {
        lista.innerHTML += `
            <div>
                <h3>${producto.nombre}</h3>
                <p>Precio: $${producto.precio}</p>
                <p>Cantidad: ${producto.cantidad}</p>
                <hr>
            </div>
        `;
    });
}
function agregarFaltante() {
    let nombre = document.getElementById("nombreFaltante").value.trim();
    let proveedor = document.getElementById("proveedorFaltante").value;

    if (nombre === "") {
        alert("Escribí qué producto falta");
        return;
    }

    if (proveedor === "") {
        alert("Seleccioná un proveedor");
        return;
    }

    let faltantes = JSON.parse(localStorage.getItem("faltantes")) || [];

    let repetido = faltantes.some(function(faltante) {
        return faltante.nombre.toLowerCase() === nombre.toLowerCase() &&
               faltante.proveedor.toLowerCase() === proveedor.toLowerCase();
    });

    if (repetido) {
        alert("Ese faltante ya está cargado");
        return;
    }

    let faltante = {
        nombre: nombre,
        proveedor: proveedor
    };

    faltantes.push(faltante);

    localStorage.setItem("faltantes", JSON.stringify(faltantes));

    document.getElementById("nombreFaltante").value = "";
    document.getElementById("proveedorFaltante").value = "";

    alert("Faltante agregado");
}

function verFaltantes() {
    let faltantes = JSON.parse(localStorage.getItem("faltantes")) || [];

    let lista = document.getElementById("listaFaltantes");

    lista.innerHTML = "";

    if (faltantes.length === 0) {
        lista.innerHTML = "<p>No hay faltantes.</p>";
        return;
    }

    faltantes.forEach(function(faltante, indice) {

        if (typeof faltante === "string") {
            faltante = {
                nombre: faltante,
                proveedor: "Sin proveedor"
            };
        }

        lista.innerHTML += `
            <div>
                <p>❌ <strong>${faltante.nombre}</strong></p>
                <p>Proveedor: ${faltante.proveedor}</p>

                <button onclick="solucionarFaltante(${indice})">
                    Solucionado
                </button>

                <hr>
            </div>
        `;
    });
}

function filtrarFaltantes() {
    let proveedorBuscado = document.getElementById("filtroProveedor").value.trim().toLowerCase();

    let faltantes = JSON.parse(localStorage.getItem("faltantes")) || [];

    let lista = document.getElementById("listaFaltantes");

    lista.innerHTML = "";

    let resultados = faltantes.filter(function(faltante) {
        return faltante.proveedor.toLowerCase().includes(proveedorBuscado);
    });

    if (resultados.length === 0) {
        lista.innerHTML = "<p>No se encontraron faltantes.</p>";
        return;
    }

    resultados.forEach(function(faltante, indice) {
        lista.innerHTML += `
            <div>
                <p>❌ <strong>${faltante.nombre}</strong></p>
                <p>Proveedor: ${faltante.proveedor}</p>

                <button onclick="solucionarFaltante(${indice})">
                    Solucionado
                </button>

                <hr>
            </div>
        `;
    });
}

function agregarProveedor() {
    let nombre = document.getElementById("nombreProveedor").value.trim();

    if (nombre === "") {
        alert("Escribí el nombre del proveedor");
        return;
    }

    let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];

    proveedores.push(nombre);

    localStorage.setItem("proveedores", JSON.stringify(proveedores));

    document.getElementById("nombreProveedor").value = "";

    alert("Proveedor agregado");
    cargarProveedoresEnMenu();
}
function verProveedores() {
    let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];

    let lista = document.getElementById("listaProveedores");

    lista.innerHTML = "";

    if (proveedores.length === 0) {
        lista.innerHTML = "<p>No hay proveedores guardados.</p>";
        return;
    }

    proveedores.forEach(function(proveedor) {
        lista.innerHTML += `
            <p>🏢 ${proveedor}</p>
        `;
    });
}
function cargarProveedoresEnMenu() {
    let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];

    let menu = document.getElementById("proveedorFaltante");

    menu.innerHTML = '<option value="">Seleccionar proveedor</option>';

    proveedores.forEach(function(proveedor) {
        menu.innerHTML += `
            <option value="${proveedor}">${proveedor}</option>
        `;
    });
}
cargarProveedoresEnMenu();
function solucionarFaltante(indice) {
    let faltantes = JSON.parse(localStorage.getItem("faltantes")) || [];

    faltantes.splice(indice, 1);

    localStorage.setItem("faltantes", JSON.stringify(faltantes));

    verFaltantes();
}