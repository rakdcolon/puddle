# Security Policy

## Supported versions

Puddle is a continuously deployed web application. Only the version currently live
at [solvepuddle.com](https://solvepuddle.com) is supported; fixes ship forward
rather than being backported to past releases.

## Reporting a vulnerability

**Please do not report security issues in public GitHub issues, pull requests, or
the Discord.**

Report privately through GitHub's **private vulnerability reporting**:

1. Open a new report at
   **[github.com/rakdcolon/puddle/security/advisories/new](https://github.com/rakdcolon/puddle/security/advisories/new)**
   (or: go to the repository's **Security** tab → **Report a vulnerability**).
2. Describe the issue with enough detail to reproduce it — affected URL or
   endpoint, steps, and impact.

If you can't use that channel, send a direct message to a maintainer (`@rakdcolon`)
on the [community Discord](https://discord.gg/nH3dKXnN4u) asking for a private
channel to share details — do not post the details publicly.

## What to expect

- We aim to acknowledge a report within a few days.
- We'll confirm the issue, keep you updated on the fix, and let you know when it's
  deployed.
- Please give us a reasonable window to remediate before any public disclosure.

## Scope

In scope: the Puddle application and its API (`solvepuddle.com`). Out of scope:
findings that require physical access, social engineering of maintainers, or
issues in third-party platforms (Vercel, Supabase, Discord) — report those to the
respective vendor.

Thank you for helping keep Puddle and its players safe.
