// Variable global para el gráfico
let sexoChart;

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script cargado correctamente");
    
    const municipioSelect = document.getElementById('municipio');
    const cargarDatosBtn = document.getElementById('cargarDatos');
    
    cargarDatosBtn.addEventListener('click', cargarDatos);
    
    // Cargar datos iniciales
    cargarDatos();
    
    async function cargarDatos() {
        console.log("Cargando datos...");
        const municipioId = municipioSelect.value;
        const url = `https://censopoblacion.azurewebsites.net/API/indicadores/2/${municipioId}`;
        
        try {
            // Mostrar estado de carga
            cargarDatosBtn.disabled = true;
            cargarDatosBtn.textContent = 'Cargando...';
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const textData = await response.text();
            console.log("Respuesta cruda:", textData);
            
            // Método confiable de parseo (igual al original que funciona)
            const jsonString = JSON.parse(textData);
            const data = JSON.parse(jsonString);
            console.log("Datos parseados:", data);
            
            mostrarDatosGenerales(data);
            mostrarDistribucionPoblacional(data);
            mostrarDatosDetallados(data);
            
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            alert('Error al cargar datos. Ver la consola para detalles.');
        } finally {
            // Restaurar estado del botón
            cargarDatosBtn.disabled = false;
            cargarDatosBtn.textContent = 'Cargar Datos';
        }
    }
    
    function mostrarDatosGenerales(data) {
        // Usar notación de corchetes para propiedades con puntos
        document.getElementById('pob-total').textContent = data.pob_total?.toLocaleString() || '-';
        document.getElementById('ext-territorial').textContent = data["ext.territorial"]?.toLocaleString() || '-';
        document.getElementById('capital').textContent = data.capital || '-';
        
        // Datos de área geográfica
        document.getElementById('pob-urbana').textContent = data.total_sector_urban?.toLocaleString() || '-';
        document.getElementById('porc-urbana').textContent = data.porc_sector_urban ? `${parseFloat(data.porc_sector_urban).toFixed(2)}%` : '-';
        document.getElementById('pob-rural').textContent = data.total_sector_rural?.toLocaleString() || '-';
        document.getElementById('porc-rural').textContent = data.porc_sector_rural ? `${parseFloat(data.porc_sector_rural).toFixed(2)}%` : '-';
        
        // Datos de grupos de edad con múltiples opciones de nombres
        document.getElementById('pob-0-14').textContent = data.pob_edad_014?.toLocaleString() || data.pob_edad_olat?.toLocaleString() || '-';
        document.getElementById('porc-0-14').textContent = data.porc_edad_014 ? `${parseFloat(data.porc_edad_014).toFixed(2)}%` : 
                                                         data.porc_edad_olat ? `${parseFloat(data.porc_edad_olat).toFixed(2)}%` : '-';
        document.getElementById('pob-15-64').textContent = data.pob_edad_1564?.toLocaleString() || '-';
        document.getElementById('porc-15-64').textContent = data.porc_edad_1564 ? `${parseFloat(data.porc_edad_1564).toFixed(2)}%` : '-';
        document.getElementById('pob-65').textContent = data.pob_edad_65?.toLocaleString() || data.pob_edad_68?.toLocaleString() || '-';
        document.getElementById('porc-65').textContent = data.porc_edad_65 ? `${parseFloat(data.porc_edad_65).toFixed(2)}%` : 
                                                      data.porc_edad_68 ? `${parseFloat(data.porc_edad_68).toFixed(2)}%` : '-';
    }
    
    function mostrarDistribucionPoblacional(data) {
        // Solo mantenemos el gráfico de sexo
        const sexoData = {
            labels: ['Hombres', 'Mujeres'],
            datasets: [{
                data: [
                    data.total_sexo_hombry || data.total_sexo_hombre || 0,
                    data.total_sexo_mujeres || 0
                ],
                backgroundColor: ['#3498db', '#e74c3c'],
                borderWidth: 1
            }]
        };
        
        // Destruir gráfico anterior si existe
        if (sexoChart) sexoChart.destroy();
        
        // Crear nuevo gráfico
        const sexoCtx = document.getElementById('sexo-chart').getContext('2d');
        sexoChart = new Chart(sexoCtx, {
            type: 'pie',
            data: sexoData,
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function mostrarDatosDetallados(data) {
        // Tabla de pueblos originarios
        const pueblosTable = document.getElementById('pueblos-table').getElementsByTagName('tbody')[0];
        pueblosTable.innerHTML = '';
        
        const pueblosData = [
            { nombre: 'Maya', poblacion: data.pob_pueblo_maya, porcentaje: data.porc_pueblo_maya },
            { nombre: 'Garífuna', poblacion: data.pob_pueblo_garifuna, porcentaje: data.porc_pueblo_garifuna },
            { nombre: 'Xinca', poblacion: data.pob_pueblo_xinca, porcentaje: data.porc_pueblo_xinca },
            { nombre: 'Afrodescendiente', poblacion: data.pob_pueblo_afrodescendiente, porcentaje: data.porc_pueblo_afrodescendiente },
            { nombre: 'Ladino', poblacion: data.pob_pueblo_ladino, porcentaje: data.porc_pueblo_ladino },
            { nombre: 'Extranjero', poblacion: data["pob_pueblo.extranjero"], porcentaje: data["porc_pueblo.extranjero"] }
        ];
        
        pueblosData.forEach(pueblo => {
            const row = pueblosTable.insertRow();
            row.insertCell(0).textContent = pueblo.nombre;
            row.insertCell(1).textContent = pueblo.poblacion?.toLocaleString() || '0';
            row.insertCell(2).textContent = pueblo.porcentaje ? `${parseFloat(pueblo.porcentaje).toFixed(2)}%` : '0%';
        });
        
        // Tabla de indicadores sociales
        const indicadoresTable = document.getElementById('indicadores-table').getElementsByTagName('tbody')[0];
        indicadoresTable.innerHTML = '';
        
        const indicadoresData = [
            { nombre: 'Índice de Masculinidad', valor: data.indice_masculinidad, unidad: 'hombres por 100 mujeres' },
            { nombre: 'Promedio de Hijos por Mujer', valor: data.pron_bijos_mujer || data.prom_hijos_mujer, unidad: 'hijos' },
            { nombre: 'Edad Promedio', valor: data.edad_promedio, unidad: 'años' },
            { nombre: 'Índice de Dependencia', valor: data.indice_dependencia, unidad: '%' },
            { nombre: 'Años Promedio de Estudio', valor: data.anios_promestudio || data.anios_prom_estudio, unidad: 'años' },
            { nombre: 'Tasa de Alfabetismo', valor: data.alfabetismo, unidad: '%' },
            { nombre: 'Promedio de Personas por Hogar', valor: data.pron_personas_hogar || data.prom_personas_hogar, unidad: 'personas' },
            { nombre: 'Jefas de Hogar', valor: data.total_jefas_hogar, unidad: '%' }
        ];
        
        indicadoresData.forEach(indicador => {
            const row = indicadoresTable.insertRow();
            row.insertCell(0).textContent = indicador.nombre;
            
            let valorTexto = indicador.valor?.toString() || '0';
            if (typeof indicador.valor === 'number') {
                valorTexto = parseFloat(valorTexto).toFixed(2);
            }
            
            row.insertCell(1).textContent = `${valorTexto} ${indicador.unidad}`;
        });
    }
});