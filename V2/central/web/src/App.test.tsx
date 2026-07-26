import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the temporary web initialization message', () => {
    expect(renderToStaticMarkup(<App />)).toContain('AutoHome Central web initialized');
  });
});
