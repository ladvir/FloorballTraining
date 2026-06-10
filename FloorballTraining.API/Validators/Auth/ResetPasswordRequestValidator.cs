using FloorballTraining.API.Dtos.Auth;
using FluentValidation;

namespace FloorballTraining.API.Validators.Auth;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email je povinný.")
            .EmailAddress().WithMessage("Email nemá platný formát.");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token je povinný.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Nové heslo je povinné.")
            .MinimumLength(6).WithMessage("Heslo musí mít alespoň 6 znaků.");
    }
}
