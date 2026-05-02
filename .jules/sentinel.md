## 2024-05-02 - Information Exposure through Log Files in Password Reset
**Vulnerability:** The password reset endpoint (`src/app/api/auth/reset-password/route.ts`) was logging the complete `resetUrl` to the server console. This URL contained the plaintext `resetToken`.
**Learning:** Development-time debugging statements (like logging URLs or sensitive tokens) must be removed before code is deployed, as server logs are often accessible to multiple developers, operations teams, or potentially attackers if a separate vulnerability exists.
**Prevention:** Never log sensitive URLs, tokens, passwords, or PII. Use generic log messages (e.g., "Reset token generated for user") that indicate the action occurred without exposing the data required to exploit the feature.
