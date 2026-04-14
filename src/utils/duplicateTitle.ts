/**
 * Generates a duplicate title by appending " (Copy)" to the original title.
 * Used by ScriptRepository.duplicateScript and tested via Property 16.
 */
export function duplicateTitle(title: string): string {
  return title + ' (Copy)';
}
