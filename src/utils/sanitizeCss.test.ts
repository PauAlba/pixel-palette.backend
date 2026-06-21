import { describe, it, expect } from 'vitest';
import { sanitizeCss, isValidCss } from './sanitizeCss.js';

describe('sanitizeCss', () => {
  it('allows safe CSS unchanged', () => {
    const css = 'body { color: red; font-size: 14px; }';
    expect(sanitizeCss(css)).toBe(css);
  });

  it('strips <script> tags', () => {
    expect(sanitizeCss('body { } <script>alert(1)</script>')).not.toContain('<script>');
  });

  it('strips javascript: protocol', () => {
    expect(sanitizeCss('a { background: url("javascript:alert(1)") }')).not.toContain('javascript:');
  });

  it('strips expression()', () => {
    expect(sanitizeCss('div { width: expression(alert(1)) }')).not.toContain('expression(');
  });

  it('strips @import', () => {
    expect(sanitizeCss('@import url("evil.css"); body {}')).not.toContain('@import');
  });

  it('strips behavior:', () => {
    expect(sanitizeCss('div { behavior: url(evil.htc) }')).not.toContain('behavior:');
  });

  it('strips -moz-binding:', () => {
    expect(sanitizeCss('div { -moz-binding: url(evil.xml) }')).not.toContain('-moz-binding:');
  });

  it('strips mixed case javascript:', () => {
    expect(sanitizeCss('a { color: Javascript:void(0) }')).not.toContain('javascript:');
  });

  it('strips expression with spaces', () => {
    expect(sanitizeCss('div { width: expression  (1+1) }')).not.toContain('expression');
  });
});

describe('isValidCss', () => {
  it('returns true for safe CSS', () => {
    expect(isValidCss('.pixel { border: 1px solid #000; }')).toBe(true);
  });

  it('returns false when javascript: present', () => {
    expect(isValidCss('a { href: javascript:void(0) }')).toBe(false);
  });

  it('returns false when expression() present', () => {
    expect(isValidCss('p { width: expression(1) }')).toBe(false);
  });

  it('returns false when <script> present', () => {
    expect(isValidCss('<script>alert()</script>')).toBe(false);
  });
});
