import { Panel } from './panel';
import { copy } from '../data/copy';
import { legalDocs, LEGAL_REVIEWED } from '../data/legal';
import { floorplans } from '../data/slides';
import { buildPicture } from '../lib/picture';
import { renderCopy, tkNode } from './tk';
import type { CopyValue } from './tk';

const el = (tag: string, cls?: string, text?: string) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
};

const para = (value: CopyValue, cls = 'panel__p') => {
  const p = el('p', cls);
  p.replaceChildren(...renderCopy(value));
  return p;
};

/** Overview — the body behind the section-label `+`. */
export function overviewPanel(): Panel {
  const panel = new Panel('Overview');
  const nodes: Node[] = [];
  const title = el('h3', 'panel__display');
  title.innerHTML = copy.overview.title.join('<br />');
  nodes.push(title);

  const figure = el('figure', 'panel__figure');
  figure.appendChild(
    buildPicture({
      image: copy.overview.figure.image,
      alt: copy.overview.figure.alt,
      sizes: '(min-width: 650px) min(72ch, 70vw), 100vw',
    }),
  );
  figure.appendChild(el('figcaption', 'panel__caption', copy.overview.figure.caption));
  nodes.push(figure);

  for (const section of copy.overview.sections) {
    nodes.push(el('h4', 'panel__label', section.label));
    for (const p of section.body) nodes.push(para(p));
  }

  nodes.push(el('h4', 'panel__label', copy.overview.highlightsLabel));
  const ul = el('ul', 'panel__list');
  for (const h of copy.overview.highlights) {
    const li = el('li');
    li.replaceChildren(...renderCopy(h as CopyValue));
    ul.appendChild(li);
  }
  nodes.push(ul);

  const dl = el('dl', 'panel__stats');
  for (const [label, value] of copy.overview.stats) {
    dl.appendChild(el('dt', undefined, label as string));
    const dd = el('dd');
    dd.replaceChildren(...renderCopy(value as CopyValue));
    dl.appendChild(dd);
  }
  nodes.push(dl);
  panel.setContent(nodes);
  return panel;
}

export function creditsPanel(): Panel {
  const panel = new Panel('Credits');
  const nodes: Node[] = [];
  const h = el('h3', 'panel__display');
  h.innerHTML = copy.credits.heading.join('<br />');
  nodes.push(h);
  const dl = el('dl', 'panel__stats');
  for (const [name, role] of copy.credits.entries) {
    const dt = el('dt');
    dt.replaceChildren(...renderCopy(name as CopyValue));
    dl.appendChild(dt);
    dl.appendChild(el('dd', undefined, role as string));
  }
  nodes.push(dl);
  nodes.push(
    para(
      'All five are named on the GC title sheet. Confirm each wants to be credited before this ships.',
      'panel__note',
    ),
  );
  panel.setContent(nodes);
  return panel;
}

/**
 * Legal. Gated: while LEGAL_REVIEWED is false the panel says so at the top and
 * on every document, and every missing fact renders as a TK. Drafts are not
 * presented as policy.
 */
export function legalPanel(): Panel {
  const panel = new Panel('Legal');
  const nodes: Node[] = [];

  if (!LEGAL_REVIEWED) {
    const banner = el('div', 'panel__banner');
    banner.appendChild(el('strong', undefined, 'These are drafts, not policy.'));
    banner.appendChild(
      el(
        'p',
        undefined,
        'Nothing below has been reviewed by counsel, and three of the five contain statements of fact about the business that have not been supplied. Do not treat any of it as published terms.',
      ),
    );
    nodes.push(banner);
  }

  for (const doc of legalDocs) {
    const section = el('section', 'panel__doc');
    section.appendChild(el('h3', 'panel__doc-title', doc.title));
    if (!LEGAL_REVIEWED) section.appendChild(el('p', 'panel__doc-status', doc.status));
    for (const p of doc.body) section.appendChild(para(p));
    if (doc.missing?.length) {
      const ul = el('ul', 'panel__list panel__list--missing');
      for (const m of doc.missing) {
        const li = el('li');
        li.append(tkNode('needed'), ` ${m}`);
        ul.appendChild(li);
      }
      section.appendChild(ul);
    }
    nodes.push(section);
  }
  panel.setContent(nodes);
  return panel;
}

/**
 * Floorplans. A floor selector, the plan, and a download.
 *
 * These are construction drawings, not marketing plans — dimension strings and
 * annotations included. Noted as a quality gap in HANDOFF.md.
 */
export function floorplansPanel(): Panel {
  const panel = new Panel('Floorplans');
  const nodes: Node[] = [];

  const note = el(
    'p',
    'panel__note',
    'Construction drawings from the filed set for one house. 221 and 223 are mirror images; dimensions and annotations are shown as drawn.',
  );
  nodes.push(note);

  const tabs = el('div', 'plans__tabs');
  const stage = el('div', 'plans__stage');
  const download = el('a', 'plans__download uline') as HTMLAnchorElement;
  download.textContent = 'Download plan';

  const select = (i: number) => {
    const plan = floorplans[i];
    if (!plan) return;
    stage.replaceChildren(
      buildPicture({
        image: plan.image,
        alt: `${plan.label} plan — construction drawing.`,
        sizes: '(min-width: 650px) 80vw, 100vw',
      }),
    );
    download.href = plan.download;
    download.setAttribute('download', `221-223-waverly-${plan.label.toLowerCase().replace(/\s+/g, '-')}.png`);
    for (const [n, b] of [...tabs.children].entries()) {
      b.setAttribute('aria-selected', String(n === i));
    }
  };

  floorplans.forEach((plan, i) => {
    const b = el('button', 'plans__tab label', plan.label) as HTMLButtonElement;
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => select(i));
    tabs.appendChild(b);
  });
  tabs.setAttribute('role', 'tablist');

  nodes.push(tabs, stage, download);
  panel.setContent(nodes);
  select(0);
  return panel;
}
