export function paginationFromQuery(
  query: Record<string, unknown>,
  fallbackRowsPerPage: number
): { page: number; rowsPerPage: number } {
  const rawSize = query['size']
  const rawFrom = query['from']

  let rowsPerPage = fallbackRowsPerPage > 0 ? fallbackRowsPerPage : 10
  if (typeof rawSize === 'number' && rawSize > 0) {
    rowsPerPage = rawSize
  }

  const from = typeof rawFrom === 'number' && rawFrom >= 0 ? rawFrom : 0
  return {
    page: Math.floor(from / rowsPerPage) + 1,
    rowsPerPage
  }
}
