/**
 * Color Gallery — the example-image grids in the Color page's "Color proportions
 * and usage" section.
 *
 * On the live brand hub each of these is a grid of example images (the "Primary
 * color usage" grid alone has 8). The import only captured the first image of
 * each grid, so an auto-block (scripts.js buildColorGalleries) rebuilds the full
 * set of `<picture>` elements and hands them to this block, which just lays them
 * out in a responsive grid whose column count matches the live design.
 *
 * Structure: one row per image, each a single cell holding a <picture>. The
 * desired desktop column count is read from the block's data-cols attribute
 * (set by the auto-block), capped at 4.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];
  if (!pictures.length) return;

  const cols = Math.min(parseInt(block.dataset.cols, 10) || pictures.length, 4);

  const grid = document.createElement('div');
  grid.className = 'color-gallery-grid';
  grid.style.setProperty('--gallery-cols', cols);

  pictures.forEach((pic) => {
    const item = document.createElement('div');
    item.className = 'color-gallery-item';
    item.append(pic);
    grid.append(item);
  });

  block.replaceChildren(grid);
}
