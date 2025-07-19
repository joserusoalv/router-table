import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  const button = new Button();

  it('should create', () => {
    expect(button).toBeTruthy();
  });

  it('should initialize value to 0', () => {
    expect(button.value()).toBe(0);
  });

  it('should increment value by 1 when plusOne is called', () => {
    button.plusOne();
    expect(button.value()).toBe(1);
  });
});
