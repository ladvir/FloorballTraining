using FloorballTraining.API.Dtos.Auth;
using FluentValidation;

namespace FloorballTraining.API.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email je povinný.")
            .EmailAddress().WithMessage("Email nemá platný formát.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Heslo je povinné.");
    }
}
