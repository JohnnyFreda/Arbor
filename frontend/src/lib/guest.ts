/**
 * The shared demo account.
 *
 * Lives outside the modal that displays the notice so that file exports only a
 * component -- a module mixing components and helpers loses fast refresh for
 * everything in it.
 */
const GUEST_EMAIL = 'guest@example.com';

export function isGuestUser(email: string | undefined): boolean {
  return email === GUEST_EMAIL;
}
