import { useState } from 'react';
import { X, Calendar, Clock, Users, AlertCircle, User, Mail, Phone, MessageSquare } from 'lucide-react';
import type { VenueFeature } from '../types/venue';
import { saveRequest } from '../lib/requestStorage';

interface Props {
  venue: VenueFeature;
  onClose: () => void;
}

const TIME_SLOTS = [
  { value: 'morning', label: 'Mattina', hours: '09:00 – 13:00' },
  { value: 'afternoon', label: 'Pomeriggio', hours: '14:00 – 18:00' },
  { value: 'evening', label: 'Sera', hours: '19:00 – 23:00' },
  { value: 'fullday', label: 'Intera giornata', hours: '09:00 – 23:00' },
];

const SPECIAL_NEEDS = [
  { value: 'disabled', label: 'Accesso e servizi per disabili', icon: '♿' },
  { value: 'children', label: 'Area/strutture per bambini', icon: '🧒' },
  { value: 'vegetarian', label: 'Menù vegetariano / vegano', icon: '🥗' },
  { value: 'lis', label: 'Interprete LIS (non udenti)', icon: '🤟' },
  { value: 'nursing', label: 'Sala allattamento', icon: '🤱' },
  { value: 'elderly', label: 'Assistenza anziani', icon: '👴' },
  { value: 'kosher', label: 'Menù kosher / halal', icon: '🍽️' },
  { value: 'allergies', label: 'Gestione allergie alimentari', icon: '⚠️' },
];

interface FormState {
  dateFrom: string;
  dateTo: string;
  timeSlots: string[];
  people: string;
  seats: string;
  specialNeeds: string[];
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const EMPTY: FormState = {
  dateFrom: '',
  dateTo: '',
  timeSlots: [],
  people: '',
  seats: '',
  specialNeeds: [],
  notes: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

export default function AvailabilityRequestModal({ venue, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const p = venue.properties;

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleArray(field: 'timeSlots' | 'specialNeeds', value: string) {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.dateFrom) e.dateFrom = 'Inserisci la data di inizio';
    if (form.dateTo && form.dateTo < form.dateFrom) e.dateTo = 'La data di fine deve essere successiva';
    if (!form.timeSlots.length) e.timeSlots = 'Seleziona almeno una fascia oraria';
    if (!form.people || isNaN(Number(form.people)) || Number(form.people) < 1)
      e.people = 'Inserisci un numero valido';
    if (Number(form.people) > p.capacity)
      e.people = `La venue ospita al massimo ${p.capacity.toLocaleString()} persone`;
    if (!form.contactName.trim()) e.contactName = 'Campo obbligatorio';
    if (!form.contactEmail.trim()) e.contactEmail = 'Campo obbligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      e.contactEmail = 'Email non valida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    saveRequest({
      venueId: p.id,
      venueName: p.name,
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      timeSlots: form.timeSlots,
      people: form.people,
      seats: form.seats,
      specialNeeds: form.specialNeeds,
      notes: form.notes,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
    });
    setSubmitted(true);
  }

  /* ── Confirmation screen ── */
  if (submitted) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-6 px-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4">
            ✅
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Richiesta inviata!</h3>
          <p className="text-sm text-gray-500 mb-1">
            La tua richiesta per <span className="font-semibold text-gray-800">{p.name}</span> è stata registrata.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Ti contatteremo a <span className="text-blue-600">{form.contactEmail}</span> entro 48 ore lavorative.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            Chiudi
          </button>
        </div>
      </Overlay>
    );
  }

  /* ── Form ── */
  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">Richiedi disponibilità</h3>
          <p className="text-xs text-gray-500 mt-0.5">{p.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* ── Date ── */}
        <Section icon={<Calendar size={14} />} title="Date">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Data inizio</Label>
              <input
                type="date"
                className={inputCls}
                min={new Date().toISOString().split('T')[0]}
                value={form.dateFrom}
                onChange={(e) => set('dateFrom', e.target.value)}
              />
              {errors.dateFrom && <Err msg={errors.dateFrom} />}
            </div>
            <div>
              <Label>Data fine</Label>
              <input
                type="date"
                className={inputCls}
                min={form.dateFrom || new Date().toISOString().split('T')[0]}
                value={form.dateTo}
                onChange={(e) => set('dateTo', e.target.value)}
              />
              {errors.dateTo && <Err msg={errors.dateTo} />}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Lascia "Data fine" vuota per un evento in singola giornata.</p>
        </Section>

        {/* ── Fasce orarie ── */}
        <Section icon={<Clock size={14} />} title="Fascia oraria">
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((ts) => {
              const active = form.timeSlots.includes(ts.value);
              return (
                <button
                  key={ts.value}
                  type="button"
                  onClick={() => toggleArray('timeSlots', ts.value)}
                  className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition ${
                    active
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs font-semibold">{ts.label}</span>
                  <span className="text-[11px] opacity-70">{ts.hours}</span>
                </button>
              );
            })}
          </div>
          {errors.timeSlots && <Err msg={errors.timeSlots} />}
        </Section>

        {/* ── Persone e posti ── */}
        <Section icon={<Users size={14} />} title="Persone e posti">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>N° partecipanti previsti</Label>
              <input
                type="number"
                className={inputCls}
                min={1}
                max={p.capacity}
                placeholder={`max ${p.capacity.toLocaleString()}`}
                value={form.people}
                onChange={(e) => set('people', e.target.value)}
              />
              {errors.people && <Err msg={errors.people} />}
            </div>
            <div>
              <Label>Posti a sedere richiesti</Label>
              <input
                type="number"
                className={inputCls}
                min={0}
                placeholder="es. 200"
                value={form.seats}
                onChange={(e) => set('seats', e.target.value)}
              />
            </div>
          </div>
        </Section>

        {/* ── Esigenze particolari ── */}
        <Section icon={<AlertCircle size={14} />} title="Esigenze particolari">
          <div className="flex flex-wrap gap-2">
            {SPECIAL_NEEDS.map((sn) => {
              const active = form.specialNeeds.includes(sn.value);
              return (
                <button
                  key={sn.value}
                  type="button"
                  onClick={() => toggleArray('specialNeeds', sn.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition ${
                    active
                      ? 'bg-violet-50 border-violet-400 text-violet-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{sn.icon}</span>
                  {sn.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Note ── */}
        <Section icon={<MessageSquare size={14} />} title="Note aggiuntive">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Allestimento specifico, richieste tecniche, configurazione sala, altro…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Section>

        {/* ── Contatti ── */}
        <Section icon={<User size={14} />} title="I tuoi contatti">
          <div className="space-y-3">
            <div>
              <Label required>Nome e cognome</Label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={`${inputCls} pl-8`}
                  placeholder="Mario Rossi"
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                />
              </div>
              {errors.contactName && <Err msg={errors.contactName} />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Email</Label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className={`${inputCls} pl-8`}
                    placeholder="mario@example.com"
                    value={form.contactEmail}
                    onChange={(e) => set('contactEmail', e.target.value)}
                  />
                </div>
                {errors.contactEmail && <Err msg={errors.contactEmail} />}
              </div>
              <div>
                <Label>Telefono</Label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputCls} pl-8`}
                    placeholder="+39 345 1234567"
                    value={form.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Submit ── */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
        >
          Invia richiesta →
        </button>
      </form>
    </Overlay>
  );
}

/* ── Helpers ── */

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-h-[92%] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-700 font-semibold text-xs uppercase tracking-wide mb-2">
        <span className="text-blue-500">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return <p className="text-xs text-rose-500 mt-0.5">{msg}</p>;
}
