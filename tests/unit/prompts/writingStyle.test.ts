import { describe, expect, it } from 'vitest';
import {
  buildWritingStyleContent,
  resolveWritingStyleInstruction,
} from '../../../src/prompts/writing-style';
import { buildValidCareerProfile } from '../schemas/fixtures';

describe('resolveWritingStyleInstruction', () => {
  it('accepts raw style text and uses it directly', () => {
    const instruction = resolveWritingStyleInstruction({
      writingStyle: { mode: 'raw', rawText: 'Confident, concise, first-person.' },
    });

    expect(instruction).toContain('Confident, concise, first-person.');
    expect(instruction).not.toMatch(/extrapolate/i);
  });

  it('accepts structured style fields and formats them', () => {
    const instruction = resolveWritingStyleInstruction({
      writingStyle: {
        mode: 'structured',
        tone: 'warm and direct',
        voice: 'first-person',
        formality: 'formal',
        notes: 'Avoid buzzwords.',
      },
    });

    expect(instruction).toContain('Tone: warm and direct');
    expect(instruction).toContain('Voice: first-person');
    expect(instruction).toContain('Formality: formal');
    expect(instruction).toContain('Additional notes: Avoid buzzwords.');
  });

  it('triggers extrapolation instructions instead of a hardcoded default when unspecified', () => {
    const profile = buildValidCareerProfile();
    profile.professionalSummarySource = 'I prefer plain, direct language.';

    const instruction = resolveWritingStyleInstruction({
      writingStyle: { mode: 'unspecified' },
      careerProfile: profile,
    });

    expect(instruction).toMatch(/extrapolate/i);
    expect(instruction).toMatch(/years of experience/i);
    expect(instruction).toMatch(/education level/i);
    expect(instruction).toContain('I prefer plain, direct language.');
  });

  it('triggers extrapolation instructions when no writing style is supplied at all', () => {
    const instruction = resolveWritingStyleInstruction({});

    expect(instruction).toMatch(/extrapolate/i);
    expect(instruction).not.toMatch(/tone: /i);
  });

  it('falls back to extrapolation when raw mode has no text', () => {
    const instruction = resolveWritingStyleInstruction({ writingStyle: { mode: 'raw' } });

    expect(instruction).toMatch(/extrapolate/i);
  });
});

describe('buildWritingStyleContent', () => {
  it('wraps the resolved instruction as text content usable in a generation request', () => {
    const content = buildWritingStyleContent({
      writingStyle: { mode: 'raw', rawText: 'Warm and encouraging.' },
    });

    expect(content).toEqual({ type: 'text', text: expect.stringContaining('Warm and encouraging.') });
  });

  it('can be included alongside other content parts in a resume-generation-style request', () => {
    const styleContent = buildWritingStyleContent({
      writingStyle: { mode: 'raw', rawText: 'Warm and encouraging.' },
    });

    // Simulates how Stage 9's resume-generation prompt will assemble its
    // userContent array: JD/profile/matching content plus the resolved
    // writing style content.
    const userContent = [
      { type: 'text' as const, text: 'Job Description: ...' },
      { type: 'text' as const, text: 'Career Profile: ...' },
      styleContent,
    ];

    expect(userContent).toContainEqual(styleContent);
    expect(
      userContent.some((part) => part.type === 'text' && part.text.includes('Warm and encouraging.')),
    ).toBe(true);
  });
});
