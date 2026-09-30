# Sign-in provider marks

Apple and Google require their **official** artwork on sign-in buttons, used unmodified.
The login / signup buttons load these files (and render text-only if one is missing).

| File | Source |
| --- | --- |
| `apple.svg` | The logo glyph from Apple's official Sign in with Apple JS (`appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js`), white fill for the black button, viewBox trimmed to the glyph. Apple's design kit is also at https://developer.apple.com/design/resources/ (needs a developer login). |
| `google.png` | Google's *signin-assets.zip* (https://developers.google.com/identity/branding-guidelines) → `Android + Web/PNG @4x/Light/…Show text=No, Shape=Square…png`, cropped to the "G" with the button's white fill made transparent. The zip's SVGs draw the gradient with `foreignObject`, which doesn't render reliably inside `<img>`, so the PNG is used. |
