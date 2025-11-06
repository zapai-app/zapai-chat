import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageContent } from './MessageContent';

describe('MessageContent with Markdown', () => {
  it('should render bold text', () => {
    const markdown = '**bold text**';
    render(<MessageContent content={markdown} />);
    
    const bold = screen.getByText('bold text');
    expect(bold.tagName).toBe('STRONG');
  });

  it('should render italic text', () => {
    const markdown = '*italic text*';
    render(<MessageContent content={markdown} />);
    
    const italic = screen.getByText('italic text');
    expect(italic.tagName).toBe('EM');
  });

  it('should render lists', () => {
    const markdown = '* Item 1\n* Item 2';
    render(<MessageContent content={markdown} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should render headings', () => {
    const markdown = '## Heading';
    render(<MessageContent content={markdown} />);
    
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H2');
  });
});
