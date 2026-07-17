export function countEnabledPermissions(permissions: { [key: string]: boolean }): number {
  return Object.values(permissions).filter(Boolean).length;
}

export function permissionsEqual(a: { [key: string]: boolean }, b: { [key: string]: boolean }): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!!a[key] !== !!b[key]) {
      return false;
    }
  }
  return true;
}

export interface SplitLabel {
  pre: string;
  match: string;
  post: string;
}

export function splitLabel(label: string, term: string): SplitLabel {
  if (!term) {
    return { pre: label, match: '', post: '' };
  }
  const index = label.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) {
    return { pre: label, match: '', post: '' };
  }
  return {
    pre: label.slice(0, index),
    match: label.slice(index, index + term.length),
    post: label.slice(index + term.length)
  };
}
