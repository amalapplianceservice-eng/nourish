// Camera barcode scanner. Uses the browser's BarcodeDetector when available (Chrome/Android),
// otherwise a bundled ZXing WebAssembly reader (iPhone Safari has no native BarcodeDetector).
import { html, useState, useEffect, useRef } from '../vendor/preact-htm.js';
import { getState } from './store.js';
import { lookupBarcode } from './api.js';
import { Icon } from './ui.js';
import { t } from './i18n.js';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
let detectorPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(t('scan.loadError')));
    document.head.appendChild(s);
  });
}

/** Lazily create a barcode detector (shared across scans). */
export function getDetector() {
  detectorPromise ||= (async () => {
    if ('BarcodeDetector' in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        if (supported.includes('ean_13')) return new window.BarcodeDetector({ formats: FORMATS.filter((f) => supported.includes(f)) });
      } catch { /* fall through to the bundled reader */ }
    }
    if (!window.BarcodeDetectionAPI) await loadScript(new URL('../vendor/barcode-detector.js', import.meta.url).href);
    const api = window.BarcodeDetectionAPI;
    const wasmUrl = new URL('../vendor/zxing_reader.wasm', import.meta.url).href;
    api.prepareZXingModule({
      overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
      fireImmediately: true,
    });
    return new api.BarcodeDetector({ formats: FORMATS });
  })();
  detectorPromise.catch(() => { detectorPromise = null; });
  return detectorPromise;
}

const isValidCode = (code) => /^\d{8}$|^\d{12,14}$/.test(code);

/**
 * Full-screen scanner.
 * onFound(item) — product found; onNotFound(code) — user wants to add it manually; onClose().
 */
export function Scanner({ onFound, onNotFound, onClose }) {
  const videoRef = useRef();
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | looking | notfound | denied | error
  const [code, setCode] = useState('');
  const [manual, setManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [torch, setTorch] = useState(null); // null = unsupported, false/true = state
  const [message, setMessage] = useState('');
  const scanning = useRef(true);

  const stopCamera = () => {
    scanning.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const lookup = async (value) => {
    scanning.current = false;
    setCode(value);
    setStatus('looking');
    navigator.vibrate?.(30);
    const { customFoods, settings } = getState();
    const mine = customFoods.find((f) => f.barcode === value);
    if (mine) { stopCamera(); onFound(mine); return; }
    try {
      const item = await lookupBarcode(value, settings.usdaKey);
      if (item) { stopCamera(); onFound(item); }
      else setStatus('notfound');
    } catch {
      setMessage(t('scan.offline'));
      setStatus('notfound');
    }
  };

  const resume = () => {
    setStatus('scanning');
    setMessage('');
    setManual(false);
    scanning.current = true;
    loop();
  };

  // Detect from the centre band of the frame (where the viewfinder is) at reduced size for speed.
  const canvas = useRef(document.createElement('canvas'));
  const loop = async () => {
    const detector = await getDetector().catch((e) => { setMessage(e.message); setStatus('error'); return null; });
    while (detector && scanning.current) {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth) {
        const vw = video.videoWidth, vh = video.videoHeight;
        // Generous band around the viewfinder so slightly off-centre barcodes still read.
        const cw = vw * 0.95, ch = Math.min(vh * 0.6, cw * 0.85);
        const scale = Math.min(1, 960 / cw);
        const c = canvas.current;
        c.width = Math.round(cw * scale);
        c.height = Math.round(ch * scale);
        c.getContext('2d', { willReadFrequently: true }).drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, c.width, c.height);
        try {
          const found = (await detector.detect(c)).map((b) => b.rawValue).find(isValidCode);
          if (found && scanning.current) { await lookup(found); return; }
        } catch { /* frame not ready; keep going */ }
      }
      await new Promise((r) => setTimeout(r, 120));
    }
  };

  useEffect(() => {
    getDetector().catch(() => {}); // start loading the reader while the camera spins up
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('denied'); setManual(true); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!scanning.current) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => {});
        const track = stream.getVideoTracks()[0];
        if (track?.getCapabilities?.().torch) setTorch(false);
        setStatus('scanning');
        loop();
      } catch {
        setStatus('denied');
        setManual(true);
      }
    })();
    return stopCamera;
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch); } catch { setTorch(null); }
  };

  const close = () => { stopCamera(); onClose(); };
  const submitManual = (e) => {
    e.preventDefault();
    const v = manualCode.replace(/\D/g, '');
    if (v.length >= 8) lookup(v);
  };

  return html`
    <div class="scanner" role="dialog" aria-label=${t('scan.title')}>
      <video ref=${videoRef} class="scanner-video" playsinline muted autoplay></video>
      <div class="scanner-shade"></div>

      <div class="scanner-top">
        <button class="scanner-btn" aria-label=${t('scan.close')} onClick=${close}><${Icon} name="x" /></button>
        <div class="semi">${t('scan.title')}</div>
        ${torch !== null
          ? html`<button class=${'scanner-btn' + (torch ? ' on' : '')} aria-label=${t('scan.flash')} onClick=${toggleTorch}><${Icon} name="flashlight" /></button>`
          : html`<span style="width:44px"></span>`}
      </div>

      ${status !== 'denied' && html`
        <div class=${'viewfinder' + (status === 'looking' ? ' found' : '')}>
          <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
          ${status === 'scanning' && html`<span class="scan-line"></span>`}
        </div>`}

      <div class="scanner-bottom">
        ${status === 'starting' && html`<div class="scanner-msg"><span class="spinner"></span> ${t('scan.starting')}</div>`}
        ${status === 'scanning' && html`<div class="scanner-msg">${t('scan.point')}</div>`}
        ${status === 'looking' && html`<div class="scanner-msg"><span class="spinner"></span> ${t('scan.looking', { code })}</div>`}
        ${status === 'error' && html`<div class="scanner-msg">${message}</div>`}
        ${status === 'denied' && html`
          <div class="scanner-card">
            <div class="semi">${t('scan.noCamera')}</div>
            <div class="small muted">${t('scan.noCameraBody')}</div>
          </div>`}
        ${status === 'notfound' && html`
          <div class="scanner-card pop-in">
            <div class="semi">${message || t('scan.notFound')}</div>
            <div class="small muted">${message ? '' : t('scan.notFoundBody', { code })}</div>
            <div class="row" style="margin-top:10px">
              <button class="btn secondary" style="padding:12px" onClick=${resume}>${t('scan.again')}</button>
              <button class="btn" style="padding:12px" onClick=${() => { stopCamera(); onNotFound(code); }}>${t('scan.addIt')}</button>
            </div>
          </div>`}

        ${manual
          ? html`
            <form class="scanner-card manual" onSubmit=${submitManual}>
              <input class="field num" inputmode="numeric" placeholder=${t('scan.number')} value=${manualCode} autofocus
                onInput=${(e) => setManualCode(e.currentTarget.value)} aria-label=${t('scan.number')} />
              <button class="chip on" type="submit" disabled=${manualCode.replace(/\D/g, '').length < 8}>${t('scan.lookup')}</button>
            </form>`
          : (status === 'scanning' || status === 'starting') && html`
            <button class="scanner-link" onClick=${() => setManual(true)}>${t('scan.type')}</button>`}
      </div>
    </div>`;
}
