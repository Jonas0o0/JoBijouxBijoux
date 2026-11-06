import { useState, useRef } from "react";
import { Trash2, Tag } from "lucide-react";

export type DefectType = "rayure" | "choc" | "griffe_usee" | "manque_pierre" | "autre";

export interface InspectionAnnotation {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: DefectType;
  note: string;
}

interface JewelryInspectionCanvasProps {
  jewelryType: "bague" | "montre" | "collier" | "bracelet" | "boucles";
  annotations: InspectionAnnotation[];
  onChange: (annotations: InspectionAnnotation[]) => void;
  readOnly?: boolean;
}

const DEFECT_CONFIG: Record<
  DefectType,
  { label: string; color: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  rayure: {
    label: "Rayure / Micro-rayures",
    color: "#d97706",
    bgClass: "bg-amber-50 text-amber-900",
    borderClass: "border-amber-300",
    dotClass: "bg-amber-600",
  },
  choc: {
    label: "Choc / Enfoncement",
    color: "#e11d48",
    bgClass: "bg-rose-50 text-rose-900",
    borderClass: "border-rose-300",
    dotClass: "bg-rose-600",
  },
  griffe_usee: {
    label: "Griffe usée / desserrée",
    color: "#9333ea",
    bgClass: "bg-purple-50 text-purple-900",
    borderClass: "border-purple-300",
    dotClass: "bg-purple-600",
  },
  manque_pierre: {
    label: "Pierre manquante",
    color: "#0284c7",
    bgClass: "bg-sky-50 text-sky-900",
    borderClass: "border-sky-300",
    dotClass: "bg-sky-600",
  },
  autre: {
    label: "Autre défaut",
    color: "#059669",
    bgClass: "bg-emerald-50 text-emerald-900",
    borderClass: "border-emerald-300",
    dotClass: "bg-emerald-600",
  },
};

export function JewelryInspectionCanvas({
  jewelryType,
  annotations,
  onChange,
  readOnly = false,
}: JewelryInspectionCanvasProps) {
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType>("rayure");
  const [currentNote, setCurrentNote] = useState<string>("");
  const [selectedPinIndex, setSelectedPinIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newAnnotation: InspectionAnnotation = {
      x,
      y,
      type: selectedDefectType,
      note: currentNote.trim() || DEFECT_CONFIG[selectedDefectType].label,
    };

    onChange([...annotations, newAnnotation]);
    setCurrentNote("");
    setSelectedPinIndex(annotations.length);
  };

  const handleRemovePin = (index: number) => {
    const updated = annotations.filter((_, i) => i !== index);
    onChange(updated);
    if (selectedPinIndex === index) setSelectedPinIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Tool selector */}
      {!readOnly && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>Sélectionner le type d'anomalie à pointer sur le schéma :</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DEFECT_CONFIG) as DefectType[]).map((type) => {
              const cfg = DEFECT_CONFIG[type];
              const isSelected = selectedDefectType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDefectType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all shadow-xs ${
                    isSelected
                      ? `${cfg.bgClass} ${cfg.borderClass} ring-2 ring-amber-500/20 font-bold`
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Précision optionnelle (ex: Griffe nord-ouest, rayure profonde...)"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-xs"
            />
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              Cliquez ensuite sur le schéma
            </span>
          </div>
        </div>
      )}

      {/* Interactive Vector SVG Schematic Container */}
      <div className="relative bg-slate-50/90 rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center overflow-hidden shadow-xs">
        <div className="w-full max-w-md aspect-square relative select-none">
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            onClick={handleSvgClick}
            className={`w-full h-full ${!readOnly ? "cursor-crosshair" : "cursor-default"}`}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />

            {/* Schematic rendering by jewelry type */}
            {jewelryType === "bague" && (
              <g id="schematic-ring" stroke="#64748b" strokeWidth="2.5" fill="none">
                {/* Ring Top Crown View */}
                <circle cx="200" cy="140" r="45" stroke="#475569" strokeWidth="3" fill="#e2e8f0" fillOpacity="0.6" />
                {/* Center Gemstone Brilliant Cut facets */}
                <polygon
                  points="200,105 225,120 235,140 225,160 200,175 175,160 165,140 175,120"
                  stroke="#0284c7"
                  strokeWidth="2"
                  fill="#bae6fd"
                  fillOpacity="0.4"
                />
                <circle cx="200" cy="140" r="14" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* 4/6 Prongs / Griffes */}
                <circle cx="172" cy="118" r="4.5" fill="#f8fafc" stroke="#334155" />
                <circle cx="228" cy="118" r="4.5" fill="#f8fafc" stroke="#334155" />
                <circle cx="172" cy="162" r="4.5" fill="#f8fafc" stroke="#334155" />
                <circle cx="228" cy="162" r="4.5" fill="#f8fafc" stroke="#334155" />
                <circle cx="200" cy="100" r="4" fill="#f8fafc" stroke="#334155" />
                <circle cx="200" cy="180" r="4" fill="#f8fafc" stroke="#334155" />

                {/* Ring Shank / Corps de bague - side perspective */}
                <path
                  d="M 120 260 C 120 200, 280 200, 280 260 C 280 340, 120 340, 120 260 Z"
                  stroke="#d97706"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 135 260 C 135 215, 265 215, 265 260 C 265 320, 135 320, 135 260 Z"
                  stroke="#b45309"
                  strokeWidth="2"
                />
                <text x="200" y="55" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
                  VUE DU DESSUS (CHATON & PIERRE)
                </text>
                <text x="200" y="380" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
                  VUE DU CORPS (ANNEAU & ÉPAULES)
                </text>
              </g>
            )}

            {jewelryType === "montre" && (
              <g id="schematic-watch" stroke="#64748b" strokeWidth="2.5" fill="none">
                {/* Watch Bracelet */}
                <rect x="160" y="30" width="80" height="90" rx="6" stroke="#64748b" strokeWidth="3" fill="#e2e8f0" />
                <line x1="160" y1="60" x2="240" y2="60" stroke="#94a3b8" strokeWidth="2" />
                <line x1="160" y1="90" x2="240" y2="90" stroke="#94a3b8" strokeWidth="2" />

                <rect x="160" y="280" width="80" height="90" rx="6" stroke="#64748b" strokeWidth="3" fill="#e2e8f0" />
                <line x1="160" y1="310" x2="240" y2="310" stroke="#94a3b8" strokeWidth="2" />
                <line x1="160" y1="340" x2="240" y2="340" stroke="#94a3b8" strokeWidth="2" />

                {/* Case */}
                <circle cx="200" cy="200" r="90" stroke="#475569" strokeWidth="4" fill="#f8fafc" />
                {/* Bezel */}
                <circle cx="200" cy="200" r="75" stroke="#d97706" strokeWidth="2.5" fill="#fef3c7" fillOpacity="0.4" />
                {/* Crown / Remontoir */}
                <rect x="290" y="190" width="16" height="20" rx="2" stroke="#475569" fill="#94a3b8" />
                {/* Markers */}
                <circle cx="200" cy="140" r="4" fill="#0f172a" />
                <circle cx="260" cy="200" r="4" fill="#0f172a" />
                <circle cx="200" cy="260" r="4" fill="#0f172a" />
                <circle cx="140" cy="200" r="4" fill="#0f172a" />
                {/* Hands */}
                <line x1="200" y1="200" x2="200" y2="155" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                <line x1="200" y1="200" x2="240" y2="200" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {(jewelryType === "collier" || jewelryType === "bracelet") && (
              <g id="schematic-necklace" stroke="#64748b" strokeWidth="2.5" fill="none">
                {/* Chain curve */}
                <path
                  d="M 80 100 C 80 320, 320 320, 320 100"
                  stroke="#d97706"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                />
                {/* Clasp / Fermoir */}
                <circle cx="200" cy="70" r="14" stroke="#475569" strokeWidth="3" fill="#cbd5e1" />
                {/* Pendant */}
                <circle cx="200" cy="260" r="28" stroke="#0284c7" strokeWidth="3" fill="#bae6fd" fillOpacity="0.5" />
                <circle cx="200" cy="260" r="12" stroke="#0369a1" strokeWidth="1.5" />
              </g>
            )}

            {/* Placed Defect Pins */}
            {annotations.map((pin, idx) => {
              const cfg = DEFECT_CONFIG[pin.type];
              const isSelected = selectedPinIndex === idx;

              return (
                <g
                  key={idx}
                  transform={`translate(${(pin.x * 400) / 100}, ${(pin.y * 400) / 100})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPinIndex(idx);
                  }}
                >
                  <circle
                    r={isSelected ? "14" : "11"}
                    fill={cfg.color}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="drop-shadow-md transition-all"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">
            Détail des anomalies constatées au dépôt :
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {annotations.map((pin, idx) => {
              const cfg = DEFECT_CONFIG[pin.type];
              const isSelected = selectedPinIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPinIndex(idx)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-colors cursor-pointer shadow-xs ${
                    isSelected
                      ? "bg-amber-50 border-amber-300"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{cfg.label}</span>
                    <span className="text-slate-500 italic font-normal">"{pin.note}"</span>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePin(idx);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Supprimer cette anomalie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
