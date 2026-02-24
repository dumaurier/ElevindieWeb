/**
 * Render the IndieAuth consent/login page.
 *
 * Self-contained HTML with inline DuoTone palette.
 * Semantic, WCAG 2.2 AAA compliant.
 */
export function renderConsentPage(params: {
  client_id: string;
  redirect_uri: string;
  state: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
  me: string;
  error?: string;
}): string {
  const scopes = params.scope ? params.scope.split(/\s+/).filter(Boolean) : [];

  const scopeCheckboxes = scopes.length > 0
    ? `<fieldset>
        <legend>Requested permissions</legend>
        ${scopes.map((s) => `<label>
          <input type="checkbox" name="scope" value="${escapeHtml(s)}" checked>
          ${escapeHtml(s)}
        </label>`).join("\n        ")}
      </fieldset>`
    : "";

  const errorBlock = params.error
    ? `<p role="alert" class="error">${escapeHtml(params.error)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
    }

    :root {
      --color-bg: #8bbae7;
      --color-fg: #240a37;
      --color-accent: #e7e68b;
      --color-border: #e78b8c;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg: #240a37;
        --color-fg: #8bbae7;
      }
    }

    body {
      font-family: 'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif;
      background-color: var(--color-bg);
      color: var(--color-fg);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    main {
      width: 100%;
      max-width: 28rem;
    }

    h1 {
      font-size: 1.75rem;
      margin-block-end: 1rem;
    }

    p {
      margin-block-end: 1rem;
    }

    .client-id {
      word-break: break-all;
      font-weight: 700;
    }

    .error {
      background-color: var(--color-border);
      color: var(--color-fg);
      padding: 0.75rem 1rem;
      border-radius: 0.25rem;
      border: 2px solid var(--color-fg);
    }

    fieldset {
      border: 2px solid var(--color-fg);
      border-radius: 0.25rem;
      padding: 1rem;
      margin-block-end: 1.5rem;
    }

    legend {
      font-weight: 700;
      padding-inline: 0.5rem;
    }

    fieldset label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-block: 0.25rem;
      cursor: pointer;
    }

    fieldset input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: var(--color-fg);
    }

    .field {
      margin-block-end: 1.5rem;
    }

    .field label {
      display: block;
      font-weight: 700;
      margin-block-end: 0.25rem;
    }

    .field input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 1rem;
      font-family: inherit;
      background-color: var(--color-bg);
      color: var(--color-fg);
      border: 2px solid var(--color-fg);
      border-radius: 0.25rem;
    }

    .field input:focus {
      outline: 3px solid var(--color-accent);
      outline-offset: 2px;
    }

    .actions {
      display: flex;
      gap: 1rem;
    }

    button {
      font-family: inherit;
      font-size: 1rem;
      font-weight: 700;
      padding: 0.75rem 1.5rem;
      min-height: 2.75rem;
      border-radius: 0.25rem;
      cursor: pointer;
      border: 2px solid var(--color-fg);
    }

    button:focus-visible {
      outline: 3px solid var(--color-accent);
      outline-offset: 2px;
    }

    button[value="approve"] {
      background-color: var(--color-fg);
      color: var(--color-bg);
      flex: 1;
    }

    button[value="deny"] {
      background-color: transparent;
      color: var(--color-fg);
    }
  </style>
</head>
<body>
  <main>
    <h1>Sign In</h1>
    <p>
      <span class="client-id">${escapeHtml(params.client_id)}</span>
      is requesting access to your site.
    </p>
    ${errorBlock}
    <form method="POST" action="/auth">
      <input type="hidden" name="client_id" value="${escapeAttr(params.client_id)}">
      <input type="hidden" name="redirect_uri" value="${escapeAttr(params.redirect_uri)}">
      <input type="hidden" name="state" value="${escapeAttr(params.state)}">
      <input type="hidden" name="code_challenge" value="${escapeAttr(params.code_challenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeAttr(params.code_challenge_method)}">
      <input type="hidden" name="me" value="${escapeAttr(params.me)}">
      ${scopeCheckboxes}
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" autofocus>
      </div>
      <div class="actions">
        <button type="submit" name="action" value="approve">Approve</button>
        <button type="submit" name="action" value="deny">Deny</button>
      </div>
    </form>
  </main>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}
