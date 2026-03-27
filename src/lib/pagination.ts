/**
 * Generate visible page numbers with ellipsis for pagination.
 * Always shows first and last page. Max `maxVisible` number slots (excluding ellipsis).
 *
 * Examples (maxVisible=5):
 *   total=5,  current=3 → [1, 2, 3, 4, 5]
 *   total=10, current=1 → [1, 2, 3, "...", 10]
 *   total=10, current=5 → [1, "...", 4, 5, 6, "...", 10]
 *   total=10, current=10 → [1, "...", 8, 9, 10]
 */
export function getVisiblePages(
  current: number,
  total: number,
  maxVisible = 5,
): (number | "...")[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const half = Math.floor((maxVisible - 2) / 2); // slots between first and last

  let start = current - half;
  let end = current + half;

  // Adjust when near the beginning
  if (start <= 2) {
    start = 2;
    end = maxVisible - 1;
  }

  // Adjust when near the end
  if (end >= total - 1) {
    end = total - 1;
    start = total - (maxVisible - 2);
  }

  // Ensure bounds
  start = Math.max(2, start);
  end = Math.min(total - 1, end);

  // Always show first page
  pages.push(1);

  // Ellipsis after first page
  if (start > 2) {
    pages.push("...");
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Ellipsis before last page
  if (end < total - 1) {
    pages.push("...");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
