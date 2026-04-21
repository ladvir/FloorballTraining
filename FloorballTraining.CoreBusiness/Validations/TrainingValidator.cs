using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TrainingValidator : AbstractValidator<TrainingDto>
{
    private readonly int _maximalDuration = 120;
    private readonly int _maximalLengthTrainingName = 80;
    private readonly int _maximalLengthTrainingDescription = 1000;
    private readonly int _maximalPersons = 50;

    private readonly int _maximalTrainingPartDuration = 40;
    private readonly int _maximalLengthTrainingPartName = 50;
    private readonly int _maximalLengthTrainingPartDescription = 1000;

    private readonly int _minimalDurationTrainingGoalPercent = 25;
    private readonly int _minPartsDurationPercent = 95;

    public TrainingValidator()
    {
        SetRules();
    }

    public TrainingValidator(
        int maximalDuration = 120,
        int maximalLengthTrainingName = 80,
        int maximalLengthTrainingDescription = 1000,
        int maximalPersons = 50,
        int maximalTrainingPartDuration = 40,
        int maximalLengthTrainingPartName = 50,
        int maximalLengthTrainingPartDescription = 1000,
        int minimalDurationTrainingGoalPercent = 25,
        int minPartsDurationPercent = 95
    )
    {
        _maximalDuration = maximalDuration;
        _maximalLengthTrainingName = maximalLengthTrainingName;
        _maximalLengthTrainingDescription = maximalLengthTrainingDescription;
        _maximalPersons = maximalPersons;

        _maximalTrainingPartDuration = maximalTrainingPartDuration;
        _maximalLengthTrainingPartName = maximalLengthTrainingPartName;
        _maximalLengthTrainingPartDescription = maximalLengthTrainingPartDescription;
        _minimalDurationTrainingGoalPercent = minimalDurationTrainingGoalPercent;
        _minPartsDurationPercent = minPartsDurationPercent;

        SetRules();
    }

    private void SetRules()
    {

        RuleFor(t => t.Name)
                .NotEmpty().WithMessage("Zadej název tréninku")
                .MaximumLength(_maximalLengthTrainingName)
                .WithMessage($"Překročen limit {_maximalLengthTrainingName} znaků pro název tréninku");

        RuleFor(t => t.Environment)
            .IsInEnum().WithMessage("Zadej prostředí tréninku");


        RuleFor(p => p.Description)
            .MaximumLength(_maximalLengthTrainingDescription)
            .WithMessage(t => $"Počet znaků pro popis tréninku [{t.Name.Length}] překračuje limit {_maximalLengthTrainingDescription}.");

        RuleFor(a => a.PersonsMin)
            .InclusiveBetween(1, _maximalPersons)
            .WithMessage($"Počet osob min. musí být mezi 1 a {_maximalPersons}");

        RuleFor(a => a.PersonsMax)
            .InclusiveBetween(1, _maximalPersons)
            .WithMessage($"Počet osob max. musí být mezi 1 a {_maximalPersons}");

        RuleFor(a => a)
            .Must(a => a.PersonsMin <= a.PersonsMax)
            .WithMessage(t => $"Počet osob min. [{t.PersonsMin}] musí být menší nebo roven počtu osob max. [{t.PersonsMax}]");

        RuleFor(a => a.Duration)
            .InclusiveBetween(1, _maximalDuration)
            .WithMessage(a => $"Doba trvání tréninku {a.Duration} musí být mezi 1 a {_maximalDuration}");


        RuleFor(a => a.GoaliesMin)
            .LessThanOrEqualTo(a => a.GoaliesMin)
            .WithMessage(a => $"Minimální počet brankářů {a.GoaliesMin} přesahuje zadanému počtu osob {a.PersonsMax}");

        RuleFor(a => a.GoaliesMax)
            .LessThanOrEqualTo(a => a.PersonsMax)
            .WithMessage(a => $"Maximální počet brankářů {a.GoaliesMax} překračuje maximální počet osob {a.PersonsMax}");

        RuleFor(a => a.GoaliesMin).LessThanOrEqualTo(a => a.GoaliesMax).WithMessage("Počet brankářů min. je větší než počet brankářů max.");

        RuleFor(t => t)
            .Must(t => t.TrainingGoal1 != null || t.TrainingGoal2 != null || t.TrainingGoal3 != null)
            .WithMessage("Zadej alespoň jedno zaměření tréninku");

        RuleFor(t => t.TrainingParts)
            .NotEmpty().WithMessage("Trénink musí obsahovat alespoň jednu tréninkovou část");

        RuleFor(t => t)
           .Must(t => t.GetTrainingGoalActivitiesDuration() >= Math.Floor(((double)_minimalDurationTrainingGoalPercent / 100) * t.Duration))
           .When(t => t.TrainingGoal1 != null &&  t.TrainingParts.Any())
           .WithMessage(t => "Obsah tréninku nedopovídá zvolenému zaměření. Je potřeba, aby byly vybrány aktivity se štítkem " +
                           $"{t.TrainingGoal1?.Name} alespoň po dobu odpovídající přibližně {_minimalDurationTrainingGoalPercent}% " +
                           $"z celkové doby tréninku tj.{Math.Floor(((double)_minimalDurationTrainingGoalPercent / 100) * t.Duration)} minut.");

        RuleFor(t => t)
            .Must(t => t.TrainingParts.Sum(tp => tp.Duration) <= t.Duration)
            .When(t => t.TrainingParts.Any())
            .WithMessage(t => $"Celková délka tréninkových částí [{t.TrainingParts.Sum(tp => tp.Duration)} min] přesahuje délku tréninku [{t.Duration} min].");

        RuleFor(t => t)
            .Must(t => t.TrainingParts.Sum(tp => tp.Duration) >= Math.Floor(_minPartsDurationPercent / 100.0 * t.Duration))
            .When(t => t.TrainingParts.Any() && t.Duration > 0)
            .WithMessage(t => $"Součet částí [{t.TrainingParts.Sum(tp => tp.Duration)} min] pokrývá pouze " +
                              $"{(int)Math.Round(t.TrainingParts.Sum(tp => tp.Duration) / (double)t.Duration * 100)}% délky tréninku. " +
                              $"Minimum je {_minPartsDurationPercent}% (tj. {(int)Math.Floor(_minPartsDurationPercent / 100.0 * t.Duration)} min).");

        RuleForEach(tp => tp.TrainingParts)
            .SetValidator(t => new TrainingPartValidator(Math.Max(1, t.Duration > 0 ? Math.Min(t.Duration, _maximalTrainingPartDuration) : _maximalTrainingPartDuration), _maximalLengthTrainingPartName, _maximalLengthTrainingPartDescription, Math.Max(1, t.PersonsMax)));

    }

}