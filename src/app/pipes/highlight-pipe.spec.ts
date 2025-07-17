import { describe, expect, it } from 'vitest';
import { HighlightPipe } from './highlight-pipe';

describe('HighlightPipe', () => {
  const pipe = new HighlightPipe();

  it('should return the original text if search is empty', () => {
    expect(pipe.transform('Angular signals', '')).toBe('Angular signals');
  });

  it('should highlight a single match (case-insensitive)', () => {
    expect(pipe.transform('Angular signals', 'signals')).toBe(
      'Angular <mark style="background: #ffe066;">signals</mark>'
    );
    expect(pipe.transform('Angular Signals', 'signals')).toBe(
      'Angular <mark style="background: #ffe066;">Signals</mark>'
    );
  });

  it('should highlight all matches', () => {
    expect(pipe.transform('test test test', 'test')).toBe(
      '<mark style="background: #ffe066;">test</mark> <mark style="background: #ffe066;">test</mark> <mark style="background: #ffe066;">test</mark>'
    );
  });

  it('should escape special regex characters in search', () => {
    expect(pipe.transform('a+b=c', 'a+b')).toBe(
      '<mark style="background: #ffe066;">a+b</mark>=c'
    );
  });

  it('should work with partial matches', () => {
    expect(pipe.transform('Angular is awesome', 'ang')).toBe(
      '<mark style="background: #ffe066;">Ang</mark>ular is awesome'
    );
  });

  it('should not highlight if there is no match', () => {
    expect(pipe.transform('Angular', 'react')).toBe('Angular');
  });
});
