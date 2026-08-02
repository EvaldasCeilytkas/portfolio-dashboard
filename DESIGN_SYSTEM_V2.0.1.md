# Portfolio Dashboard Pro — Design System v2.0.1

Foundation release. It introduces shared design tokens and opt-in utility classes without replacing existing page styles.

## Added
- `src/styles/design-system/tokens.css`
- `src/styles/design-system/typography.css`
- `src/styles/design-system/primitives.css`
- `src/styles/design-system/animations.css`
- `src/styles/design-system/index.css`

## Integration
`src/main.jsx` imports the design system before the existing `global.css`. Current pages therefore retain their existing appearance while future component migrations can use the new `--ds-*` variables and `.ds-*` classes.

## Semantic colors
- success: `--ds-success`
- warning: `--ds-warning`
- danger: `--ds-danger`
- information: `--ds-info`
- analytics: `--ds-analytics`

## Base primitives
- `.ds-card`, `.ds-card--data`, `.ds-card--padded`
- `.ds-button` with primary, secondary, ghost and danger variants
- `.ds-badge` with semantic variants
- `.ds-grid`, `.ds-grid--4`, `.ds-stack`
- typography roles and reduced-motion support
