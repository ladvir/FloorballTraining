using FluentValidation;

namespace FloorballTraining.WebApp.Validations
{
    public class UriValidator : AbstractValidator<string>
    {
        public UriValidator()
        {
            RuleFor(x => x).Must(x => x != null && Uri.IsWellFormedUriString(x, UriKind.Absolute)).WithMessage("Neplatný odkaz. Zadej adresu včetně https://");


        }
    }



}
