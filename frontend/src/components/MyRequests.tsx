import { useState } from 'react';
import { Trash2, Calendar, Clock, Users, Mail, Phone, User, ChevronDown, ChevronUp } from 'lucide-react';
import { loadRequests, deleteRequest } from '../lib/requestStorage';
import type { AvailabilityRequest } from '../lib/requestStorage';

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mattina (09:00–13:00)',
  afternoon: 'Pomeriggio (14:00–18:00)',
  evening: 'Sera (19:00–23:00)',
  fullday: 'Intera giornata (09:00–23:00)',
};

const SPECIAL_NEEDS_LABELS: Record<string, string> = {
  disabled: '♿ Accesso disabili',
  children: '🧒 Area bambini',
  vegetarian: '🥗 Menù vegetariano/vegano',
  lis: '🤟 Interprete LIS',
  nursing: '🤱 Sala allattamento',
  elderly: '👴 Assistenza anziani',
  kosher: '🍽️ Menù kosher/halal',
  allergies: '⚠️ Gestione allergie',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSubmittedAt(iso: string) {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function RequestCard({ req, onDelete }: { req: AvailabilityRequest; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{req.venueName}</p>
          <p className="text-xs text-gray-400 mt-0.5">Inviata il {formatSubmittedAt(req.submittedAt)}</p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition"
            title={expanded ? 'Comprimi' : 'Espandi'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-full text-rose-400 hover:bg-rose-50 transition"
            title="Elimina richiesta"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="px-4 pb-3 flex flex-wrap gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar size={12} className="text-blue-400" />
          {formatDate(req.dateFrom)}{req.dateTo ? ` → ${formatDate(req.dateTo)}` : ''}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} className="text-blue-400" />
          {req.people} partecipanti
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-blue-400" />
          {req.timeSlots.map((ts) => TIME_SLOT_LABELS[ts] ?? ts).join(', ')}
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {req.seats && (
            <Row label="Posti a sedere" value={req.seats} />
          )}
          {req.specialNeeds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Esigenze particolari</p>
              <div className="flex flex-wrap gap-1.5">
                {req.specialNeeds.map((sn) => (
                  <span key={sn} className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs">
                    {SPECIAL_NEEDS_LABELS[sn] ?? sn}
                  </span>
                ))}
              </div>
            </div>
          )}
          {req.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Note</p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{req.notes}</p>
            </div>
          )}
          <div className="pt-1 border-t border-gray-100 space-y-1">
            <p className="text-xs font-semibold text-gray-500 mb-1">Contatti</p>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <User size={11} className="text-gray-400" /> {req.contactName}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Mail size={11} className="text-gray-400" /> {req.contactEmail}
            </span>
            {req.contactPhone && (
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone size={11} className="text-gray-400" /> {req.contactPhone}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="font-semibold text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

interface Props {
  onBack: () => void;
}

export default function MyRequests({ onBack }: Props) {
  const [requests, setRequests] = useState<AvailabilityRequest[]>(() => loadRequests());

  function handleDelete(id: string) {
    deleteRequest(id);
    setRequests(loadRequests());
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition"
        >
          ← Torna alla mappa
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <h1 className="text-sm font-bold text-gray-900">Le mie richieste</h1>
        <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-sm font-semibold text-gray-700">Nessuna richiesta</p>
            <p className="text-xs text-gray-400 mt-1">
              Le richieste di disponibilità che invii appariranno qui.
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <RequestCard key={req.id} req={req} onDelete={() => handleDelete(req.id)} />
          ))
        )}
      </div>
    </div>
  );
}
