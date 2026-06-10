using FloorballTraining.API.Dtos.Auth;
using FluentValidation;

namespace FloorballTraining.API.Validators.Auth;

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email je povinný.")
            .EmailAddress().WithMessage("Email nemá platný formát.");
    }
}
