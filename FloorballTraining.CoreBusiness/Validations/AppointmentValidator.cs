using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations
{
    public class AppointmentValidator : AbstractValidator<AppointmentDto>
    {
        public AppointmentValidator()
        {
            RuleFor(p => p.Name)
                .NotEmpty()
                .WithMessage("Zadej název události");

            RuleFor(p => p.LocationId)
                .GreaterThan(0)
                .WithMessage("Zadej místo");


            RuleFor(a => a).Must(a => a.Start <= a.End)
                .WithMessage("Začátek události nemůže být později než její konec");




        }
    }
}
