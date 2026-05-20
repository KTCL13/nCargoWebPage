export function SecurityInfo() {
  return (
    <div className="bg-[var(--color-nc-dark)] rounded-2xl p-6 text-white">
      <h4 className="font-titles text-lg font-bold mb-2">Seguridad</h4>
      <p className="font-subtitles text-sm text-white/60 mb-4">
        Si necesitas cambiar tu contraseña o actualizar tu documento de identidad, por favor contacta al departamento de RRHH.
      </p>
      <div className="flex gap-4">
        <button className="text-xs font-bold uppercase tracking-widest text-[var(--color-nc-red)] hover:text-white transition-colors">
          Solicitar Cambio
        </button>
      </div>
    </div>
  )
}
