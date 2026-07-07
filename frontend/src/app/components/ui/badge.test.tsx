import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  test('renders its children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('applies the default variant class', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-primary');
  });

  test('applies the destructive variant class', () => {
    render(<Badge variant="destructive">Overdue</Badge>);
    expect(screen.getByText('Overdue').className).toContain('bg-destructive');
  });

  test('applies the outline variant class', () => {
    render(<Badge variant="outline">Draft</Badge>);
    expect(screen.getByText('Draft').className).not.toContain('bg-primary');
  });

  test('merges a custom className with the variant classes', () => {
    render(<Badge className="my-custom-class">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('my-custom-class');
  });
});
