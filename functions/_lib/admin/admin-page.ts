/**
 * Render the admin publishing page.
 *
 * Self-contained HTML with inline CSS and JS.
 * Client-side PKCE auth flow against own IndieAuth endpoints.
 * Publishes via own Micropub endpoint.
 * Semantic, WCAG 2.2 AAA compliant.
 */
export function renderAdminPage(params: { siteUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin</title>
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
      font-family: system-ui, -apple-system, sans-serif;
      background-color: var(--color-bg);
      color: var(--color-fg);
      line-height: 1.6;
      min-height: 100vh;
      padding: 1.5rem;
    }

    main {
      width: 100%;
      max-width: 42rem;
      margin-inline: auto;
    }

    h1 {
      font-size: 1.75rem;
    }

    a {
      color: var(--color-fg);
    }

    :focus-visible {
      outline: 3px solid var(--color-accent);
      outline-offset: 2px;
    }

    :focus:not(:focus-visible) {
      outline: none;
    }

    /* Login state */
    #login {
      min-height: calc(100vh - 3rem);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    #login p {
      margin-block: 0.5rem 1.5rem;
    }

    /* Loading state */
    #loading {
      min-height: calc(100vh - 3rem);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Editor header */
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-block-end: 1.5rem;
    }

    /* Type selector */
    .type-selector {
      border: none;
      padding: 0;
      margin-block-end: 1.5rem;
    }

    .type-selector legend {
      font-weight: 700;
      margin-block-end: 0.5rem;
      padding: 0;
    }

    .type-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }

    .type-options label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
    }

    .type-options input[type="radio"] {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: var(--color-fg);
    }

    /* Form fields */
    .field {
      margin-block-end: 1.5rem;
    }

    .field label {
      display: block;
      font-weight: 700;
      margin-block-end: 0.25rem;
    }

    .field input,
    .field textarea {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 1rem;
      font-family: inherit;
      background-color: var(--color-bg);
      color: var(--color-fg);
      border: 2px solid var(--color-fg);
      border-radius: 0.25rem;
    }

    .field textarea {
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      resize: vertical;
      line-height: 1.5;
    }

    /* Markdown toolbar */
    .toolbar {
      display: flex;
      gap: 0.25rem;
      margin-block-end: 0.25rem;
    }

    .toolbar button {
      padding: 0.25rem 0.625rem;
      min-height: 2.25rem;
      font-size: 0.875rem;
      font-weight: 700;
      font-family: inherit;
      background-color: transparent;
      color: var(--color-fg);
      border: 1px solid var(--color-fg);
      border-radius: 0.25rem;
      cursor: pointer;
    }

    .toolbar button:hover {
      background-color: var(--color-fg);
      color: var(--color-bg);
    }

    /* Syndication fieldset */
    #syndication {
      border: 2px solid var(--color-fg);
      border-radius: 0.25rem;
      padding: 1rem;
      margin-block-end: 1.5rem;
    }

    #syndication legend {
      font-weight: 700;
      padding-inline: 0.5rem;
    }

    #syndication label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-block: 0.25rem;
      cursor: pointer;
    }

    #syndication input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: var(--color-fg);
    }

    /* Buttons */
    button[type="submit"],
    .action-btn {
      font-family: inherit;
      font-size: 1rem;
      font-weight: 700;
      padding: 0.75rem 1.5rem;
      min-height: 2.75rem;
      border: 2px solid var(--color-fg);
      border-radius: 0.25rem;
      cursor: pointer;
      background-color: var(--color-fg);
      color: var(--color-bg);
    }

    button[type="submit"]:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .link-btn {
      background: none;
      border: none;
      color: var(--color-fg);
      text-decoration: underline;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.875rem;
      padding: 0.25rem;
    }

    /* Status messages */
    .status {
      padding: 1rem;
      border: 2px solid var(--color-fg);
      border-radius: 0.25rem;
      margin-block-end: 1.5rem;
    }

    .status.success {
      background-color: var(--color-accent);
      color: #240a37;
    }

    .status.error {
      background-color: var(--color-border);
      color: #240a37;
    }

    .status p {
      margin-block-end: 0.5rem;
    }

    .status p:last-of-type {
      margin-block-end: 1rem;
    }

    .status a {
      color: #240a37;
    }
  </style>
</head>
<body>
  <main>
    <section id="login" hidden>
      <h1>Admin</h1>
      <p>Sign in to publish to your site.</p>
      <div id="login-error" role="alert" hidden></div>
      <button type="button" class="action-btn" id="sign-in-btn">Sign In</button>
    </section>

    <section id="loading" hidden>
      <p>Signing in&hellip;</p>
    </section>

    <section id="editor" hidden>
      <header class="editor-header">
        <h1>New Entry</h1>
        <button type="button" class="link-btn" id="sign-out-btn">Sign out</button>
      </header>

      <form id="entry-form" novalidate>
        <fieldset class="type-selector">
          <legend>Type</legend>
          <div class="type-options">
            <label><input type="radio" name="type" value="note" checked> Note</label>
            <label><input type="radio" name="type" value="post"> Post</label>
            <label><input type="radio" name="type" value="bookmark"> Bookmark</label>
            <label><input type="radio" name="type" value="reply"> Reply</label>
          </div>
        </fieldset>

        <div class="field" id="title-field" hidden>
          <label for="title">Title</label>
          <input type="text" id="title" name="title">
        </div>

        <div class="field" id="bookmark-url-field" hidden>
          <label for="bookmark-url">Bookmark URL</label>
          <input type="url" id="bookmark-url" name="bookmark-url" placeholder="https://...">
        </div>

        <div class="field" id="reply-to-field" hidden>
          <label for="reply-to">Reply to URL</label>
          <input type="url" id="reply-to" name="reply-to" placeholder="https://...">
        </div>

        <div class="field" id="content-field">
          <label for="content">Content</label>
          <div class="toolbar" role="toolbar" aria-label="Markdown formatting">
            <button type="button" data-action="bold" title="Bold (Ctrl+B)" aria-label="Bold"><strong>B</strong></button>
            <button type="button" data-action="italic" title="Italic (Ctrl+I)" aria-label="Italic"><em>I</em></button>
            <button type="button" data-action="link" title="Link (Ctrl+K)" aria-label="Insert link">Link</button>
            <button type="button" data-action="heading" title="Heading" aria-label="Insert heading">H2</button>
          </div>
          <textarea id="content" name="content" rows="12"></textarea>
        </div>

        <div class="field">
          <label for="tags">Tags</label>
          <input type="text" id="tags" name="tags" placeholder="comma, separated">
        </div>

        <fieldset id="syndication" hidden>
          <legend>Syndicate to</legend>
        </fieldset>

        <div id="status" role="status" aria-live="polite" hidden></div>

        <button type="submit" id="publish-btn">Publish Note</button>
      </form>
    </section>
  </main>

  <script>
    (function () {
      var SITE_URL = "${escapeJs(params.siteUrl)}";

      // --- PKCE helpers ---

      function base64url(bytes) {
        return btoa(String.fromCharCode.apply(null, bytes))
          .replace(/\\+/g, "-")
          .replace(/\\//g, "_")
          .replace(/=+$/, "");
      }

      function generateVerifier() {
        var bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return base64url(bytes);
      }

      function generateChallenge(verifier) {
        return crypto.subtle
          .digest("SHA-256", new TextEncoder().encode(verifier))
          .then(function (digest) {
            return base64url(new Uint8Array(digest));
          });
      }

      // --- State management ---

      function showSection(id) {
        ["login", "loading", "editor"].forEach(function (s) {
          document.getElementById(s).hidden = s !== id;
        });
      }

      function showLogin(error) {
        showSection("login");
        var errEl = document.getElementById("login-error");
        if (error) {
          errEl.hidden = false;
          errEl.className = "status error";
          errEl.textContent = error;
        } else {
          errEl.hidden = true;
        }
      }

      function showEditor() {
        showSection("editor");
        loadSyndicationTargets();
      }

      // --- Auth flow ---

      function startLogin() {
        var verifier = generateVerifier();
        generateChallenge(verifier).then(function (challenge) {
          var state = base64url(crypto.getRandomValues(new Uint8Array(16)));
          sessionStorage.setItem("pkce_verifier", verifier);
          sessionStorage.setItem("pkce_state", state);

          var params = new URLSearchParams({
            response_type: "code",
            client_id: location.origin + "/admin",
            redirect_uri: location.origin + "/admin",
            state: state,
            code_challenge: challenge,
            code_challenge_method: "S256",
            scope: "create",
            me: SITE_URL,
          });

          location.href = "/auth?" + params.toString();
        });
      }

      function exchangeCode(code, state) {
        var savedState = sessionStorage.getItem("pkce_state");
        var verifier = sessionStorage.getItem("pkce_verifier");

        if (!savedState || state !== savedState) {
          history.replaceState(null, "", "/admin");
          showLogin("State mismatch \\u2014 please sign in again.");
          return;
        }

        fetch("/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            client_id: location.origin + "/admin",
            redirect_uri: location.origin + "/admin",
            code_verifier: verifier,
          }),
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Token exchange failed");
            return res.json();
          })
          .then(function (data) {
            localStorage.setItem("admin_token", data.access_token);
            sessionStorage.removeItem("pkce_verifier");
            sessionStorage.removeItem("pkce_state");
            history.replaceState(null, "", "/admin");
            showEditor();
          })
          .catch(function () {
            history.replaceState(null, "", "/admin");
            showLogin("Sign in failed. Please try again.");
          });
      }

      function signOut() {
        var token = localStorage.getItem("admin_token");
        localStorage.removeItem("admin_token");

        if (token) {
          fetch("/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ action: "revoke", token: token }),
          }).catch(function () {});
        }

        showLogin();
      }

      // --- Syndication targets ---

      function loadSyndicationTargets() {
        var token = localStorage.getItem("admin_token");
        fetch("/micropub?q=config", {
          headers: { Authorization: "Bearer " + token },
        })
          .then(function (res) {
            if (res.status === 401) {
              localStorage.removeItem("admin_token");
              showLogin("Session expired. Please sign in again.");
              throw new Error("unauthorized");
            }
            if (!res.ok) throw new Error("config fetch failed");
            return res.json();
          })
          .then(function (data) {
            var targets = data["syndicate-to"] || [];
            if (targets.length === 0) return;

            var fieldset = document.getElementById("syndication");
            fieldset.hidden = false;

            targets.forEach(function (target) {
              var label = document.createElement("label");
              var checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.name = "mp-syndicate-to";
              checkbox.value = target.uid;
              label.appendChild(checkbox);
              label.appendChild(document.createTextNode(" " + target.name));
              fieldset.appendChild(label);
            });
          })
          .catch(function () {});
      }

      // --- Post type switching ---

      function updateFields() {
        var type = document.querySelector('input[name="type"]:checked').value;

        var titleField = document.getElementById("title-field");
        var bookmarkField = document.getElementById("bookmark-url-field");
        var replyField = document.getElementById("reply-to-field");
        var titleInput = document.getElementById("title");
        var bookmarkInput = document.getElementById("bookmark-url");
        var replyInput = document.getElementById("reply-to");
        var publishBtn = document.getElementById("publish-btn");

        titleField.hidden = true;
        bookmarkField.hidden = true;
        replyField.hidden = true;

        switch (type) {
          case "note":
            publishBtn.textContent = "Publish Note";
            break;
          case "post":
            titleField.hidden = false;
            publishBtn.textContent = "Publish Post";
            break;
          case "bookmark":
            titleField.hidden = false;
            bookmarkField.hidden = false;
            publishBtn.textContent = "Publish Bookmark";
            break;
          case "reply":
            replyField.hidden = false;
            publishBtn.textContent = "Publish Reply";
            break;
        }
      }

      // --- Markdown toolbar ---

      function insertMarkdown(action) {
        var textarea = document.getElementById("content");
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selected = textarea.value.substring(start, end);
        var replacement;

        switch (action) {
          case "bold":
            replacement = "**" + (selected || "bold text") + "**";
            break;
          case "italic":
            replacement = "*" + (selected || "italic text") + "*";
            break;
          case "link":
            if (selected && /^https?:\\/\\//.test(selected)) {
              replacement = "[link text](" + selected + ")";
            } else {
              replacement = "[" + (selected || "link text") + "](url)";
            }
            break;
          case "heading":
            replacement = "## " + (selected || "Heading");
            break;
        }

        textarea.setRangeText(replacement, start, end, "select");
        textarea.focus();
      }

      // --- Form validation ---

      function validateForm(type) {
        var content = document.getElementById("content").value.trim();
        var title = document.getElementById("title").value.trim();
        var bookmarkUrl = document.getElementById("bookmark-url").value.trim();
        var replyTo = document.getElementById("reply-to").value.trim();

        switch (type) {
          case "note":
            if (!content) return "Content is required for notes.";
            break;
          case "post":
            if (!title) return "Title is required for posts.";
            if (!content) return "Content is required for posts.";
            break;
          case "bookmark":
            if (!bookmarkUrl) return "Bookmark URL is required.";
            break;
          case "reply":
            if (!replyTo) return "Reply-to URL is required.";
            if (!content) return "Content is required for replies.";
            break;
        }

        return null;
      }

      // --- Publish ---

      function publishEntry(e) {
        e.preventDefault();

        var type = document.querySelector('input[name="type"]:checked').value;
        var error = validateForm(type);
        if (error) {
          showStatus(error, "error");
          return;
        }

        var publishBtn = document.getElementById("publish-btn");
        publishBtn.disabled = true;
        publishBtn.textContent = "Publishing\\u2026";

        var properties = {};
        var content = document.getElementById("content").value.trim();
        if (content) properties.content = [content];

        var title = document.getElementById("title").value.trim();
        if (title && (type === "post" || type === "bookmark")) {
          properties.name = [title];
        }

        var bookmarkUrl = document.getElementById("bookmark-url").value.trim();
        if (bookmarkUrl && type === "bookmark") {
          properties["bookmark-of"] = [bookmarkUrl];
        }

        var replyTo = document.getElementById("reply-to").value.trim();
        if (replyTo && type === "reply") {
          properties["in-reply-to"] = [replyTo];
        }

        var tags = document.getElementById("tags").value.trim();
        if (tags) {
          properties.category = tags
            .split(",")
            .map(function (t) { return t.trim(); })
            .filter(Boolean);
        }

        var syndicateTo = [];
        document
          .querySelectorAll('#syndication input[type="checkbox"]:checked')
          .forEach(function (cb) {
            syndicateTo.push(cb.value);
          });
        if (syndicateTo.length) {
          properties["mp-syndicate-to"] = syndicateTo;
        }

        var token = localStorage.getItem("admin_token");
        fetch("/micropub", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ type: ["h-entry"], properties: properties }),
        })
          .then(function (res) {
            if (res.status === 401) {
              localStorage.removeItem("admin_token");
              showLogin("Session expired. Please sign in again.");
              throw new Error("unauthorized");
            }
            if (res.status === 201) {
              showSuccess(res.headers.get("Location"));
            } else {
              return res.json().then(function (data) {
                showStatus(data.error_description || "Publish failed.", "error");
                publishBtn.disabled = false;
                updateFields();
              });
            }
          })
          .catch(function (err) {
            if (err.message !== "unauthorized") {
              showStatus("Network error. Please try again.", "error");
              publishBtn.disabled = false;
              updateFields();
            }
          });
      }

      // --- Status display ---

      function showStatus(message, type) {
        var status = document.getElementById("status");
        status.hidden = false;
        status.className = "status " + type;
        status.textContent = message;
      }

      function showSuccess(url) {
        var form = document.getElementById("entry-form");
        var status = document.getElementById("status");

        form.hidden = true;
        status.hidden = false;
        status.className = "status success";
        status.textContent = "";

        var msg = document.createElement("p");
        msg.innerHTML = "<strong>Published!</strong>";
        status.appendChild(msg);

        if (url) {
          var linkP = document.createElement("p");
          var link = document.createElement("a");
          link.href = url;
          link.textContent = url;
          linkP.appendChild(link);
          status.appendChild(linkP);
        }

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "action-btn";
        btn.textContent = "New Entry";
        btn.addEventListener("click", resetEditor);
        status.appendChild(btn);
      }

      function resetEditor() {
        var form = document.getElementById("entry-form");
        var status = document.getElementById("status");

        form.hidden = false;
        form.reset();
        status.hidden = true;
        status.textContent = "";

        updateFields();

        var publishBtn = document.getElementById("publish-btn");
        publishBtn.disabled = false;
      }

      // --- Keyboard shortcuts ---

      function handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
          switch (e.key) {
            case "b":
              e.preventDefault();
              insertMarkdown("bold");
              break;
            case "i":
              e.preventDefault();
              insertMarkdown("italic");
              break;
            case "k":
              e.preventDefault();
              insertMarkdown("link");
              break;
          }
        }
      }

      // --- Init ---

      function init() {
        var params = new URLSearchParams(location.search);

        if (params.has("error")) {
          var desc =
            params.get("error_description") || "Access was denied.";
          history.replaceState(null, "", "/admin");
          showLogin(desc);
          return;
        }

        if (params.has("code")) {
          showSection("loading");
          exchangeCode(params.get("code"), params.get("state"));
          return;
        }

        if (localStorage.getItem("admin_token")) {
          showEditor();
          return;
        }

        showLogin();
      }

      // --- Event listeners ---

      document
        .getElementById("sign-in-btn")
        .addEventListener("click", startLogin);
      document
        .getElementById("sign-out-btn")
        .addEventListener("click", signOut);
      document
        .getElementById("entry-form")
        .addEventListener("submit", publishEntry);
      document.querySelectorAll('input[name="type"]').forEach(function (radio) {
        radio.addEventListener("change", updateFields);
      });
      document.querySelectorAll(".toolbar button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          insertMarkdown(btn.dataset.action);
        });
      });
      document
        .getElementById("content")
        .addEventListener("keydown", handleKeyboard);

      init();
    })();
  </script>
</body>
</html>`;
}

function escapeJs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/</g, "\\x3c")
    .replace(/>/g, "\\x3e");
}
