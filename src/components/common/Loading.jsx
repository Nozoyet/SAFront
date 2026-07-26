export default function Loading({
  texto = "Cargando...",
  color = "#0284c7",
  size = 32,
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 60,
        color: "#111214",
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div
        style={{
          fontSize: size,
          marginBottom: 12,
          color,
        }}
      >
        <i className="bi bi-hourglass-split spin"></i>
      </div>

      <p style={{ margin: 0 }}>{texto}</p>
    </div>
  );
}