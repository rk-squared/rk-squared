import * as cheerio from 'cheerio';
import { EnlirElement } from './enlir';

const classToElement: Record<string, EnlirElement> = {
  fire: 'Fire',
  ice: 'Ice',
  thunder: 'Lightning',
  soil: 'Earth',
  wind: 'Wind',
  water: 'Water',
  holy: 'Holy',
  darkness: 'Dark',
  poison: 'Poison',
};

export interface BattleTips {
  name: string;
  weak?: EnlirElement[];
  resist?: EnlirElement[];
  absorb?: EnlirElement[];
  null?: EnlirElement[];
}

export function parseBattleTips(content: string) {
  const $ = cheerio.load(content);

  const sections: BattleTips[] = $('.s-tip-battle-title')
    .map((index, item) => $(item).text())
    .toArray()
    .map((i) => ({ name: (i as unknown) as string }));

  for (let i = 0; i < sections.length; i++) {
    const node = $('.s-element-icon-list').get(i);
    if (!node) {
      continue;
    }
    const elements = $(node)
      .children('.s-element-icon-list__children')
      .toArray()

      // Turn items like
      //
      // <div class="p-icon-wind img-rep mlr-a m"></div>
      // <div class="p-text-none img-rep mlr-a mt-6"></div>
      //
      // into ['wind', 'none']
      .map((item) =>
        $(item)
          .children('.img-rep')
          .toArray()
          .map(
            (item) =>
              $(item)
                .attr('class')
                ?.match(/p-(?:text|icon)-(\w+)/)?.[1],
          ),
      )

      // Turn items like ['wind', 'none'] to { element: 'Wind', resist: 'none' }.
      // resist may be none, void, absorption, weak, half
      .map(([element, resist]) =>
        !element || !resist ? undefined : { element: classToElement[element], resist },
      );

    const getElements = (which: string) => {
      const result = elements.filter((i) => i?.resist === which).map((i) => i!.element);
      return result.length ? result : undefined;
    };
    sections[i].weak = getElements('weak');
    sections[i].resist = getElements('half');
    sections[i].absorb = getElements('absorption');
    sections[i].null = getElements('void');
  }

  return sections;
}
