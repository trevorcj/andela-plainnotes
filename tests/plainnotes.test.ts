import { describe, it, expect } from 'vitest';
import { generateFallbackNote } from '../lib/ai-simplifier';
import { CURATED_AFRICAN_NOTES } from '../lib/curated-notes';
import { generateOfflineHtml } from '../lib/export-offline';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../lib/types/plainnotes';

describe('PlainNotes Architecture & Pedagogy Engine', () => {
  it('supports all required African and regional languages', () => {
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain('pidgin');
    expect(codes).toContain('yoruba');
    expect(codes).toContain('hausa');
    expect(codes).toContain('igbo');
    expect(codes).toContain('english');
    expect(codes).toContain('french');
    expect(codes).toContain('swahili');
  });

  it('generates a complete academic note with African analogy and 3 essentials', () => {
    const note = generateFallbackNote({
      text: 'Photosynthesis is the cellular conversion of sunlight into chemical glucose using water and carbon dioxide.',
      language: 'pidgin',
      subject: 'Biology',
      level: 'secondary'
    });

    expect(note.title).toBeDefined();
    expect(note.simplifiedText.length).toBeGreaterThan(20);
    expect(note.localAnalogy.length).toBeGreaterThan(20);
    expect(note.examEssentials).toHaveLength(3);
    expect(note.quiz.options).toHaveLength(4);
    expect(note.quiz.answerIndex).toBeGreaterThanOrEqual(0);
    expect(note.quiz.answerIndex).toBeLessThanOrEqual(3);
    expect(note.quiz.explanation).toBeDefined();
    expect(note.whatsappText).toContain('PLAINNOTES');
  });

  it('adapts analogies based on subject and dialect (e.g. Pidgin)', () => {
    const physNote = generateFallbackNote({
      text: 'Newton third law action and reaction force pairs',
      language: 'pidgin',
      subject: 'Physics'
    });
    expect(physNote.localAnalogy.toLowerCase()).toMatch(/canoe|push|ground/);

    const econNote = generateFallbackNote({
      text: 'Inflation and currency depreciation over time',
      language: 'pidgin',
      subject: 'Economics'
    });
    expect(econNote.localAnalogy.toLowerCase()).toMatch(/market|mile 12|bodija|tomato/);
  });

  it('curated library contains high quality notes in multiple languages', () => {
    expect(CURATED_AFRICAN_NOTES.length).toBeGreaterThanOrEqual(8);

    const languagesInCurated = new Set(CURATED_AFRICAN_NOTES.map(n => n.language));
    expect(languagesInCurated.has('pidgin')).toBe(true);
    expect(languagesInCurated.has('yoruba')).toBe(true);
    expect(languagesInCurated.has('hausa')).toBe(true);
    expect(languagesInCurated.has('igbo')).toBe(true);
    expect(languagesInCurated.has('swahili')).toBe(true);
    expect(languagesInCurated.has('french')).toBe(true);
    expect(languagesInCurated.has('english')).toBe(true);

    CURATED_AFRICAN_NOTES.forEach(note => {
      expect(note.examEssentials).toHaveLength(3);
      expect(note.quiz.options).toHaveLength(4);
      expect(note.whatsappText).toBeDefined();
    });
  });

  it('generates standalone offline HTML capsule with zero online dependencies', () => {
    const sample = CURATED_AFRICAN_NOTES[0];
    const html = generateOfflineHtml(sample);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('OFFLINE CAPSULE');
    expect(html).toContain('Photosynthesis &amp; Solar Sugar Conversion');
    expect(html).toContain(sample.simplifiedText);
    expect(html).toContain('box-shadow: none !important');
    // Ensure no external script or font link that would stall offline
    expect(html).not.toContain('<script src=');
  });
});
