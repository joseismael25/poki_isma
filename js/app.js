const formulario = document.getElementById("formularioPokemon");
const pokemonInput = document.getElementById("pokemonInput");
const resultado = document.getElementById("resultado");
const paginacion = document.getElementById("paginacion");
const mensaje = document.getElementById("mensaje");
const btnBuscar = document.getElementById("btnBuscar");

const POKEMONES_POR_PAGINA = 10;
const CLAVE_STORAGE = "pokemonesGuardados";

let pokemonesGuardados = cargarPokemones();
let paginaActual = pokemonesGuardados.length > 0
    ? Math.ceil(pokemonesGuardados.length / POKEMONES_POR_PAGINA)
    : 1;

formulario.addEventListener("submit", buscarPokemon);

mostrarPokemones();

async function buscarPokemon(event) {
    event.preventDefault();

    const nombrePokemon = pokemonInput.value.trim().toLowerCase();

    limpiarMensaje();

    if (nombrePokemon === "") {
        mostrarMensaje("Debes escribir el nombre o número de un Pokémon.", "error");
        return;
    }

    try {
        btnBuscar.disabled = true;
        btnBuscar.textContent = "Buscando...";
        mostrarMensaje("Buscando Pokémon...", "info");

        const url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(nombrePokemon)}`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("Pokémon no encontrado");
        }

        const pokemon = await respuesta.json();

        // Evita guardar dos veces el mismo Pokémon.
        const yaExiste = pokemonesGuardados.some(
            (pokemonGuardado) => pokemonGuardado.id === pokemon.id
        );

        if (yaExiste) {
            const posicion = pokemonesGuardados.findIndex(
                (pokemonGuardado) => pokemonGuardado.id === pokemon.id
            );

            paginaActual = Math.floor(posicion / POKEMONES_POR_PAGINA) + 1;
            mostrarMensaje(`${pokemon.name} ya estaba guardado.`, "info");
        } else {
            pokemonesGuardados.push(pokemon);
            guardarPokemones();

            // El nuevo Pokémon queda en la última página.
            paginaActual = Math.ceil(
                pokemonesGuardados.length / POKEMONES_POR_PAGINA
            );

            mostrarMensaje(`${pokemon.name} fue agregado correctamente.`, "exito");
        }

        mostrarPokemones();
        pokemonInput.value = "";

    } catch (error) {
        mostrarMensaje(
            "El Pokémon buscado no fue encontrado. Verifica el nombre o número e inténtalo nuevamente.",
            "error"
        );
        console.error(error);
    } finally {
        btnBuscar.disabled = false;
        btnBuscar.textContent = "Buscar Pokémon";
    }
}

function mostrarPokemones() {
    resultado.innerHTML = "";

    const totalPaginas = Math.max(
        1,
        Math.ceil(pokemonesGuardados.length / POKEMONES_POR_PAGINA)
    );

    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
    }

    const inicio = (paginaActual - 1) * POKEMONES_POR_PAGINA;
    const fin = inicio + POKEMONES_POR_PAGINA;
    const pokemonesPagina = pokemonesGuardados.slice(inicio, fin);

    pokemonesPagina.forEach((pokemon, indicePagina) => {
        const indiceReal = inicio + indicePagina;

        const tipos = pokemon.types
            .map((tipo) => `<span class="tipo">${tipo.type.name}</span>`)
            .join("");

        resultado.innerHTML += `
            <article class="tarjeta">
                <img
                    src="${pokemon.sprites.front_default || ""}"
                    alt="Imagen de ${pokemon.name}"
                >

                <h2>${pokemon.name}</h2>

                <p class="dato">
                    <strong>ID:</strong> ${pokemon.id}
                </p>

                <div class="dato">
                    <strong>Tipos:</strong>
                    <div class="tipos">
                        ${tipos}
                    </div>
                </div>

                <p class="dato">
                    <strong>Peso:</strong> ${pokemon.weight}
                </p>

                <p class="dato">
                    <strong>Altura:</strong> ${pokemon.height}
                </p>

                <button
                    type="button"
                    class="btn-eliminar"
                    data-indice="${indiceReal}"
                >
                    Eliminar
                </button>
            </article>
        `;
    });

    // Conecta cada botón de eliminar con su Pokémon correspondiente.
    document.querySelectorAll(".btn-eliminar").forEach((boton) => {
        boton.addEventListener("click", () => {
            eliminarPokemon(Number(boton.dataset.indice));
        });
    });

    mostrarPaginacion(totalPaginas);
}

function eliminarPokemon(indice) {
    const pokemonEliminado = pokemonesGuardados[indice];

    pokemonesGuardados.splice(indice, 1);
    guardarPokemones();

    const totalPaginas = Math.max(
        1,
        Math.ceil(pokemonesGuardados.length / POKEMONES_POR_PAGINA)
    );

    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
    }

    mostrarPokemones();

    if (pokemonEliminado) {
        mostrarMensaje(`${pokemonEliminado.name} fue eliminado.`, "exito");
    }
}

function cambiarPagina(numeroPagina) {
    const totalPaginas = Math.max(
        1,
        Math.ceil(pokemonesGuardados.length / POKEMONES_POR_PAGINA)
    );

    if (numeroPagina < 1 || numeroPagina > totalPaginas) {
        return;
    }

    paginaActual = numeroPagina;
    mostrarPokemones();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarPaginacion(totalPaginas) {
    paginacion.innerHTML = "";

    if (totalPaginas <= 1) {
        return;
    }

    const botonAnterior = document.createElement("button");
    botonAnterior.type = "button";
    botonAnterior.textContent = "‹ Anterior";
    botonAnterior.disabled = paginaActual === 1;
    botonAnterior.addEventListener("click", () => cambiarPagina(paginaActual - 1));
    paginacion.appendChild(botonAnterior);

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        const botonPagina = document.createElement("button");
        botonPagina.type = "button";
        botonPagina.textContent = pagina;

        if (pagina === paginaActual) {
            botonPagina.classList.add("activa");
        }

        botonPagina.addEventListener("click", () => cambiarPagina(pagina));
        paginacion.appendChild(botonPagina);
    }

    const info = document.createElement("span");
    info.className = "pagina-info";
    info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    paginacion.appendChild(info);

    const botonSiguiente = document.createElement("button");
    botonSiguiente.type = "button";
    botonSiguiente.textContent = "Siguiente ›";
    botonSiguiente.disabled = paginaActual === totalPaginas;
    botonSiguiente.addEventListener("click", () => cambiarPagina(paginaActual + 1));
    paginacion.appendChild(botonSiguiente);
}

function guardarPokemones() {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(pokemonesGuardados));
}

function cargarPokemones() {
    try {
        const datos = localStorage.getItem(CLAVE_STORAGE);
        return datos ? JSON.parse(datos) : [];
    } catch (error) {
        console.error("No se pudieron cargar los Pokémon guardados:", error);
        return [];
    }
}

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
}

function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "mensaje";
}
