using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TrainingValidator : AbstractValidator<Training>
{
    private readonly int _maximalDuration = 30;
    private readonly int _maximalLengthTrainingName = 50;
    private readonly int _maximalLengthTrainingDescription = 1000;
    private readonly int _maximalPersons = 50;

    private readonly int _maximalTrainingPartDuration = 30;
    private readonly int _maximalLengthTrainingPartName = 50;
    private readonly int _maximalLengthTrainingPartDescription = 1000;
    
    public TrainingValidator()
    {
        SetRules();
    }

    public TrainingValidator(
        int maximalDuration = 30,
        int maximalLengthTrainingName = 50,
        int maximalLengthTrainingDescription = 1000,
        int maximalPersons = 50,
        int maximalTrainingPartDuration = 30,
        int maximalLengthTrainingPartName = 50,
        int maximalLengthTrainingPartDescription = 1000
    )
    {
        _maximalDuration = maximalDuration;
        _maximalLengthTrainingName = maximalLengthTrainingName;
        _maximalLengthTrainingDescription = maximalLengthTrainingDescription;
        _maximalPersons = maximalPersons;

        _maximalTrainingPartDuration = maximalTrainingPartDuration;
        _maximalLengthTrainingPartName = maximalLengthTrainingPartName;
        _maximalLengthTrainingPartDescription = maximalLengthTrainingPartDescription;

        SetRules();
    }

    private void SetRules(){

    RuleFor(t => t.Name)
            .NotEmpty().WithMessage("Zadej název tréninku")
            .MaximumLength(_maximalLengthTrainingName)
            .WithMessage($"Překročen limit {_maximalLengthTrainingName} znaků pro název tréninku");

        RuleFor(p => p.Description)
            .MaximumLength(_maximalLengthTrainingDescription)
            .WithMessage(t=>$"Počet znaků pro popis tréninku [{t.Name.Length}] překračuje limit {_maximalLengthTrainingDescription}.");

        RuleFor(a => a.PersonsMin)
            .InclusiveBetween(1, _maximalPersons)
            .WithMessage($"Počet osob min. musí být mezi 1 a {_maximalPersons}");

        RuleFor(a => a.PersonsMax)
            .InclusiveBetween(1, _maximalPersons)
            .WithMessage($"Počet osob max. musí být mezi 1 a {_maximalPersons}");

        RuleFor(a => a)
            .Must(a => a.PersonsMin <= a.PersonsMax)
            .WithMessage(t=>$"Počet osob min. [{t.PersonsMin}] musí být menší nebo roven počtu osob max. [{t.PersonsMax}]");

        RuleFor(a => a.Duration)
            .InclusiveBetween(1, _maximalDuration)
            .WithMessage($"Doba trvání tréninku musí být mezi 1 a {_maximalDuration}");

        RuleFor(t => t)
            .Must(t => t.TrainingParts.Sum(tp => tp.Duration) <= t.Duration)
            .WithMessage(t=>$"Celková délka tréninkových částí [{t.TrainingParts.Sum(tp => tp.Duration)}] přesahuje požadovanou délku tréninku [{t.Duration}]");
        
        RuleForEach(tp => tp.TrainingParts)
            .SetValidator(t=> new TrainingPartValidator(Math.Min(t.Duration, _maximalTrainingPartDuration), _maximalLengthTrainingPartName, _maximalLengthTrainingPartDescription ));

    }

}