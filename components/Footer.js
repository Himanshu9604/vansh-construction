import { LogoMark } from "./Sidebar";

export default function Footer() {
  return (
    <footer className="appfoot no-print">
      <div className="appfoot-main">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <LogoMark size={22} />
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>
            Vansh Construction
          </span>
        </div>
        <span className="text-gold" style={{ fontWeight: 600 }}>Nitin Dohate</span> · बांधकामातील प्रत्येक कामाची अचूक नोंद.
        <br />आपली सर्व माहिती सुरक्षितपणे जतन केली जाते.
      </div>
      <span className="appfoot-credit">Designed by <b>Shyam Yadav</b></span>
    </footer>
  );
}
