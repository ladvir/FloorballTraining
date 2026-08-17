using FloorballTraining.API.Dtos.Auth;
using FluentValidation;

namespace FloorballTraining.API.Validators.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email je povinný.")
            .EmailAddress().WithMessage("Email nemá platný formát.");

        // Password strength - aligned with Identity options; strengthened further in S4.
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Heslo je povinné.")
            .MinimumLength(6).WithMessage("Heslo musí mít alespoň 6 znaků.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Jméno je povinné.");
    }
}
