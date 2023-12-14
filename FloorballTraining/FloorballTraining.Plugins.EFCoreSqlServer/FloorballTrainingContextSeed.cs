using System.Text.Json;
using FloorballTraining.CoreBusiness;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

public class FloorballTrainingContextSeed
{
    public static async Task SeedAsync(FloorballTrainingContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (!context.Tags.Any())
        {
            var tagsData =
                File.ReadAllText(@"c:\Source\Private\FloorballTraining\FloorballTraining\FloorballTraining.Plugins.EFCoreSqlServer\bin\Debug\net7.0\SeedData\Tags.json");
            var tags = JsonSerializer.Deserialize<List<Tag>>(tagsData);
            if (tags != null && tags.Any())
            {
                context.Tags.AddRange(tags);
            }
        }

        if (!context.Equipments.Any())
        {
            var equipmentsData = await File.ReadAllTextAsync("/SeedData/Equipments.json");
            var equipments = JsonSerializer.Deserialize<List<Equipment>>(equipmentsData);

            if (equipments != null && equipments.Any())
            {
                context.Equipments.AddRange(equipments);
            }
        }


        if (context.ChangeTracker.HasChanges())
        {
            await context.SaveChangesAsync();
        }
    }
}