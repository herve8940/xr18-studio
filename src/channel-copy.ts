import {PARAMETERS, type Value} from './parameters.js';
import type {XR18} from './xr18.js';

export const COPY_SECTIONS = ['eq', 'gate', 'dyn', 'sends', 'mix', 'groups', 'automix'] as const;
export type CopySection = typeof COPY_SECTIONS[number];

// Physical preamps, source routing, insert slots and identity are deliberately
// excluded: copying a channel must not repatch it or alter a shared preamp.
export function channelCopyAddresses(source: unknown, target: unknown, sections: unknown) {
  if (!Number.isInteger(source) || Number(source) < 1 || Number(source) > 16 ||
      !Number.isInteger(target) || Number(target) < 1 || Number(target) > 16 || source === target)
    throw Error('Choisir deux canaux distincts entre 1 et 16');
  if (!Array.isArray(sections) || !sections.length || sections.some(s => !COPY_SECTIONS.includes(s)))
    throw Error('Sélectionner les traitements à copier');
  const start = `/ch/${String(source).padStart(2, '0')}/`;
  const destination = `/ch/${String(target).padStart(2, '0')}/`;
  return Object.keys(PARAMETERS).filter(address => {
    if (!address.startsWith(start)) return false;
    const suffix = address.slice(start.length);
    return sections.some(section => {
      if (section === 'sends') return /^mix\/\d\d\//.test(suffix);
      if (section === 'mix') return /^mix\/(on|fader|lr|pan)$/.test(suffix);
      if (section === 'groups') return suffix.startsWith('grp/');
      return suffix.startsWith(section + '/');
    });
  }).map(from => ({from, to: destination + from.slice(start.length)}));
}

export async function readChannelCopy(xr: XR18, source: unknown, target: unknown, sections: unknown) {
  const addresses = channelCopyAddresses(source, target, sections);
  const operation = xr.operationId();
  const values: Record<string, Value> = {};
  for (const {from, to} of addresses) {
    if (operation !== xr.operationId()) throw Error('Connexion modifiée pendant la copie');
    values[to] = await xr.readParameter(from);
  }
  if (operation !== xr.operationId()) throw Error('Connexion modifiée pendant la copie');
  return values;
}
