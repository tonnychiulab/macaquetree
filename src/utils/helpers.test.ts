import { describe, expect, it } from 'vitest';
import { fileExtension, formatBytes, getExtensionCategory, getExtensionColor, getRatioColorClass } from './helpers';

describe('formatBytes', () => {
  it('returns 0 B for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns 0 B for negative and non-finite numbers', () => {
    expect(formatBytes(-12)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
  });

  it('formats tebibyte-scale values', () => {
    expect(formatBytes(1024 ** 4)).toBe('1 TB');
  });
});

describe('extension catalog', () => {
  it('classifies .webm and .mp4 as Video with a color', () => {
    expect(getExtensionCategory('.webm')).toBe('Video');
    expect(getExtensionCategory('.mp4')).toBe('Video');
    expect(getExtensionColor('.webm')).toBe(getExtensionColor('.mp4'));
    expect(getExtensionColor('.webm')).toMatch(/^#/);
  });

  it('falls back to Other gray', () => {
    expect(getExtensionCategory('.zzz')).toBe('Other');
    expect(getExtensionColor('.zzz')).toBe('#9E9E9E');
  });
});

describe('getRatioColorClass', () => {
  it('maps thresholds', () => {
    expect(getRatioColorClass(0.5)).toBe('critical');
    expect(getRatioColorClass(0.15)).toBe('warning');
    expect(getRatioColorClass(0.1)).toBe('safe');
  });
});

describe('fileExtension', () => {
  it('extracts lowercase suffix', () => {
    expect(fileExtension('Movie.webm')).toBe('.webm');
    expect(fileExtension('README')).toBe('');
  });
});
