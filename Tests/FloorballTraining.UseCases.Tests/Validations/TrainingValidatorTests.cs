using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FluentValidation.TestHelper;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.UseCases.Tests.Validations;

public class TrainingValidatorTests
{
    private readonly TrainingValidator _validator = new();

    private static TrainingDto ValidBase() => new()
    {
        Name = "Trénink A",
        Environment = Environment.Indoor,
        PersonsMin = 6,
        PersonsMax = 12,
        GoaliesMin = 1,
        GoaliesMax = 2,
        Duration = 60,
        TrainingGoalSkill1 = new SkillDto { Name = "Obrana" },
        TrainingParts = new List<TrainingPartDto>
        {
            new() { Name = "Část 1", Duration = 60 }
        }
    };

    [Fact]
    public void Empty_name_is_invalid()
    {
        var dto = ValidBase();
        dto.Name = "";

        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(t => t.Name);
    }

    [Fact]
    public void Name_over_limit_is_invalid()
    {
        var dto = ValidBase();
        dto.Name = new string('x', 81);

        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(t => t.Name);
    }

    [Fact]
    public void PersonsMin_greater_than_PersonsMax_is_invalid()
    {
        var dto = ValidBase();
        dto.PersonsMin = 10;
        dto.PersonsMax = 5;

        var result = _validator.TestValidate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("menší nebo roven"));
    }

    [Fact]
    public void Duration_out_of_range_is_invalid()
    {
        var dto = ValidBase();
        dto.Duration = 0;

        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(t => t.Duration);
    }

    [Fact]
    public void No_goal_skill_is_invalid()
    {
        var dto = ValidBase();
        dto.TrainingGoalSkill1 = null;
        dto.TrainingGoalSkill2 = null;
        dto.TrainingGoalSkill3 = null;

        var result = _validator.TestValidate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("alespoň jednu cílovou dovednost"));
    }

    [Fact]
    public void No_goal_skill_but_marked_NoSpecificGoal_is_valid()
    {
        // #163: a training with no developmental focus (scrimmage, free play...) can opt out
        // of the goal-skill requirement instead of forcing a meaningless skill pick.
        var dto = ValidBase();
        dto.Duration = 1;
        dto.TrainingGoalSkill1 = null;
        dto.TrainingGoalSkill2 = null;
        dto.TrainingGoalSkill3 = null;
        dto.NoSpecificGoal = true;
        dto.TrainingParts = new List<TrainingPartDto>
        {
            new() { Name = "Část 1", Duration = 1, TrainingGroups = new List<TrainingGroupDto>() }
        };

        _validator.TestValidate(dto).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Empty_training_parts_is_invalid()
    {
        var dto = ValidBase();
        dto.TrainingParts = new List<TrainingPartDto>();

        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(t => t.TrainingParts);
    }

    [Fact]
    public void Well_formed_training_is_valid()
    {
        // Duration 1 keeps the 25%-goal-content threshold at floor(0.25) == 0, so a training
        // with a goal but no goal-tagged activities still satisfies every rule. (The content
        // coverage rule itself is exercised end-to-end in the integration tests.)
        var dto = ValidBase();
        dto.Duration = 1;
        dto.TrainingParts = new List<TrainingPartDto>
        {
            // TrainingGroups must be non-null: the part rule sums group person counts and
            // a null collection makes the `<= max` comparison false (invalid).
            new() { Name = "Část 1", Duration = 1, TrainingGroups = new List<TrainingGroupDto>() }
        };

        _validator.TestValidate(dto).IsValid.Should().BeTrue();
    }
}
