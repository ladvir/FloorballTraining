using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TrainingValidator : AbstractValidator<Training>
{
    public TrainingValidator()
    {
        RuleFor(t => t.Name)
            .NotEmpty().WithMessage("Zadej název")
            .MaximumLength(50).WithMessage("Překročen limit 50 znaků");

        RuleFor(p => p.Description)
            .MaximumLength(1000).WithMessage("Překročen limit 1000 znaků");

        RuleFor(a => a.Persons).ExclusiveBetween(1, 50).WithMessage("Počet osob musí být mezi 1 a 50");

        RuleFor(a => a.Duration).ExclusiveBetween(1, 180).WithMessage("Doba trvání musí být mezi 1 a 180");

        RuleFor(t => t).Must(t => t.TrainingParts.Sum(tp => tp.Duration) <= t.Duration)
            .WithMessage("Celková délka tréninkových částí přesahuje požadovanou délku tréninku");

        RuleFor(t => t).Must(t => t.TrainingParts.Sum(tp => tp.Duration) <= t.Duration)
            .WithMessage("Celková délka tréninkových částí přesahuje požadovanou délku tréninku");

        RuleForEach(tp => tp.TrainingParts)
            .SetValidator(new TrainingPartValidator());

    }

}