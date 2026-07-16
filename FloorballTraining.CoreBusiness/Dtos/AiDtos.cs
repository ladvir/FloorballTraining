using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

// ── Credentials ──────────────────────────────────────────────────────────────

/// <summary>Masked view of a user's AI credential. Never carries the API key.</summary>
public class AiCredentialDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AiProvider Provider { get; set; }
    public string? Model { get; set; }
    public string KeyLast4 { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    /// <summary>True when the stored key can no longer be decrypted and must be re-entered.</summary>
    public bool NeedsReentry { get; set; }
    public DateTime? LastValidatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public List<AiConsentDto> Consents { get; set; } = [];
}

public class AiConsentDto
{
    public int Id { get; set; }
    public AiConsentScope Scope { get; set; }
    public int? ClubId { get; set; }
    public string? ClubName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAiCredentialRequest
{
    public string Name { get; set; } = string.Empty;
    public AiProvider Provider { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string? Model { get; set; }
}

public class UpdateAiCredentialRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    /// <summary>Optional key rotation; null keeps the stored key.</summary>
    public string? ApiKey { get; set; }
}

public class ShareAiCredentialRequest
{
    public int ClubId { get; set; }
}

/// <summary>Pre-save key check (id-less variant of credential validation).</summary>
public class ValidateAiKeyRequest
{
    public AiProvider Provider { get; set; }
    public string ApiKey { get; set; } = string.Empty;
}

public class AiKeyCheckResultDto
{
    public bool Ok { get; set; }
    public string? Message { get; set; }
}

// ── Settings ─────────────────────────────────────────────────────────────────

public class AiSettingsDto
{
    public int? ClubId { get; set; }
    public bool Enabled { get; set; }
    public int? DefaultCredentialId { get; set; }
    public string? DefaultCredentialName { get; set; }
    public AiProvider? DefaultCredentialProvider { get; set; }
    public string? DefaultModel { get; set; }
    /// <summary>False when the default credential lost its consent or was deleted.</summary>
    public bool DefaultValid { get; set; }
}

public class UpdateAiSettingsRequest
{
    public bool Enabled { get; set; }
    public int? DefaultCredentialId { get; set; }
    public string? DefaultModel { get; set; }
}

/// <summary>Credential eligible as a club default (has an active Club consent).</summary>
public class EligibleCredentialDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AiProvider Provider { get; set; }
    public string? Model { get; set; }
    public string OwnerName { get; set; } = string.Empty;
}

/// <summary>Drives visibility of AI actions in the client for the current user.</summary>
public class AiStatusDto
{
    public bool Enabled { get; set; }
    public bool HasCredential { get; set; }
    public AiCredentialSource? Source { get; set; }
    public AiProvider? Provider { get; set; }
    public string? Model { get; set; }
}
