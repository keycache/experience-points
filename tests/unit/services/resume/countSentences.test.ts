import { describe, expect, it } from 'vitest';
import { countSentences } from '../../../../src/services/resume/validateGeneratedResume';

describe('countSentences', () => {
  it('counts a single sentence', () => {
    expect(countSentences('Led a major infrastructure migration.')).toBe(1);
  });

  it('counts multiple sentences separated by periods', () => {
    expect(
      countSentences('Led a major infrastructure migration. Reduced costs by 30%. Mentored two engineers.'),
    ).toBe(3);
  });

  it('counts sentences ending in ! or ?', () => {
    expect(countSentences('Shipped it early! Under budget too.')).toBe(2);
  });

  it('counts a trailing sentence with no terminal punctuation', () => {
    expect(countSentences('Led a migration. And also did more')).toBe(2);
  });

  it('returns 0 for empty text', () => {
    expect(countSentences('')).toBe(0);
    expect(countSentences('   ')).toBe(0);
  });
});
