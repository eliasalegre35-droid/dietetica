const SUPABASE_URL = 'https://zakaimtaktydefiscyfm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S1DFOpJ1LV33mog-Thm64Q_7Za-yUa3';
const useSupabase = typeof window !== 'undefined' && window.supabase && SUPABASE_URL.indexOf('TU_') === -1 && SUPABASE_ANON_KEY.indexOf('TU_') === -1;
const supabaseClient = useSupabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function getLocalTable(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function setLocalTable(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

async function fetchTable(tableName) {
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from(tableName).select('*').order('created_at', { ascending: false });
        if (error) {
            console.error(error);
            return [];
        }
        return data || [];
    }
    return getLocalTable(tableName);
}

async function insertRow(tableName, payload) {
    if (supabaseClient) {
        const { error } = await supabaseClient.from(tableName).insert([payload]);
        if (error) {
            console.error(error);
            return false;
        }
        return true;
    }

    const rows = getLocalTable(tableName);
    rows.push({ ...payload, id: Date.now() + Math.random() });
    setLocalTable(tableName, rows);
    return true;
}

async function deleteRow(tableName, id) {
    if (supabaseClient) {
        const { error } = await supabaseClient.from(tableName).delete().eq('id', id);
        if (error) {
            console.error(error);
            return false;
        }
        return true;
    }

    const rows = getLocalTable(tableName);
    const filtered = rows.filter((row) => (row.id ?? row) !== id);
    setLocalTable(tableName, filtered);
    return true;
}

function normalizeText(value) {
    return (value || '').trim().toLowerCase();
}

function getUniqueFaltantes(faltantes) {
    const vistos = new Set();

    return faltantes.filter(function(faltante) {
        const clave = normalizeText(faltante.nombre) + '|' + normalizeText(faltante.proveedor);
        if (vistos.has(clave)) {
            return false;
        }

        vistos.add(clave);
        return true;
    });
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(function(tab) {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    panels.forEach(function(panel) {
        panel.classList.toggle('active', panel.id === 'tab-' + tabName);
    });
}

document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        showTab(tab.dataset.tab);
    });
});

async function guardarProducto() {
    const nombre = document.getElementById('nombre').value.trim();
    const proveedor = document.getElementById('proveedorProducto').value;
    const precio = Number(document.getElementById('precio').value);
    const cantidad = Number(document.getElementById('cantidad').value);

    if (!nombre) {
        alert('Escribí el nombre del producto');
        return;
    }

    if (!proveedor) {
        alert('Seleccioná un proveedor');
        return;
    }

    if (!precio || precio <= 0) {
        alert('Ingresá un precio válido');
        return;
    }

    if (!cantidad || cantidad <= 0) {
        alert('Ingresá una cantidad válida');
        return;
    }

    const ok = await insertRow('productos', {
        nombre,
        proveedor,
        precio,
        cantidad,
        created_at: new Date().toISOString()
    });

    if (!ok) {
        alert('No se pudo guardar el producto');
        return;
    }

    document.getElementById('nombre').value = '';
    document.getElementById('proveedorProducto').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('cantidad').value = '';

    alert('Producto guardado correctamente');
    verProductos();
}

async function verProductos() {
    const productos = await fetchTable('productos');
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = '';

    if (!productos.length) {
        lista.innerHTML = '<div class="empty">No hay productos guardados.</div>';
        return;
    }

    productos.forEach(function(producto) {
        lista.innerHTML += `
            <div class="item">
                <h3>${producto.nombre}</h3>
                <p>Proveedor: ${producto.proveedor || 'Sin proveedor'}</p>
                <p>Precio: $${producto.precio}</p>
                <p>Cantidad: ${producto.cantidad}</p>
            </div>
        `;
    });
}

async function agregarFaltante() {
    const nombre = document.getElementById('nombreFaltante').value.trim();
    const proveedor = document.getElementById('proveedorFaltante').value;

    if (!nombre) {
        alert('Escribí qué producto falta');
        return;
    }

    if (!proveedor) {
        alert('Seleccioná un proveedor');
        return;
    }

    const faltantes = getUniqueFaltantes(await fetchTable('faltantes'));
    const repetido = faltantes.some(function(faltante) {
        return normalizeText(faltante.nombre) === normalizeText(nombre) &&
               normalizeText(faltante.proveedor) === normalizeText(proveedor);
    });

    if (repetido) {
        alert('Ese faltante ya está cargado');
        return;
    }

    const ok = await insertRow('faltantes', {
        nombre,
        proveedor,
        created_at: new Date().toISOString()
    });

    if (!ok) {
        alert('No se pudo guardar el faltante');
        return;
    }

    document.getElementById('nombreFaltante').value = '';
    document.getElementById('proveedorFaltante').value = '';
    alert('Faltante agregado');
    verFaltantes();
}

async function verFaltantes() {
    const faltantes = getUniqueFaltantes(await fetchTable('faltantes'));
    const lista = document.getElementById('listaFaltantes');
    lista.innerHTML = '';

    if (!faltantes.length) {
        lista.innerHTML = '<div class="empty">No hay faltantes.</div>';
        return;
    }

    faltantes.forEach(function(faltante) {
        lista.innerHTML += `
            <div class="item">
                <p>❌ <strong>${faltante.nombre}</strong></p>
                <p>Proveedor: ${faltante.proveedor}</p>
                <button class="secondary-btn" onclick="solucionarFaltante(${faltante.id})">Solucionado</button>
            </div>
        `;
    });
}

async function filtrarFaltantes() {
    const proveedorBuscado = normalizeText(document.getElementById('filtroProveedor').value);
    const faltantes = getUniqueFaltantes(await fetchTable('faltantes'));
    const lista = document.getElementById('listaFaltantes');
    lista.innerHTML = '';

    const resultados = faltantes.filter(function(faltante) {
        return normalizeText(faltante.proveedor).includes(proveedorBuscado);
    });

    if (!resultados.length) {
        lista.innerHTML = '<div class="empty">No se encontraron faltantes.</div>';
        return;
    }

    resultados.forEach(function(faltante) {
        lista.innerHTML += `
            <div class="item">
                <p>❌ <strong>${faltante.nombre}</strong></p>
                <p>Proveedor: ${faltante.proveedor}</p>
                <button class="secondary-btn" onclick="solucionarFaltante(${faltante.id})">Solucionado</button>
            </div>
        `;
    });
}

async function agregarProveedor() {
    const nombre = document.getElementById('nombreProveedor').value.trim();
    if (!nombre) {
        alert('Escribí el nombre del proveedor');
        return;
    }

    const proveedores = await fetchTable('proveedores');
    const repetido = proveedores.some(function(proveedor) {
        return normalizeText(proveedor.nombre || proveedor) === normalizeText(nombre);
    });

    if (repetido) {
        alert('Ese proveedor ya está cargado');
        return;
    }

    const ok = await insertRow('proveedores', {
        nombre,
        created_at: new Date().toISOString()
    });

    if (!ok) {
        alert('No se pudo guardar el proveedor');
        return;
    }

    document.getElementById('nombreProveedor').value = '';
    alert('Proveedor agregado');
    cargarProveedoresEnMenu();
    verProveedores();
}

async function verProveedores() {
    const proveedores = await fetchTable('proveedores');
    const lista = document.getElementById('listaProveedores');
    lista.innerHTML = '';

    if (!proveedores.length) {
        lista.innerHTML = '<div class="empty">No hay proveedores guardados.</div>';
        return;
    }

    proveedores.forEach(function(proveedor) {
        const nombre = proveedor.nombre || proveedor;
        lista.innerHTML += `<div class="item"><p>🏢 ${nombre}</p></div>`;
    });
}

async function cargarProveedoresEnMenu() {
    const proveedores = await fetchTable('proveedores');
    const selectors = ['#proveedorFaltante', '#proveedorProducto', '#remitoProveedor'];

    selectors.forEach(function(selector) {
        const menu = document.querySelector(selector);
        if (!menu) return;

        menu.innerHTML = '<option value="">Seleccionar proveedor</option>';
        proveedores.forEach(function(proveedor) {
            const nombre = proveedor.nombre || proveedor;
            menu.innerHTML += `<option value="${nombre}">${nombre}</option>`;
        });
    });
}

async function guardarRemito() {
    const proveedor = document.getElementById('remitoProveedor').value;
    const producto = document.getElementById('remitoProducto').value.trim();
    const fecha = document.getElementById('remitoFecha').value;
    const observaciones = document.getElementById('remitoObservaciones').value.trim();
    const inputFile = document.getElementById('remitoImagen');

    if (!proveedor) {
        alert('Seleccioná un proveedor');
        return;
    }

    if (!producto) {
        alert('Escribí el producto recibido');
        return;
    }

    if (!fecha) {
        alert('Seleccioná la fecha');
        return;
    }

    if (!inputFile.files || inputFile.files.length === 0) {
        alert('Tenés que sacar o seleccionar una foto del remito');
        return;
    }

    const file = inputFile.files[0];
    const reader = new FileReader();

    reader.onload = async function(event) {
        const ok = await insertRow('remitos', {
            proveedor,
            producto,
            fecha,
            observaciones,
            imagen: event.target.result,
            created_at: new Date().toISOString()
        });

        if (!ok) {
            alert('No se pudo guardar el remito');
            return;
        }

        const faltantes = await fetchTable('faltantes');
        for (const faltante of faltantes) {
            const mismoProveedor = normalizeText(faltante.proveedor) === normalizeText(proveedor);
            const mismoProducto = normalizeText(faltante.nombre) === normalizeText(producto);

            if (mismoProveedor && mismoProducto && faltante.id) {
                await deleteRow('faltantes', faltante.id);
            }
        }

        document.getElementById('remitoProveedor').value = '';
        document.getElementById('remitoProducto').value = '';
        document.getElementById('remitoFecha').value = '';
        document.getElementById('remitoObservaciones').value = '';
        inputFile.value = '';

        alert('Remito guardado y faltante actualizado');
        verRemitos();
        verFaltantes();
    };

    reader.readAsDataURL(file);
}

async function verRemitos() {
    const remitos = await fetchTable('remitos');
    const lista = document.getElementById('listaRemitos');
    lista.innerHTML = '';

    if (!remitos.length) {
        lista.innerHTML = '<div class="empty">No hay remitos guardados.</div>';
        return;
    }

    remitos.forEach(function(remito) {
        lista.innerHTML += `
            <div class="item">
                <h3>${remito.producto}</h3>
                <p>Proveedor: ${remito.proveedor}</p>
                <p>Fecha: ${remito.fecha}</p>
                <p>Obs: ${remito.observaciones || 'Sin observaciones'}</p>
                ${remito.imagen ? `<img src="${remito.imagen}" alt="Remito" style="width:100%; max-height:220px; object-fit:cover; border-radius:12px; margin-top:8px; border:1px solid #e5e7eb;">` : ''}
            </div>
        `;
    });
}

async function filtrarRemitos() {
    const proveedorBuscado = normalizeText(document.getElementById('filtroRemitos').value);
    const remitos = await fetchTable('remitos');
    const lista = document.getElementById('listaRemitos');
    lista.innerHTML = '';

    const resultados = remitos.filter(function(remito) {
        return normalizeText(remito.proveedor).includes(proveedorBuscado);
    });

    if (!resultados.length) {
        lista.innerHTML = '<div class="empty">No se encontraron remitos.</div>';
        return;
    }

    resultados.forEach(function(remito) {
        lista.innerHTML += `
            <div class="item">
                <h3>${remito.producto}</h3>
                <p>Proveedor: ${remito.proveedor}</p>
                <p>Fecha: ${remito.fecha}</p>
                ${remito.imagen ? `<img src="${remito.imagen}" alt="Remito" style="width:100%; max-height:220px; object-fit:cover; border-radius:12px; margin-top:8px; border:1px solid #e5e7eb;">` : ''}
            </div>
        `;
    });
}

async function solucionarFaltante(id) {
    if (supabaseClient) {
        await deleteRow('faltantes', id);
    } else {
        const faltantes = getLocalTable('faltantes');
        const filtrados = faltantes.filter((faltante) => (faltante.id ?? faltantes.indexOf(faltante)) !== id);
        setLocalTable('faltantes', filtrados);
    }

    verFaltantes();
}

async function init() {
    if (!useSupabase) {
        console.log('Supabase no configurado. La app funciona en modo local.');
    }

    await cargarProveedoresEnMenu();
    await verProductos();
    await verFaltantes();
    await verProveedores();
    await verRemitos();
}

if (typeof window !== 'undefined') {
    window.showTab = showTab;
    window.guardarProducto = guardarProducto;
    window.verProductos = verProductos;
    window.agregarFaltante = agregarFaltante;
    window.verFaltantes = verFaltantes;
    window.filtrarFaltantes = filtrarFaltantes;
    window.agregarProveedor = agregarProveedor;
    window.verProveedores = verProveedores;
    window.cargarProveedoresEnMenu = cargarProveedoresEnMenu;
    window.guardarRemito = guardarRemito;
    window.verRemitos = verRemitos;
    window.filtrarRemitos = filtrarRemitos;
    window.solucionarFaltante = solucionarFaltante;
    window.init = init;
}

init();