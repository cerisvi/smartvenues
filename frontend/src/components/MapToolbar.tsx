import { Flame, Ruler, CircleDot, BarChart2, X, FileText, Map } from 'lucide-react';

export type MapTool = 'none' | 'measure' | 'proximity';

interface Props {
  activeTool: MapTool;
  showHeatmap: boolean;
  showStats: boolean;
  proximityRadiusKm: number;
  measureDistanceM: number;
  measurePoints: number;
  proximityCenter: [number, number] | null;
  onToolChange: (tool: MapTool) => void;
  onHeatmapToggle: () => void;
  onStatsToggle: () => void;
  onProximityRadiusChange: (r: number) => void;
  onClearTool: () => void;
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
}

export default function MapToolbar({
  activeTool,
  showHeatmap,
  showStats,
  proximityRadiusKm,
  measureDistanceM,
  measurePoints,
  proximityCenter,
  onToolChange,
  onHeatmapToggle,
  onStatsToggle,
  onProximityRadiusChange,
  onClearTool,
  onExportCSV,
  onExportGeoJSON,
}: Props) {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-none">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1 pointer-events-auto">
        {/* Heatmap */}
        <button
          onClick={onHeatmapToggle}
          title="Heatmap densità venue"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors text-sm ${
            showHeatmap
              ? 'bg-orange-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Flame size={16} />
        </button>

        {/* Measure */}
        <button
          onClick={() => onToolChange(activeTool === 'measure' ? 'none' : 'measure')}
          title="Misura distanza (clicca punti sulla mappa)"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            activeTool === 'measure'
              ? 'bg-purple-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Ruler size={16} />
        </button>

        {/* Proximity */}
        <button
          onClick={() => onToolChange(activeTool === 'proximity' ? 'none' : 'proximity')}
          title="Ricerca per prossimità (clicca per impostare centro)"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            activeTool === 'proximity'
              ? 'bg-teal-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CircleDot size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-0.5" />

        {/* Stats */}
        <button
          onClick={onStatsToggle}
          title="Pannello statistiche e grafici"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            showStats
              ? 'bg-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart2 size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-0.5" />

        {/* Export CSV */}
        <button
          onClick={onExportCSV}
          title="Esporta CSV"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <FileText size={16} />
        </button>

        {/* Export GeoJSON */}
        <button
          onClick={onExportGeoJSON}
          title="Esporta GeoJSON"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Map size={16} />
        </button>
      </div>

      {/* Measure info panel */}
      {activeTool === 'measure' && (
        <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-3 pointer-events-auto min-w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
              <Ruler size={12} /> Misura distanza
            </span>
            <button
              onClick={onClearTool}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {measurePoints === 0 ? (
            <p className="text-xs text-gray-500">Clicca sulla mappa per aggiungere punti</p>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Punti:</span>
                <span className="font-semibold text-gray-700">{measurePoints}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Distanza totale:</span>
                <span className="font-semibold text-purple-700">{formatDistance(measureDistanceM)}</span>
              </div>
            </div>
          )}
          <button
            onClick={onClearTool}
            className="mt-2 w-full text-xs py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          >
            Cancella misurazione
          </button>
        </div>
      )}

      {/* Proximity info panel */}
      {activeTool === 'proximity' && (
        <div className="bg-white rounded-xl shadow-lg border border-teal-200 p-3 pointer-events-auto min-w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
              <CircleDot size={12} /> Ricerca prossimità
            </span>
            <button
              onClick={onClearTool}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {!proximityCenter ? (
            <p className="text-xs text-gray-500">Clicca sulla mappa per impostare il centro</p>
          ) : (
            <p className="text-xs text-teal-600">Centro impostato — regola il raggio</p>
          )}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Raggio:</span>
              <span className="font-semibold text-teal-700">{proximityRadiusKm} km</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={proximityRadiusKm}
              onChange={(e) => onProximityRadiusChange(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>
          <button
            onClick={onClearTool}
            className="mt-2 w-full text-xs py-1 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
          >
            Rimuovi filtro
          </button>
        </div>
      )}
    </div>
  );
}
