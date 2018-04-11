const baseUrl = 'http://ffrk.denagames.com/dff/static/lang/ww/compile/en/';

export function url(subPath: string): string {
  return baseUrl + subPath;
}

export function asset(assetPath?: string): string | undefined {
  return assetPath == null ? undefined : url(assetPath.replace('/Content/lang/', ''));
}

export function magiciteImage(id: number): string {
  return url(`image/beast_active_skill/${id}1/${id}1_128.png`);
}

export function relicImage(id: number, rarity: number): string {
  return url(`equipment/${id}/${id}_${rarity}_112.png`);
}
