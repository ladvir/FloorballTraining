using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TrainingValidator : AbstractValidator<Training>
{
    public TrainingValidator()
    {
        RuleFor(t => t.Name)
            .NotEmpty().WithMessage("Zadej název tréninku")
            .MaximumLength(50).WithMessage("Překročen limit 50 znaků pro název tréninku");

        RuleFor(p => p.Description)
            .MaximumLength(1000).WithMessage("Překročen limit 1000 znaků pro popis tréninku");

        RuleFor(a => a.PersonsMin).InclusiveBetween(1, 50).WithMessage("Počet osob min. musí být mezi 1 a 50");
        RuleFor(a => a.PersonsMax).InclusiveBetween(1, 50).WithMessage("Počet osob max. musí být mezi 1 a 50");
        RuleFor(a => a).Must(a => a.PersonsMin <= a.PersonsMax).WithMessage("Počet osob min. musí být menší nebo roven počtu osob max.");

        RuleFor(a => a.Duration).InclusiveBetween(1, 180).WithMessage("Doba trvání tréninku musí být mezi 1 a 180");

        RuleFor(t => t).Must(t => t.TrainingParts.Sum(tp => tp.Duration) <= t.Duration)
            .WithMessage("Celková délka tréninkových částí přesahuje požadovanou délku tréninku");

        RuleFor(t => t).Must(t => t.TrainingParts.Sum(tp => tp.Duration) <= t.Duration)
            .WithMessage("Celková délka tréninkových částí přesahuje požadovanou délku tréninku");

        RuleForEach(tp => tp.TrainingParts)
            .SetValidator(new TrainingPartValidator());

    }

}