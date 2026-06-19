// Human-typeable invite codes: 6 chars, uppercase, with the ambiguous
// 0/O/1/I/L dropped so a code read aloud or off a screen can't be mistyped.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateInviteCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let code = ''
  for (let i = 0; i < length; i++) code += ALPHABET[bytes[i] % ALPHABET.length]
  return code
}
