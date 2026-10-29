export const CONSOLE_SECTIONS = [
  ['all', 'Tous les réglages'], ['input', 'Entrée / source / polarité'],
  ['eq', 'Égaliseur paramétrique'], ['geq', 'Égaliseur graphique 31 bandes'],
  ['gate', 'Gate / expandeur / ducker'], ['dyn', 'Compresseur'],
  ['mix', 'Volume / panoramique / Main'], ['sends', 'Départs retours / effets'],
  ['groups', 'Groupes DCA / mute'], ['automix', 'Automix parole'],
  ['insert', 'Insertion FX'],
] as const;
export type ConsoleSection = typeof CONSOLE_SECTIONS[number][0];
export function inSection(address: string, section: ConsoleSection): boolean {
  switch (section) {
    case 'all': return true;
    case 'input': return /\/(config|preamp)\//.test(address) || address.startsWith('/headamp/');
    case 'mix': return /\/mix\/(on|fader|lr|pan)$/.test(address) || /^\/dca\/\d+\/(on|fader)$/.test(address);
    case 'sends': return /\/mix\/(\d\d|f[1-4])\//.test(address);
    case 'groups': return address.includes('/grp/');
    case 'insert': return address.includes('/insert/');
    default: return address.includes('/' + section + '/');
  }
}
