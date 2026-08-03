import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from './CircularProgress';

function progressOffset(value: number): number {
  const { container } = render(<CircularProgress value={value} />);
  const circles = container.querySelectorAll('circle');
  const progressCircle = circles[circles.length - 1];
  return parseFloat(progressCircle.getAttribute('stroke-dashoffset') || 'NaN');
}

describe('CircularProgress', () => {
  it('renders the clamped value as text', () => {
    render(<CircularProgress value={150} />);
    expect(screen.getByText('100%')).toBeTruthy();
    expect(progressOffset(150)).toBe(0);
  });

  it('clamps values above 100 to a full ring (offset 0)', () => {
    expect(progressOffset(150)).toBe(0);
    expect(progressOffset(250)).toBe(0);
  });

  it('clamps negative values to an empty ring (offset == circumference)', () => {
    const emptyOffset = progressOffset(-10);
    expect(emptyOffset).toBeGreaterThan(0);
    // -10 clamps to 0 -> offset equals the full circumference
    expect(progressOffset(-10)).toBeCloseTo(progressOffset(0));
  });

  it('places the offset halfway for 50%', () => {
    expect(progressOffset(50)).toBeCloseTo(progressOffset(0) / 2);
  });
});
