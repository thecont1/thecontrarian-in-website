import { CR_LOGO_SVG } from "../icons/cr-logo-svg";
import { openC2PAOverlay } from "../../utils/c2pa.js";

type ImageMetadata = {
  filename?: string;
  format?: string;
  size?: [number, number];
  width?: number;
  height?: number;
  exif?: Record<string, any>;
  iptc?: {
    title?: string;
    description?: string;
    location?: string;
    city?: string;
    keywords?: string;
  };
  photography?: {
    camera_make?: string;
    camera_model?: string;
    lens_model?: string;
    aperture?: string;
    shutter_speed?: string;
    iso?: number;
    focal_length?: string;
    date_original?: string;
    date_taken?: string;
    artist?: string;
    copyright?: string;
    description?: string;
    title?: string;
  };
};

type Props = {
  metadata: ImageMetadata;
  imageSrc: string;
  onClose?: () => void;
  showCRButton?: boolean;
  /** When false the panel slides off-screen and becomes non-interactive
   *  (it's still in the DOM so the CSS transition can play out). When
   *  true the panel slides on-screen and accepts pointer events. */
  isVisible?: boolean;
};

type RowData = { label: string; value: string | number };

// Format date from EXIF format (YYYY:MM:DD HH:MM:SS) to readable format
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  // The hosted C2PA/EXIF API returns two formats depending on the field:
  //   - `exif.DateTimeOriginal` is in EXIF format "YYYY:MM:DD HH:MM:SS"
  //   - `photography.date_original` is pre-formatted by the API to
  //     "Mon DD, YYYY at HH:MM AM/PM" (already human-readable)
  // The earlier version of this function assumed EXIF format
  // unconditionally; if it received a string without colons (the
  // pre-formatted kind), split(':') returned one element and
  // destructuring gave `year = "Jul 01, 2017 at 11:22 PM",
  // month = undefined, day = undefined`. parseInt on undefined is
  // NaN; `new Date(NaN, NaN, NaN).toLocaleDateString()` returns the
  // literal string "Invalid Date", which is what every image was
  // showing. Match the Lightbox's logic to handle both formats.
  try {
    if (/^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
      const [datePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split(':');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    // Pre-formatted by the API: "Oct 08, 2021 at 09:17 PM"
    const atIndex = dateStr.indexOf(' at ');
    return atIndex !== -1 ? dateStr.substring(0, atIndex) : dateStr;
  } catch {
    return dateStr;
  }
};

// Placeholders returned by the hosted C2PA/EXIF API when a field is
// missing. The API doesn't return null/empty for these — it returns
// these literal strings — so the panel needs to recognise and drop
// them so the InfoPanel Section can hide those rows. See:
// https://github.com/thecont1/c2pa-viewer — API bug.
const API_PLACEHOLDERS = new Set([
  'Unknown',
  'No description available',
  'None',
  'N/A',
  'n/a',
]);

// Drop API placeholder strings so the Section component's filter
// (which only catches empty/null/undefined) can hide the row. Returns
// the trimmed string with surrounding whitespace removed, or '' if
// the value is nullish, empty, or a recognised placeholder.
const clean = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  if (s === '') return '';
  if (API_PLACEHOLDERS.has(s)) return '';
  return s;
};

// The body's site-wide default artist. Mahesh is the photographer
// behind every image on this site — when the API fails to extract
// an Artist tag from EXIF/IPTC, fall back to this name rather than
// showing "Unknown". The API bug masks the artist on a large
// majority of older images.
const DEFAULT_ARTIST = 'MAHESH SHANTARAM';

// For the Artist field specifically: recognise EXIF's combined
// "Name/email" convention (e.g. "Mahesh Shantaram/ms@thecontrarian.in")
// and return just the name. Also substitute the default for missing
// or placeholder values.
const formatArtist = (raw: string | undefined | null): string => {
  const cleaned = clean(raw);
  if (cleaned === '') return DEFAULT_ARTIST;
  // EXIF "Name<slash>email" combined string
  const slashIdx = cleaned.indexOf('/');
  if (slashIdx > 0) {
    const name = cleaned.substring(0, slashIdx).trim();
    if (name) return name;
  }
  return cleaned;
};

// Format camera make + model into a single string
const formatCameraFull = (make?: string, model?: string): string => {
  if (!model) return make || '';
  if (!make) return model;
  // If model already contains make, just return model
  if (model.toUpperCase().includes(make.toUpperCase())) return model;
  return `${make} ${model}`;
};

// Format exposure time
const formatExposure = (time?: number): string => {
  if (!time) return '';
  if (time >= 1) return `${time}s`;
  return `1/${Math.round(1/time)}s`;
};

// Format metering mode
const formatMeteringMode = (mode?: number): string => {
  const modes: Record<number, string> = {
    0: 'Unknown',
    1: 'Average',
    2: 'Center-weighted',
    3: 'Spot',
    4: 'Multi-spot',
    5: 'Pattern',
    6: 'Partial',
  };
  return mode !== undefined ? (modes[mode] || `Mode ${mode}`) : '';
};

// Format exposure program
const formatExposureProgram = (program?: number): string => {
  const programs: Record<number, string> = {
    0: 'Not defined',
    1: 'Manual',
    2: 'Program AE',
    3: 'Aperture Priority',
    4: 'Shutter Priority',
    5: 'Creative',
    6: 'Action',
    7: 'Portrait',
    8: 'Landscape',
  };
  return program !== undefined ? (programs[program] || '') : '';
};

// Build a flat array of "label-ish + value" chip strings from the
// photo + exif fields. Returns only the chips that have a real
// value (empty fields are skipped). Each string becomes a single
// chip in the Exposure section. Order is deliberate — the visual
// mnemonic photographers use is "focal length → aperture → shutter
// → ISO → exposure correction → program → metering", the triangle
// plus outcome.
const buildExposureChips = (photo: any, exif: any): string[] => {
  const chips: string[] = [];

  const focal = clean(photo.focal_length);
  if (focal) {
    const eq = exif.FocalLengthIn35mmFilm ? ` (${exif.FocalLengthIn35mmFilm}mm eq.)` : '';
    chips.push(`${focal}${eq}`);
  }

  const aperture = clean(photo.aperture) || (exif.FNumber ? `f/${exif.FNumber}` : '');
  if (aperture) chips.push(aperture);

  const shutter = clean(photo.shutter_speed) || formatExposure(exif.ExposureTime);
  if (shutter) chips.push(shutter);

  const iso = clean(photo.iso) || clean(exif.ISOSpeedRatings);
  if (iso) chips.push(`ISO ${iso}`);

  const bias = exif.ExposureBiasValue;
  if (typeof bias === 'number' && !Number.isNaN(bias)) {
    const formatted = bias > 0 ? `+${bias} EV` : `${bias} EV`;
    chips.push(formatted);
  }

  const program = formatExposureProgram(exif.ExposureProgram);
  if (program && program !== 'Not defined') chips.push(program);

  const metering = formatMeteringMode(exif.MeteringMode);
  if (metering) chips.push(metering);

  return chips;
};

// Merge "Camera" (device identity: make+model, lens) with the
// Exposure chips into a single "Device Settings" section. The
// device identity sits at the top of the section so the user sees
// "what was used" before "what was set"; the chips follow for the
// capture triangle (focal/aperture/shutter/ISO/etc).
type DeviceSettingsProps = {
  identityRows: RowData[];
  exposureChips: string[];
};
const DeviceSettings = ({ identityRows, exposureChips }: DeviceSettingsProps) => {
  const validIdentity = identityRows.filter(
    (r) => r.value !== '' && r.value !== undefined && r.value !== null
  );
  if (validIdentity.length === 0 && exposureChips.length === 0) return null;
  return (
    <div className="info-panel-section">
      <div className="info-panel-section-title">Device Settings</div>
      {validIdentity.length > 0 && (
        <div className="info-panel-details">
          {validIdentity.map((row, i) => (
            <div className="info-panel-row" key={i}>
              <span className="info-panel-label">{row.label}</span>
              <span className="info-panel-value">{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {exposureChips.length > 0 && (
        <div className="info-panel-chips">
          {exposureChips.map((chip, i) => (
            <span className="info-panel-chip" key={i}>{chip}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// Render the Exposure section as a row of inline "chips" instead
// of the standard label/value table. Each chip is a self-contained
// value (units like "23mm" / "f/3.2" / "ISO 200" are baked in), so
// the panel can drop the row's label slot and save a row's worth
// of vertical space (~16-18px per row at the panel's line-height).
// Replaced by DeviceSettings; kept exported in case other consumers
// (Lightbox fallback) want a chips-only view.
type ExposureChipsProps = { chips: string[] };
const ExposureChips = ({ chips }: ExposureChipsProps) => {
  if (chips.length === 0) return null;
  return (
    <div className="info-panel-section">
      <div className="info-panel-section-title">Exposure</div>
      <div className="info-panel-chips">
        {chips.map((chip, i) => (
          <span className="info-panel-chip" key={i}>{chip}</span>
        ))}
      </div>
    </div>
  );
};

// Section component for cleaner rendering
const Section = ({ title, rows }: { title: string; rows: RowData[] }) => {
  const validRows = rows.filter(r => r.value !== '' && r.value !== undefined && r.value !== null);
  if (validRows.length === 0) return null;
  
  return (
    <div className="info-panel-section">
      <div className="info-panel-section-title">{title}</div>
      <div className="info-panel-details">
        {validRows.map((row, i) => (
          <div className="info-panel-row" key={i}>
            <span className="info-panel-label">{row.label}</span>
            <span className="info-panel-value">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function InfoPanel({ metadata, imageSrc, onClose, showCRButton = true, isVisible = false }: Props) {
  const photo = metadata.photography || {};
  const exif = metadata.exif || {};
  
  const cameraFull = formatCameraFull(photo.camera_make, photo.camera_model);
  const dateFormatted = formatDate(photo.date_original || exif.DateTimeOriginal);
  const timeOriginal = exif.DateTimeOriginal?.split(' ')[1] || '';

  const handleCRClick = () => {
    openC2PAOverlay(imageSrc);
  };

  // Build section data — every value runs through `clean()` so the
  // API's placeholder strings ("Unknown", "No description available")
  // become empty strings and the Section component filters the row.
  // Artist has its own special-cased formatter: missing/placeholder
  // values fall back to DEFAULT_ARTIST; combined "Name/email" EXIF
  // strings get the email stripped.
  const iptc = metadata.iptc || {};
  const fileRows: RowData[] = [
    { label: 'File', value: clean(metadata.filename) },
    { label: 'Format', value: clean(metadata.format) },
    { label: 'Dimensions', value: (metadata.width && metadata.height) ? `${metadata.width} × ${metadata.height}` : '' },
  ];

  const cameraRows: RowData[] = [
    { label: 'Camera', value: clean(cameraFull) },
    { label: 'Lens', value: clean(photo.lens_model) },
    { label: 'Body S/N', value: clean(exif.BodySerialNumber) },
    { label: 'Lens S/N', value: clean(exif.LensSerialNumber) },
  ];

  // Exposure is rendered as inline chips (ExposureChips component
  // below), not the standard Section. Build the chip list here.
  const exposureChips = buildExposureChips(photo, exif);

  const captureRows: RowData[] = [
    { label: 'Date', value: dateFormatted },
    { label: 'Time', value: timeOriginal ? `${timeOriginal}${exif.OffsetTime ? ` (${exif.OffsetTime})` : ''}` : '' },
  ];

  // Best-available description text. The hosted C2PA/EXIF API returns
  // the literal placeholder "No description available" in
  // `photography.description` when no real description was found in
  // the image, so we ignore that placeholder and prefer the IPTC
  // fields — which is where photographers actually enter
  // caption/copyright/title text. The Section component also drops
  // empty rows, so this const ensures the description never shows
  // "No description available" literal text.
  const rawDescription =
    clean(iptc.description) ||
    clean(iptc.title) ||
    clean(photo.description) ||
    clean(photo.title) ||
    '';

  const processingRows: RowData[] = [
    { label: 'Software', value: clean(exif.Software) },
    { label: 'Color Space', value: exif.ColorSpace === 1 ? 'sRGB' : (exif.ColorSpace ? `${exif.ColorSpace}` : '') },
    { label: 'Resolution', value: (exif.XResolution && exif.YResolution) ? `${exif.XResolution} × ${exif.YResolution} ${exif.ResolutionUnit === 2 ? 'DPI' : 'DPCM'}` : '' },
  ];

  const creditRows: RowData[] = [
    // Try photo.artist first; fall back to exif.Artist; substitute
    // DEFAULT_ARTIST when both are missing/placeholder.
    { label: 'Artist', value: formatArtist(photo.artist || exif.Artist) },
    { label: 'Copyright', value: clean(photo.copyright) || clean(exif.Copyright) },
  ];

  return (
    <div
      className={`carousel-info-panel${isVisible ? " is-visible" : ""}`}
      aria-hidden={!isVisible}
      inert={isVisible ? undefined : true}
    >
      {/* Header */}
      <div className="info-panel-header">
        <span className="info-panel-title">Image Info</span>
        {onClose && (
          <button
            type="button"
            className="info-panel-close"
            onClick={onClose}
            aria-label="Close image info"
            title="Close"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        )}
      </div>

      {/* Description/Caption */}
      {rawDescription && (
        <p className="info-panel-description">{rawDescription}</p>
      )}

      {/* Sections */}
      <Section title="File" rows={fileRows} />
      <DeviceSettings identityRows={cameraRows} exposureChips={exposureChips} />
      <Section title="Capture" rows={captureRows} />
      <Section title="Processing" rows={processingRows} />
      <Section title="Credits" rows={creditRows} />

      {/* C2PA Content Credentials button */}
      {showCRButton && (
        <button
          className="c2pa-indicator info-panel-cr-button"
          onClick={handleCRClick}
          aria-label="View Content Credentials"
        >
          <span dangerouslySetInnerHTML={{ __html: CR_LOGO_SVG }} />
          <span className="c2pa-indicator-label">content credentials</span>
        </button>
      )}
    </div>
  );
}
