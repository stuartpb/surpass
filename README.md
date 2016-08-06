# surpass

Surpass is an input component for sensitive data, like passwords, that incorporates several innovations in usability:

- Enables toggling of input between unmasked (showing input verbatim), masked (hiding individual characters, ie. traditional password entry), and hidden (all feedback is completely swallowed)
- Masked input includes an abstract signifier of the masked content, for validation purposes (see the section on "Gross Simplification" below)
- Validating input by re-typing it is both optional and always available

## Allows Increased / Decreased Obfuscation

Traditional password obfuscation is [frequently][nielsen]

Adding absolute-privacy allows users paranoid about the disclosure of Gross Simplification Ideally, this would also enable functionality in user agents to completely hide feedback *outside* of the password input

[nielsen]: https://www.nngroup.com/articles/stop-password-masking/

Additionally, this configrable sensitivity should be available for *any* kind of input, not just passwords. Some users may be uncomfortable entering their Social Security Number, PIN, or real name in public,

## Gross Simplification

**Details not final.** This aspect of surpass is still experimental, and is subject to heavy changes as I gather more data about its operation going forward.

Communicates the input state, a la Lotus's Hieroglyphics or Chroma-Hash, without exposing significant details of the password.

- Doesn't show until the user has gone at least 1/3 second without typing
- Doesn't show for passwords shorter than 6 characters

### Calculation

This technique maps the entered string to one of 144 different possible combinations of shape, color, and position, by taking the FNV-1a 32-bit hash of the string's UTF-8 representation, then mapping the first multiple of 6 to shapes, the next multiple of 6 to colors, and the remaining multiple of 4 to which position the first shape will be in: the top, right, left, or bottom. (This leaves an unavoidable < 1/10000 bias toward some shapes and colors, but keeps the four positions evenly represented.)

The FNV-1a hash function was selected as the simplest available technique to derive a value from a string (compared to a relatively heavy function like MD5), while still maintaining the properties necessary for this use case ([even distribution / diffusion][1] and non-reversibility).

[1]: http://programmers.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed

## Double-entry

Re-entering something the user can read isn't as sensible, but you may want to recommend they take that extra step: however, there may be other fields where this kind of validation [may make more sense for the user][xkcd 970].

[xkcd 970]: https://xkcd.com/970/
