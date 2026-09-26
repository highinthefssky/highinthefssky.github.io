import { ANALYTICS_ENDPOINT, ANALYTICS_OPT_OUT, analyticsPayload, isYouTubeLink } from '../lib/analytics';

const configured = document.querySelector('meta[name="site-analytics"]')?.getAttribute('content') === 'plausible';
const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
const privacyWindow = window as Window & { doNotTrack?: string };
const preference = document.querySelector<HTMLInputElement>('#analytics-opt-out');
const preferenceStatus = document.querySelector<HTMLElement>('#analytics-preference-status');
let pageOptOut = false;

function privacySignal(): boolean {
  return navigator.doNotTrack === '1' || privacyWindow.doNotTrack === '1' || privacyNavigator.globalPrivacyControl === true;
}

function optedOut(): boolean {
  if (pageOptOut || privacySignal()) return true;
  try { return localStorage.getItem(ANALYTICS_OPT_OUT) === 'true'; } catch { return true; }
}

function send(name: string) {
  if (!configured || optedOut()) return;
  const payload = analyticsPayload(name, location.href);
  if (!payload) return;
  void fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    keepalive: true,
  }).catch(() => {});
}

function refreshPreference() {
  if (!preference) return;
  preference.checked = optedOut();
  preference.disabled = privacySignal();
  if (preferenceStatus) preferenceStatus.textContent = preference.disabled
    ? 'Analytics is disabled by your browser privacy signal.'
    : preference.checked ? 'Analytics is disabled in this browser.' : 'Your browser has not opted out of analytics.';
}

preference?.addEventListener('change', () => {
  pageOptOut = preference.checked;
  try {
    if (preference.checked) localStorage.setItem(ANALYTICS_OPT_OUT, 'true');
    else localStorage.removeItem(ANALYTICS_OPT_OUT);
    refreshPreference();
  } catch {
    preference.checked = true;
    pageOptOut = true;
    if (preferenceStatus) preferenceStatus.textContent = 'Preferences could not be saved. Analytics is disabled for this page. Use your browser privacy signals to opt out across visits.';
  }
});
window.addEventListener('storage', (event) => {
  if (event.key === ANALYTICS_OPT_OUT || event.key === null) {
    pageOptOut = false;
    refreshPreference();
  }
});
refreshPreference();

send('pageview');
if (document.querySelector<HTMLElement>('#wizard-results')?.style.display === 'block') send('Wizard Results');
window.addEventListener('site-analytics-event', (event) => {
  const name = (event as CustomEvent<unknown>).detail;
  if (typeof name === 'string' && name !== 'pageview') send(name);
});
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a[href]');
  if (link && isYouTubeLink(link.href)) send('YouTube Click');
});