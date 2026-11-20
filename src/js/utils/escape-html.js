/**
 * Экранирует HTML для предотвращения XSS
 * @param {string} text - Текст для экранирования
 * @returns {string} Экранированный текст
 */
export function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
