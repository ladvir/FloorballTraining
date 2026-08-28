using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Reporting;
using FloorballTraining.Services;
using NSubstitute;
using QuestPDF.Fluent;
using Environment = FloorballTraining.CoreBusiness.Enums.Environment;

namespace FloorballTraining.UseCases.Tests.Trainings;

public class TrainingPdfCompactTests
{
    // Compact ("preview modal") layout uses QuestPDF Inlined + SkiaSharp rounded
    // boxes + an HSL→hex skill-pill colour: all compile-clean but only fail at
    // Compose() time, so render one representative training end to end.
    [Fact]
    public void Compact_layout_renders_a_nonempty_pdf()
    {
        var training = new TrainingDto
        {
            Name = "Ukázkový trénink",
            Description = "Popis tréninku",
            Duration = 60,
            PersonsMin = 8,
            PersonsMax = 16,
            Difficulty = 1,
            Intensity = 2,
            Environment = Environment.Indoor,
            CreatedByUserName = "Trenér",
            TrainingGoalSkill1 = new SkillDto { Id = 5, Name = "Přihrávka", SkillCategoryId = 2 },
            CommentBefore = "Přijďte včas",
            TrainingAgeGroups = { new AgeGroupDto { Name = "U12" } },
            TrainingParts =
            {
                new TrainingPartDto
                {
                    Name = "Rozcvička",
                    Duration = 15,
                    Description = "Lehký běh",
                    TrainingGroups = new()
                    {
                        new TrainingGroupDto
                        {
                            PersonsMin = 2,
                            PersonsMax = 4,
                            Activity = new ActivityDto
                            {
                                Name = "Nahrávky ve dvojicích",
                                ActivitySkills =
                                {
                                    new ActivitySkillDto { SkillId = 5, SkillName = "Přihrávka", SkillCategoryId = 2 },
                                    new ActivitySkillDto { SkillId = 9, SkillName = "Zpracování", SkillCategoryId = 7 },
                                },
                            },
                        },
                    },
                },
            },
        };

        var doc = new TrainingDocument(
            training,
            Substitute.For<IFileHandlingService>(),
            new AppSettings(),
            requestedFrom: "",
            new PdfOptions { Compact = true });

        var bytes = doc.GeneratePdf();

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 0);
    }
}
