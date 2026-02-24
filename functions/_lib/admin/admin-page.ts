/**
 * Render the admin publishing page.
 *
 * Links to the site stylesheet for layout, typography, colors, and buttons.
 * Inline styles only for admin-specific components (toolbar, form fields, status).
 * Client-side PKCE auth flow against own IndieAuth endpoints.
 * Publishes via own Micropub endpoint.
 */
export function renderAdminPage(params: { siteUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="/assets/css/style.css">
  <style>
    /* Admin-specific: centered page state */
    .admin-center {
      min-height: 80vh;
      display: grid;
      place-items: center;
      text-align: center;
    }

    /* Admin-specific: type selector */
    .type-selector {
      border: none;
      padding: 0;
    }

    .type-selector legend {
      font-weight: 700;
      padding: 0;
    }

    /* Admin-specific: form fields */
    .admin-field label {
      display: block;
      font-weight: 700;
      margin-block-end: var(--space-3xs);
    }

    .admin-field input,
    .admin-field textarea {
      width: 100%;
      padding: var(--space-2xs) var(--space-xs);
      background-color: var(--color-bg);
      color: var(--color-fg);
      border: 2px solid var(--color-fg);
      border-radius: 3px;
    }

    .admin-field textarea {
      font-family: var(--font-mono);
      resize: vertical;
    }

    /* Admin-specific: markdown toolbar */
    .toolbar {
      display: flex;
      gap: var(--space-3xs);
      margin-block-end: var(--space-3xs);
    }

    .toolbar button {
      padding: var(--space-3xs) var(--space-2xs);
      font-size: var(--size-step--1);
      background-color: transparent;
      color: var(--color-fg);
      border: 1px solid var(--color-fg);
    }

    .toolbar button:hover {
      background-color: var(--color-fg);
      color: var(--color-bg);
    }

    /* Admin-specific: syndication fieldset */
    .syndication-targets {
      border: 2px solid var(--color-fg);
      border-radius: 3px;
      padding: var(--space-s);
    }

    .syndication-targets legend {
      font-weight: 700;
      padding-inline: var(--space-2xs);
    }

    .syndication-targets label {
      display: flex;
      align-items: center;
      gap: var(--space-2xs);
      padding-block: var(--space-3xs);
      cursor: pointer;
    }

    .syndication-targets input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: var(--color-fg);
    }

    /* Admin-specific: status messages */
    .admin-status {
      padding: var(--space-s);
      border: 2px solid var(--color-fg);
      border-radius: 3px;
    }

    .admin-status.success {
      background-color: var(--color-accent);
      color: #240a37;
    }

    .admin-status.success a { color: #240a37; }

    .admin-status.error {
      background-color: var(--color-border);
      color: #240a37;
    }

    /* Admin-specific: sign-out link */
    .sign-out {
      background: none;
      border: none;
      color: var(--color-fg);
      text-decoration: underline;
      cursor: pointer;
      font-size: var(--size-step--1);
    }
  </style>
</head>
<body class="admin">
  <main>
    <section data-section="login" hidden>
      <div class="admin-center">
        <div class="flow">
          <h1>Admin</h1>
          <p>Sign in to publish to your site.</p>
          <div data-role="login-error" role="alert" hidden></div>
          <button type="button" data-action="sign-in">Sign In</button>
        </div>
      </div>
    </section>

    <section data-section="loading" hidden>
      <div class="admin-center">
        <p>Signing in&hellip;</p>
      </div>
    </section>

    <section data-section="editor" hidden>
      <div class="repel">
        <h1>New Entry</h1>
        <button type="button" class="sign-out" data-action="sign-out">Sign out</button>
      </div>

      <form data-role="entry-form" class="flow" novalidate>
        <fieldset class="type-selector cluster">
          <legend>Type</legend>
          <label><input type="radio" name="type" value="note" checked> Note</label>
          <label><input type="radio" name="type" value="post"> Post</label>
          <label><input type="radio" name="type" value="bookmark"> Bookmark</label>
          <label><input type="radio" name="type" value="reply"> Reply</label>
        </fieldset>

        <div class="admin-field" data-field="title" hidden>
          <label for="title">Title</label>
          <input type="text" id="title">
        </div>

        <div class="admin-field" data-field="bookmark-url" hidden>
          <label for="bookmark-url">Bookmark URL</label>
          <input type="url" id="bookmark-url" placeholder="https://...">
        </div>

        <div class="admin-field" data-field="reply-to" hidden>
          <label for="reply-to">Reply to URL</label>
          <input type="url" id="reply-to" placeholder="https://...">
        </div>

        <div class="admin-field">
          <label for="content">Content</label>
          <div class="toolbar" role="toolbar" aria-label="Markdown formatting">
            <button type="button" data-md="bold" title="Bold (Ctrl+B)" aria-label="Bold"><strong>B</strong></button>
            <button type="button" data-md="italic" title="Italic (Ctrl+I)" aria-label="Italic"><em>I</em></button>
            <button type="button" data-md="link" title="Link (Ctrl+K)" aria-label="Insert link">Link</button>
            <button type="button" data-md="heading" title="Heading" aria-label="Insert heading">H2</button>
          </div>
          <textarea id="content" rows="12"></textarea>
        </div>

        <div class="admin-field">
          <label for="tags">Tags</label>
          <input type="text" id="tags" placeholder="comma, separated">
        </div>

        <fieldset class="syndication-targets" data-role="syndication" hidden>
          <legend>Syndicate to</legend>
        </fieldset>

        <div data-role="status" role="status" aria-live="polite" hidden></div>

        <button type="submit" data-role="publish">Publish Note</button>
      </form>
    </section>
  </main>

  <script>
    (function () {
      var SITE_URL = "${escapeJs(params.siteUrl)}";

      var $ = function (sel) { return document.querySelector(sel); };
      var $$ = function (sel) { return document.querySelectorAll(sel); };

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

      function showSection(name) {
        $$("[data-section]").forEach(function (el) {
          el.hidden = el.dataset.section !== name;
        });
      }

      function showLogin(error) {
        showSection("login");
        var errEl = $("[data-role=login-error]");
        if (error) {
          errEl.hidden = false;
          errEl.className = "admin-status error";
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

            var fieldset = $("[data-role=syndication]");
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
        var type = $('input[name="type"]:checked').value;
        var publish = $("[data-role=publish]");

        $$("[data-field]").forEach(function (el) { el.hidden = true; });

        switch (type) {
          case "note":
            publish.textContent = "Publish Note";
            break;
          case "post":
            $("[data-field=title]").hidden = false;
            publish.textContent = "Publish Post";
            break;
          case "bookmark":
            $("[data-field=title]").hidden = false;
            $("[data-field=bookmark-url]").hidden = false;
            publish.textContent = "Publish Bookmark";
            break;
          case "reply":
            $("[data-field=reply-to]").hidden = false;
            publish.textContent = "Publish Reply";
            break;
        }
      }

      // --- Markdown toolbar ---

      function insertMarkdown(action) {
        var textarea = $("#content");
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
        var content = $("#content").value.trim();
        var title = $("#title").value.trim();
        var bookmarkUrl = $("#bookmark-url").value.trim();
        var replyTo = $("#reply-to").value.trim();

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

        var type = $('input[name="type"]:checked').value;
        var error = validateForm(type);
        if (error) {
          showStatus(error, "error");
          return;
        }

        var publish = $("[data-role=publish]");
        publish.disabled = true;
        publish.textContent = "Publishing\\u2026";

        var properties = {};
        var content = $("#content").value.trim();
        if (content) properties.content = [content];

        var title = $("#title").value.trim();
        if (title && (type === "post" || type === "bookmark")) {
          properties.name = [title];
        }

        var bookmarkUrl = $("#bookmark-url").value.trim();
        if (bookmarkUrl && type === "bookmark") {
          properties["bookmark-of"] = [bookmarkUrl];
        }

        var replyTo = $("#reply-to").value.trim();
        if (replyTo && type === "reply") {
          properties["in-reply-to"] = [replyTo];
        }

        var tags = $("#tags").value.trim();
        if (tags) {
          properties.category = tags
            .split(",")
            .map(function (t) { return t.trim(); })
            .filter(Boolean);
        }

        var syndicateTo = [];
        $$('.syndication-targets input[type="checkbox"]:checked')
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
                publish.disabled = false;
                updateFields();
              });
            }
          })
          .catch(function (err) {
            if (err.message !== "unauthorized") {
              showStatus("Network error. Please try again.", "error");
              publish.disabled = false;
              updateFields();
            }
          });
      }

      // --- Status display ---

      function showStatus(message, type) {
        var status = $("[data-role=status]");
        status.hidden = false;
        status.className = "admin-status " + type;
        status.textContent = message;
      }

      function showSuccess(url) {
        var form = $("[data-role=entry-form]");
        var status = $("[data-role=status]");

        form.hidden = true;
        status.hidden = false;
        status.className = "admin-status success flow";
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
        btn.textContent = "New Entry";
        btn.addEventListener("click", resetEditor);
        status.appendChild(btn);
      }

      function resetEditor() {
        var form = $("[data-role=entry-form]");
        var status = $("[data-role=status]");

        form.hidden = false;
        form.reset();
        status.hidden = true;
        status.textContent = "";

        updateFields();
        $("[data-role=publish]").disabled = false;
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
          history.replaceState(null, "", "/admin");
          showLogin(params.get("error_description") || "Access was denied.");
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

      $("[data-action=sign-in]").addEventListener("click", startLogin);
      $("[data-action=sign-out]").addEventListener("click", signOut);
      $("[data-role=entry-form]").addEventListener("submit", publishEntry);
      $$('input[name="type"]').forEach(function (radio) {
        radio.addEventListener("change", updateFields);
      });
      $$("[data-md]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          insertMarkdown(btn.dataset.md);
        });
      });
      $("#content").addEventListener("keydown", handleKeyboard);

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
