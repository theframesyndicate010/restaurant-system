# Frontend Structure

This project is organized by feature first, then by asset type.

## Top-Level Layout

- `dashboard/`, `billing/`, `customer/`, `product/`, `purchase/`, `supplier/`, `menu/`, `stock/`, `expense/`, `discount/`, `role/`, `user/`, `table/`
  - Feature pages and assets.
- `shared/`
  - Reusable cross-feature assets.
- `favicon.png`

## Feature Folder Convention

Each feature folder should follow this shape:

- `*.html` pages for that feature
- `styles/` for feature-only CSS
- `scripts/` for feature-only JavaScript

Example:

- `product/product-items.html`
- `product/styles/product-items.css`
- `product/scripts/product-status.js`

## Shared Folder Convention

- `shared/components/`
  - Reusable HTML templates and component scripts.
  - Includes: `component.js`, `sidebar.html`, `header.html`, `datatable.html`, `data_table.js`.
- `shared/styles/layout/`
  - Global layout styles (sidebar/header).
- `shared/styles/base/`
  - Common base styles used across features (`style.css`, `floaty.css`).
- `shared/scripts/`
  - Global scripts used by multiple pages (`script.js`).

## Rules For New Files

1. Put page-specific styles/scripts inside that page's feature folder.
2. Put reusable UI templates and shared behavior in `shared/components/`.
3. Put app-wide styling in `shared/styles/layout/` or `shared/styles/base/`.
4. Keep relative links from pages to shared assets using `../shared/...`.

## Notes

- Component templates are loaded through `shared/components/component.js`.
- Sidebar and header links are centralized in:
  - `shared/components/sidebar.html`
  - `shared/components/header.html`

## Validation

- Run the static HTML reference checker before release:
  - `./tools/check-links.sh`
- The script validates local `href`/`src` targets and fails on missing files.
