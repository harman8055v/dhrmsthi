import { render, screen } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';

describe('Button component', () => {
  it('renders with given text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
}); 