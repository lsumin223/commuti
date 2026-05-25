import { Extension, Node } from '@tiptap/core';

// ── FontSize ─────────────────────────────────────────────
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize:      { setFontSize: (v: string) => ReturnType; unsetFontSize: () => ReturnType };
    letterSpacing: { setLetterSpacing: (v: string) => ReturnType; unsetLetterSpacing: () => ReturnType };
    lineHeight:    { setLineHeight: (v: string) => ReturnType };
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (v) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: v }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── LetterSpacing ─────────────────────────────────────────
export const LetterSpacing = Extension.create({
  name: 'letterSpacing',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        letterSpacing: {
          default: null,
          parseHTML: el => el.style.letterSpacing || null,
          renderHTML: attrs => attrs.letterSpacing ? { style: `letter-spacing:${attrs.letterSpacing}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setLetterSpacing: (v) => ({ chain }) =>
        chain().setMark('textStyle', { letterSpacing: v }).run(),
      unsetLetterSpacing: () => ({ chain }) =>
        chain().setMark('textStyle', { letterSpacing: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── LineHeight ────────────────────────────────────────────
export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['paragraph', 'heading'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: el => el.style.lineHeight || null,
          renderHTML: attrs => attrs.lineHeight ? { style: `line-height:${attrs.lineHeight}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: (v: string) => ({ commands }: { commands: any }) =>
        (this.options.types as string[]).every((t) => commands.updateAttributes(t, { lineHeight: v })),
    };
  },
});

// ── Spoiler (접은글) ──────────────────────────────────────
export const Spoiler = Node.create({
  name: 'spoiler',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() { return [{ tag: 'details.spoiler' }]; },
  renderHTML() {
    return [
      'details', { class: 'spoiler' },
      ['summary', {}, '접힌 내용 (클릭하여 펼치기)'],
      ['div', { class: 'spoiler-content' }, 0],
    ];
  },
  addCommands() {
    return {
      toggleSpoiler:
        () =>
        ({ commands }: { commands: any }) =>
          commands.wrapIn(this.name),
    } as any;
  },
});
