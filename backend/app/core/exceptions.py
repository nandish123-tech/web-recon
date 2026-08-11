"""Custom application exceptions."""


class ReconError(Exception):
    """Base exception for reconnaissance errors."""
    pass


class TargetValidationError(ReconError):
    """Raised when the target domain/URL is invalid."""
    pass


class ModuleError(ReconError):
    """Raised when a reconnaissance module fails."""

    def __init__(self, module: str, message: str):
        self.module = module
        self.message = message
        super().__init__(f"[{module}] {message}")


class ScanNotFoundError(ReconError):
    """Raised when a scan ID is not found."""
    pass
