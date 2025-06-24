document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    nombre: this.nombre.value,
    telefono: this.telefono.value,
    fecha: this.fecha.value,
    hora: this.hora.value
  };

  try {
    const response = await fetch('http://localhost:3000/turno', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.text();
    alert(result); // Esto muestra "Turno reservado correctamente" si todo salió bien
    this.reset();  // Limpia el formulario
  } catch (error) {
    alert('Error al enviar el turno');
    console.error(error);
  }
});
