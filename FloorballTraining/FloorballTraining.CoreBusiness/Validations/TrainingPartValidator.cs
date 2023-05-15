using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TrainingPartValidator : AbstractValidator<TrainingPart>
{
    public TrainingPartValidator()
    {
        RuleFor(tp => tp.Name)
            .NotEmpty().WithMessage("Zadej název tréninkov= části")
            .MaximumLength(50).WithMessage("Překročen limit 50 znaků pro název tréninkové části");

        RuleFor(tp => tp.Description)
            .MaximumLength(1000).WithMessage("Překročen limit 1000 znaků pro popis tréninkové části");


        RuleFor(tp => tp.Duration).InclusiveBetween(1, 30).WithMessage("Doba trvání tréninkové části musí být mezi 1 a 30");

        RuleFor(tp => tp).Must(tp => tp.TrainingGroups.Max(
                tg => tg.TrainingGroupActivities.
                    Sum(tga => tga.Activity?.DurationMax ?? 0)) < tp.Duration).
            When(tp => tp.TrainingGroups.Count > 0)
            .WithMessage("Celková délka aktivit ve skupině přesahuje požadovanou délku tréninkové části");



    }

}