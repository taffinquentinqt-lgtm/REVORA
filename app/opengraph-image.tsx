import { ImageResponse } from "next/og";

// Carte de partage (LinkedIn, X, messageries). Générée au build, mise en cache.
export const alt =
  "REVORA — Qui appeler, quoi dire, et le piège à éviter. Un brief par lead B2B.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(circle at 16% -10%, rgba(108,99,255,0.55), transparent 42%), radial-gradient(circle at 108% 115%, rgba(0,212,170,0.32), transparent 40%)",
          padding: "72px 80px",
          color: "#f0f0ff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              width: 80,
              height: 80,
              borderRadius: 22,
              backgroundColor: "#6c63ff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 48,
                height: 48,
                borderRadius: 48,
                border: "6px solid #ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 21,
                  height: 21,
                  borderRadius: 21,
                  border: "5px solid #ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 7,
                    backgroundColor: "#00d4aa",
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>
            REVORA
          </div>
        </div>

        {/* Accroche */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 21,
              letterSpacing: 4,
              color: "#8888aa",
              textTransform: "uppercase",
            }}
          >
            Sales intelligence B2B
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 70,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            Qui appeler, quoi dire, et le piège à éviter.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#b3b3cc", maxWidth: 920 }}>
            Un brief opérationnel pour chaque lead — à partir de ton CSV.
          </div>
        </div>

        {/* Chips de preuve */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              padding: "12px 22px",
              borderRadius: 999,
              border: "1px solid rgba(0,212,170,0.5)",
              backgroundColor: "rgba(0,212,170,0.12)",
              color: "#00d4aa",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            9 RDV générés
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 22px",
              borderRadius: 999,
              border: "1px solid #2a2a3e",
              color: "#c9c6ff",
              fontSize: 26,
            }}
          >
            Scoring IA décomposé
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 22px",
              borderRadius: 999,
              border: "1px solid #2a2a3e",
              color: "#c9c6ff",
              fontSize: 26,
            }}
          >
            Export Excel prêt
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
