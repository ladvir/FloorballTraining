using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.API.Validators.Ai;

public class CreateAiCredentialRequestValidator : AbstractValidator<CreateAiCredentialRequest>
{
    public CreateAiCredentialRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Název je povinný.")
            .MaximumLength(100).WithMessage("Název může mít nejvýše 100 znaků.");

        RuleFor(x => x.Provider)
            .IsInEnum().WithMessage("Neznámý AI provider.");

        RuleFor(x => x.ApiKey)
            .NotEmpty().WithMessage("API klíč je povinný.")
            .MaximumLength(500).WithMessage("API klíč je příliš dlouhý.");

        RuleFor(x => x.Model)
            .MaximumLength(100).WithMessage("Model může mít nejvýše 100 znaků.");
    }
}

public class UpdateAiCredentialRequestValidator : AbstractValidator<UpdateAiCredentialRequest>
{
    public UpdateAiCredentialRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Název je povinný.")
            .MaximumLength(100).WithMessage("Název může mít nejvýše 100 znaků.");

        RuleFor(x => x.ApiKey)
            .MaximumLength(500).WithMessage("API klíč je příliš dlouhý.");

        RuleFor(x => x.Model)
            .MaximumLength(100).WithMessage("Model může mít nejvýše 100 znaků.");
    }
}

public class ValidateAiKeyRequestValidator : AbstractValidator<ValidateAiKeyRequest>
{
    public ValidateAiKeyRequestValidator()
    {
        RuleFor(x => x.Provider)
            .IsInEnum().WithMessage("Neznámý AI provider.");

        RuleFor(x => x.ApiKey)
            .NotEmpty().WithMessage("API klíč je povinný.")
            .MaximumLength(500).WithMessage("API klíč je příliš dlouhý.");
    }
}

public class UpdateAiSettingsRequestValidator : AbstractValidator<UpdateAiSettingsRequest>
{
    public UpdateAiSettingsRequestValidator()
    {
        RuleFor(x => x.DefaultModel)
            .MaximumLength(100).WithMessage("Model může mít nejvýše 100 znaků.");
    }
}
