import { useMemo } from "react";

const s = {
  filterSection: {
    display: "flex", flexDirection: "column", gap: 14,
    padding: "1.25rem", background: "#f8fafc",
    border: "1px solid #e2e8f0", borderRadius: 12,
  },
  filterRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  filterGroup: { flex: 1, minWidth: 170 },
  filterLabel: {
    display: "block", fontSize: ".8rem", fontWeight: 700,
    color: "#64748b", marginBottom: ".4rem",
  },
  filterSelect: {
    width: "100%", padding: ".6rem .75rem",
    border: "1.5px solid #e2e8f0", borderRadius: 9,
    fontSize: ".85rem", color: "#1e293b", background: "white",
    boxSizing: "border-box", outline: "none",
  },
  searchBtn: {
    width: "100%", padding: ".6rem 1rem",
    border: "none", borderRadius: 9, fontWeight: 700,
    cursor: "pointer", fontSize: ".85rem", color: "white",
  },
};

export default function FiltrosReportes({
  campos = [],
  opciones = { periodos: [], materias: [], cursos: [] },
  filtros = {},
  onChange,
  onConsultar,
  loading = false,
  color = "#0369a1",
  titulo = "Reporte",
  descripcion = "",
  icon,
  estadoOpciones,
  condicionOpciones,
}) {
  const materiasDisponibles = useMemo(() => {
    if (!filtros.periodo_id) return opciones.materias;
    return opciones.materias.filter(m =>
      opciones.cursos.some(c =>
        Number(c.idMateria) === Number(m.id) &&
        Number(c.idPeriodoAcademico) === Number(filtros.periodo_id)
      )
    );
  }, [filtros.periodo_id, opciones.materias, opciones.cursos]);

  const cursosDisponibles = useMemo(() => {
    let disponibles = opciones.cursos;
    if (filtros.periodo_id) {
      disponibles = disponibles.filter(c =>
        Number(c.idPeriodoAcademico) === Number(filtros.periodo_id)
      );
    }
    if (filtros.materia_id) {
      disponibles = disponibles.filter(c =>
        Number(c.idMateria) === Number(filtros.materia_id)
      );
    }
    return disponibles;
  }, [filtros.periodo_id, filtros.materia_id, opciones.cursos]);

  const handleChange = (name, value) => {
    const nuevos = { ...filtros, [name]: value };

    if (name === "curso_id" && value) {
      const curso = opciones.cursos.find(c => Number(c.id) === Number(value));
      if (curso) {
        nuevos.periodo_id = String(curso.idPeriodoAcademico);
        nuevos.materia_id = String(curso.idMateria);
      }
    }

    if (name === "periodo_id") {
      nuevos.materia_id = "";
      nuevos.curso_id = "";
    }

    if (name === "materia_id") {
      nuevos.curso_id = "";
    }

    if (onChange) onChange(nuevos);
  };

  const handleInputChange = (e) => {
    handleChange(e.target.name, e.target.value);
  };

  const semestres = useMemo(() => {
    return [...new Set(opciones.materias.map(m => m.semestre).filter(Boolean))].sort((a, b) => a - b);
  }, [opciones.materias]);

  const mostrar = (campo) => campos.includes(campo);

  return (
    <div style={s.filterSection}>
      {mostrar("periodo") && (
        <div style={s.filterRow}>
          {mostrar("periodo") && (
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>Periodo académico</label>
              <select name="periodo_id" value={filtros.periodo_id || ""} onChange={handleInputChange} style={s.filterSelect}>
                <option value="">Todos los periodos</option>
                {opciones.periodos.map(p => (
                  <option key={p.id} value={p.id}>{p.codigo}</option>
                ))}
              </select>
            </div>
          )}
          {mostrar("materia") && (
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>Materia</label>
              <select name="materia_id" value={filtros.materia_id || ""} onChange={handleInputChange} style={s.filterSelect}
                disabled={!!filtros.curso_id}>
                <option value="">Todas las materias</option>
                {materiasDisponibles.map(m => (
                  <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
                ))}
              </select>
            </div>
          )}
          {mostrar("curso") && (
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>Curso</label>
              <select name="curso_id" value={filtros.curso_id || ""} onChange={handleInputChange} style={s.filterSelect}>
                <option value="">Todos los cursos</option>
                {cursosDisponibles.map(c => (
                  <option key={c.id} value={c.id}>Grupo {c.codigoGrupo} - {c.materia} ({c.periodo})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div style={s.filterRow}>
        {mostrar("estado") && (
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Estado</label>
            <select name="estado" value={filtros.estado || ""} onChange={handleInputChange} style={s.filterSelect}>
              <option value="">Todos</option>
              {(estadoOpciones || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        {mostrar("nombre") && (
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Nombre</label>
            <input name="nombre" value={filtros.nombre || ""} onChange={handleInputChange}
              placeholder="Buscar por nombre" style={s.filterSelect} />
          </div>
        )}
        {mostrar("condicion") && (
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Condición</label>
            <select name="condicion" value={filtros.condicion || ""} onChange={handleInputChange} style={s.filterSelect}>
              <option value="">Todas</option>
              {(condicionOpciones || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        {mostrar("semestre") && (
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Semestre</label>
            <select name="semestre" value={filtros.semestre || ""} onChange={handleInputChange} style={s.filterSelect}>
              <option value="">Todos los semestres</option>
              {semestres.map(s => (
                <option key={s} value={s}>{s}° Semestre</option>
              ))}
            </select>
          </div>
        )}
        {mostrar("turno") && (
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Turno</label>
            <select name="turno" value={filtros.turno || ""} onChange={handleInputChange} style={s.filterSelect}>
              <option value="">Todos los turnos</option>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Nocturno">Nocturno</option>
            </select>
          </div>
        )}
        {mostrar("horario") && (
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Horario</label>
            <input name="horario" value={filtros.horario || ""} onChange={handleInputChange}
              placeholder="Horario" style={s.filterSelect} />
          </div>
        )}
      </div>

      {mostrar("nota") && (
        <div style={s.filterRow}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Nota mínima</label>
            <input type="number" name="nota_min" value={filtros.nota_min || ""} onChange={handleInputChange}
              placeholder="Ej: 51" min="0" max="100" style={s.filterSelect} />
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Nota máxima</label>
            <input type="number" name="nota_max" value={filtros.nota_max || ""} onChange={handleInputChange}
              placeholder="Ej: 100" min="0" max="100" style={s.filterSelect} />
          </div>
        </div>
      )}

      {mostrar("fecha") && (
        <div style={s.filterRow}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Fecha inicio</label>
            <input type="date" name="fecha_inicio" value={filtros.fecha_inicio || ""} onChange={handleInputChange} style={s.filterSelect} />
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Fecha fin</label>
            <input type="date" name="fecha_fin" value={filtros.fecha_fin || ""} onChange={handleInputChange} style={s.filterSelect} />
          </div>
        </div>
      )}

      {mostrar("buscar") !== false && (
        <div style={{ ...s.filterRow, justifyContent: "flex-end" }}>
          <div style={{ ...s.filterGroup, maxWidth: 200 }}>
            <label style={{ ...s.filterLabel, visibility: "hidden" }}>Buscar</label>
            <button onClick={onConsultar} disabled={loading} style={{ ...s.searchBtn, background: color, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Generando..." : "Generar previsualización"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
