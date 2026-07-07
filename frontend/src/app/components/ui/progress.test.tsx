import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  test('translates the indicator based on the value (0%)', () => {
    const { container } = render(<Progress value={0} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-100%)');
  });

  test('translates the indicator based on the value (40%)', () => {
    const { container } = render(<Progress value={40} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-60%)');
  });

  test('translates the indicator fully in when complete (100%)', () => {
    const { container } = render(<Progress value={100} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-0%)');
  });

  test('defaults to 0% when no value is supplied', () => {
    const { container } = render(<Progress />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-100%)');
  });
});
