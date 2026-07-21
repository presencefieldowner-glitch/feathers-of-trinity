"""Security -- conceptual placeholder scaffold. DO NOT TREAT AS REAL SECURITY.

Every method on SecurityScaffold raises NotImplementedError. None of it
performs real encryption, identity verification, authentication, or trust
evaluation -- the only real auth in this repository is the JWT-based flow
in services/api/src/modules/auth (see CLAUDE.md). If this branch is ever
implemented for real, it needs its own security review before anything
depends on it; nothing here should be wired into a real system as-is.
"""


class SecurityScaffold:
    def presence_security(self, *args, **kwargs):
        raise NotImplementedError(
            "Presence Security is not implemented -- not a real security control"
        )

    def tokey_token(self, *args, **kwargs):
        raise NotImplementedError(
            "Tokey Token is not implemented -- not a real token/credential system"
        )

    def identity(self, *args, **kwargs):
        raise NotImplementedError("Identity is not implemented -- not a real identity system")

    def authentication(self, *args, **kwargs):
        raise NotImplementedError(
            "Authentication is not implemented here -- real auth lives in services/api"
        )

    def encryption(self, *args, **kwargs):
        raise NotImplementedError(
            "Encryption is not implemented -- performs no real cryptography"
        )

    def trust_engine(self, *args, **kwargs):
        raise NotImplementedError(
            "Trust Engine is not implemented -- makes no real trust decisions"
        )

    def audit_layer(self, *args, **kwargs):
        raise NotImplementedError(
            "Audit Layer is not implemented -- produces no real audit trail"
        )
