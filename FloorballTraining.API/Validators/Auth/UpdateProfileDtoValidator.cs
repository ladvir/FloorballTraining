using FloorballTraining.API.Dtos.Auth;
using FluentValidation;

namespace FloorballTraining.API.Validators.Auth;

public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileDtoValidator()
    {
        // All fields optional, but when supplied they must be well-formed.
        When(x => !string.IsNullOrWhiteSpace(x.Email), () =>
        {
            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("Email nemá platný formát.");
        });

        When(x => !string.IsNullOrEmpty(x.NewPassword), () =>
        {
            RuleFor(x => x.NewPassword)
                .MinimumLength(6).WithMessage("Heslo musí mít alespoň 6 znaků.");

            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Pro změnu hesla zadejte aktuální heslo.");
        });
    }
}
