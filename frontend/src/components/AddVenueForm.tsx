import { useState } from 'react';
import type { VenueCategory } from '../types/venue';

interface AddVenueFormProps {
  onBack: () => void;
}

const AMENITIES_OPTIONS = [
  'WiFi', 'Parcheggio', 'Catering', 'A/V', 'Aria Condizionata',
  'Palco', 'Spogliatoi', 'Ristorante', 'Bar', 'Navetta',
  'Accessibile Disabili', 'Area Esposizione', 'Sala Stampa', 'Traduzione Simultanea',
];

const REGIONS = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia',
  'Toscana', 'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];

const CATEGORY_OPTIONS: { value: VenueCategory; label: string; emoji: string }[] = [
  { value: 'conference', label: 'Congressi', emoji: '🏛️' },
  { value: 'exhibition', label: 'Fiere', emoji: '🏪' },
  { value: 'sports', label: 'Sport', emoji: '🏟️' },
  { value: 'entertainment', label: 'Intrattenimento', emoji: '🎭' },
];

interface FormData {
  name: string;
  category: VenueCategory | '';
  description: string;
  address: string;
  city: string;
  region: string;
  lat: string;
  lng: string;
  capacity: string;
  rating: string;
  phone: string;
  email: string;
  website: string;
  image: string;
  amenities: string[];
}

const EMPTY_FORM: FormData = {
  name: '', category: '', description: '',
  address: '', city: '', region: '',
  lat: '', lng: '',
  capacity: '', rating: '',
  phone: '', email: '', website: '',
  image: '',
  amenities: [],
};

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-700">
      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-300">
        {label}
        {required && <span className="text-cyan-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const inputCls = `
  w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
  text-sm text-white placeholder-slate-500
  focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40
  transition-colors
`.trim();

export default function AddVenueForm({ onBack }: AddVenueFormProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleAmenity(a: string) {
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter((x) => x !== a)
      : [...form.amenities, a]);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = 'Campo obbligatorio';
    if (!form.category) e.category = 'Seleziona una categoria';
    if (!form.city.trim()) e.city = 'Campo obbligatorio';
    if (!form.region) e.region = 'Seleziona una regione';
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0)
      e.capacity = 'Inserisci un numero valido';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email non valida';
    if (form.lat && isNaN(Number(form.lat))) e.lat = 'Valore numerico';
    if (form.lng && isNaN(Number(form.lng))) e.lng = 'Valore numerico';
    if (form.rating && (isNaN(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 5))
      e.rating = 'Valore tra 0 e 5';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Header onBack={onBack} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-4xl mx-auto mb-6">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Venue inserita!</h2>
            <p className="text-slate-400 mb-2">
              <span className="text-cyan-400 font-medium">{form.name}</span> è stata registrata con successo nel sistema.
            </p>
            <p className="text-xs text-slate-500 mb-8">
              In un sistema live, i dati verrebbero salvati nel database e apparirebbero sulla mappa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                + Aggiungi un'altra venue
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                ← Torna alla mappa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header onBack={onBack} />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} noValidate>
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

            {hasErrors && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-red-400 text-lg shrink-0">⚠️</span>
                <p className="text-sm text-red-300">
                  Alcuni campi richiedono attenzione. Controlla i messaggi evidenziati in rosso.
                </p>
              </div>
            )}

            {/* Sezione 1 – Informazioni generali */}
            <Section>
              <SectionHeader icon="📋" title="Informazioni generali" subtitle="Nome, tipo e descrizione della venue" />
              <div className="space-y-4">
                <Field label="Nome della venue" required>
                  <input
                    className={inputCls}
                    placeholder="es. Palazzo dei Congressi Roma"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                  {errors.name && <ErrorMsg msg={errors.name} />}
                </Field>

                <Field label="Categoria" required>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORY_OPTIONS.map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('category', value)}
                        className={`
                          flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors
                          ${form.category === value
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'}
                        `}
                      >
                        <span className="text-xl">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                  {errors.category && <ErrorMsg msg={errors.category} />}
                </Field>

                <Field label="Descrizione" hint="Breve testo descrittivo mostrato nel dettaglio venue">
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Descrivi brevemente la venue, le sue caratteristiche e il contesto..."
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* Sezione 2 – Posizione */}
            <Section>
              <SectionHeader icon="📍" title="Posizione" subtitle="Indirizzo e coordinate geografiche" />
              <div className="space-y-4">
                <Field label="Indirizzo">
                  <input
                    className={inputCls}
                    placeholder="es. Piazza J.F. Kennedy, 1"
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </Field>
                <FieldGroup>
                  <Field label="Città" required>
                    <input
                      className={inputCls}
                      placeholder="es. Roma"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                    />
                    {errors.city && <ErrorMsg msg={errors.city} />}
                  </Field>
                  <Field label="Regione" required>
                    <select
                      className={inputCls}
                      value={form.region}
                      onChange={(e) => set('region', e.target.value)}
                    >
                      <option value="">— Seleziona —</option>
                      {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.region && <ErrorMsg msg={errors.region} />}
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field label="Latitudine" hint="Es. 41.8902">
                    <input
                      className={inputCls}
                      placeholder="41.8902"
                      value={form.lat}
                      onChange={(e) => set('lat', e.target.value)}
                    />
                    {errors.lat && <ErrorMsg msg={errors.lat} />}
                  </Field>
                  <Field label="Longitudine" hint="Es. 12.4922">
                    <input
                      className={inputCls}
                      placeholder="12.4922"
                      value={form.lng}
                      onChange={(e) => set('lng', e.target.value)}
                    />
                    {errors.lng && <ErrorMsg msg={errors.lng} />}
                  </Field>
                </FieldGroup>
              </div>
            </Section>

            {/* Sezione 3 – Capacità */}
            <Section>
              <SectionHeader icon="👥" title="Capacità e valutazione" />
              <FieldGroup>
                <Field label="Capacità massima (persone)" required>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    placeholder="es. 3000"
                    value={form.capacity}
                    onChange={(e) => set('capacity', e.target.value)}
                  />
                  {errors.capacity && <ErrorMsg msg={errors.capacity} />}
                </Field>
                <Field label="Rating" hint="Da 0.0 a 5.0">
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    placeholder="es. 4.5"
                    value={form.rating}
                    onChange={(e) => set('rating', e.target.value)}
                  />
                  {errors.rating && <ErrorMsg msg={errors.rating} />}
                </Field>
              </FieldGroup>
            </Section>

            {/* Sezione 4 – Contatti */}
            <Section>
              <SectionHeader icon="📞" title="Contatti" />
              <div className="space-y-4">
                <FieldGroup>
                  <Field label="Telefono">
                    <input
                      className={inputCls}
                      placeholder="+39 06 1234567"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={inputCls}
                      type="email"
                      placeholder="info@venue.it"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                    />
                    {errors.email && <ErrorMsg msg={errors.email} />}
                  </Field>
                </FieldGroup>
                <Field label="Sito web">
                  <input
                    className={inputCls}
                    placeholder="https://www.venue.it"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* Sezione 5 – Servizi */}
            <Section>
              <SectionHeader icon="⚙️" title="Servizi disponibili" subtitle="Seleziona tutti i servizi offerti dalla venue" />
              <div className="flex flex-wrap gap-2">
                {AMENITIES_OPTIONS.map((a) => {
                  const active = form.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                        ${active
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'}
                      `}
                    >
                      {active ? '✓ ' : ''}{a}
                    </button>
                  );
                })}
              </div>
              {form.amenities.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  {form.amenities.length} servizio/i selezionato/i
                </p>
              )}
            </Section>

            {/* Sezione 6 – Immagine */}
            <Section>
              <SectionHeader icon="🖼️" title="Immagine" subtitle="URL di un'immagine rappresentativa" />
              <Field label="URL immagine" hint="Incolla il link diretto a un'immagine (jpg, png, webp…)">
                <input
                  className={inputCls}
                  placeholder="https://images.unsplash.com/…"
                  value={form.image}
                  onChange={(e) => set('image', e.target.value)}
                />
              </Field>
              {form.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 h-40">
                  <img
                    src={form.image}
                    alt="Anteprima"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </Section>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
              <button
                type="submit"
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Salva venue →
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-colors text-sm"
              >
                Azzera
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        ← Smart Venues Portal
      </button>
      <div className="h-4 w-px bg-slate-700" />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
        ➕ Aggiungi Venue
      </div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-xs text-red-400 mt-0.5">{msg}</p>;
}
