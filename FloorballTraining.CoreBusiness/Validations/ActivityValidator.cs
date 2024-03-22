using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations
{
    public class ActivityValidator : AbstractValidator<ActivityDto>
    {
        public ActivityValidator()
        {
            RuleFor(p => p.Name)
                .NotEmpty().WithMessage("Zadej název")
                .MaximumLength(50).WithMessage("Překročen limit 50 znaků");

            RuleFor(p => p.Description)
                .MaximumLength(1000).WithMessage("Překročen limit 1000 znaků");

            RuleFor(a => a.PersonsMin).InclusiveBetween(1, 100).WithMessage("Počet osob min.");


            RuleFor(a => a.GoaliesMin)
                .LessThanOrEqualTo(a => a.PersonsMax)
                .WithMessage(a => $"Minimální počet brankářů {a.GoaliesMin} přesahuje zadanému počtu osob {a.PersonsMax}");

            RuleFor(a => a.GoaliesMax)
                .LessThanOrEqualTo(a => a.PersonsMax)
                .WithMessage(a =>
                    $"Maximální počet brankářů {a.GoaliesMax} překračuje maximální počet osob {a.PersonsMax}");

            RuleFor(a => a.GoaliesMin).LessThanOrEqualTo(a => a.GoaliesMax).WithMessage("Počet brankářů min. je větší než počet brankářů max.");

            RuleFor(a => a).Must(a => a.DurationMin <= a.DurationMax)
                .WithMessage("Doba trvání min. nesmí být delší než Doba travání max.");

            RuleFor(a => a).Must(a => a.PersonsMin <= a.PersonsMax)
                .WithMessage("Počet osob min. musí nesmí být větší něž Počet osob max.");

            RuleFor(a => a).Must(a => a.ActivityAgeGroups.Any()).WithMessage("Chybí vybrat, pro jakou věkovou kategori je aktivita určena.");


        }
    }
}
