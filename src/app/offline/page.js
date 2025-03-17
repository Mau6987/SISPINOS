// app/offline/page.js
export default function Offline() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Sin conexión</h1>
        <p className="mb-4">No tienes conexión a internet en este momento.</p>
        <p>La aplicación funcionará con datos en caché hasta que recuperes la conexión.</p>
      </div>
    );
  }