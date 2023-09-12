using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TrainingPartValidator : AbstractValidator<TrainingPart>
{
    private readonly int _maximalTrainingPartDuration = 30;
    private readonly int _maximalLengthTrainingPartName = 50;
    private readonly int _maximalLengthTrainingPartDescription = 1000;
    private readonly int _personsMax = 30;

    public TrainingPartValidator()
    {
        SetRules();
    }

    public TrainingPartValidator(
        int maximalTrainingPartDuration,
        int maximalLengthTrainingPartName,
        int maximalLengthTrainingPartDescription,
        int personsMax)
    {
        _maximalTrainingPartDuration = maximalTrainingPartDuration;
        _maximalLengthTrainingPartName = maximalLengthTrainingPartName;
        _maximalLengthTrainingPartDescription = maximalLengthTrainingPartDescription;
        _personsMax = personsMax;

        SetRules();

    }

    public TrainingPartValidator(
        int maximalDuration
        )
    {
        _maximalTrainingPartDuration = maximalDuration;

        SetRules();
    }


    private void SetRules()
    {
        RuleFor(tp => tp.Name)
            .NotEmpty().WithMessage("Zadej název tréninkové části")
            .MaximumLength(_maximalLengthTrainingPartName)
            .WithMessage($"Překročen limit {_maximalLengthTrainingPartName} znaků pro název tréninkové části");

        RuleFor(tp => tp.Description)
            .MaximumLength(_maximalLengthTrainingPartDescription)
            .WithMessage($"Překročen limit {_maximalLengthTrainingPartDescription} znaků pro popis tréninkové části");

        RuleFor(tp => tp.Duration)
            .InclusiveBetween(1, _maximalTrainingPartDuration)
            .WithMessage($"Doba trvání tréninkové části musí být mezi 1 a {_maximalTrainingPartDuration}");

        RuleFor(tp => tp)
            .Must(tp => tp.TrainingGroups!.Max(tg => tg.TrainingGroupActivities.Sum(tga => tga.Duration)) <= tp.Duration)
            .When(tp => tp.TrainingGroups!.Count > 0)
            .WithMessage("Celková délka aktivit ve skupině přesahuje požadovanou délku tréninkové části");

        RuleFor(tp => tp)
            .Must(tp => tp.TrainingGroups!.Sum(tg => tg.PersonsMax) <= _personsMax)
            .WithMessage("Celkový počet osob ve všech skupinách přesahuje počet osob v tréninku");
    }
}