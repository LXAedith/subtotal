// Small stroke icons, drawn on a 24×24 grid and coloured with currentColor.
const paths = {
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M19 10v8"/><path d="M3 21h18"/>',
  code: '<path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  paste: '<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/><path d="M12 15v3"/><path d="M10.5 16.5h3"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4"/><path d="M15.4 6.5l-6.8 4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  hide: '<path d="M2 2l20 20"/><path d="M6.7 6.7C4.3 8.2 2.7 10.4 2 12c1.6 3.7 5.5 7 10 7 1.9 0 3.7-.6 5.3-1.6"/><path d="M10 5.2c.7-.1 1.3-.2 2-.2 4.5 0 8.4 3.3 10 7-.4 1-1.1 2.1-2 3.1"/>',
  rise: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M9 7V4h6v3"/>',
};

export type IconName = keyof typeof paths;

export function icon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
