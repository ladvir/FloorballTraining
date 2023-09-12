namespace FloorballTraining.CoreBusiness;

public static class Difficulties
{
    public const int Low = 0;
    public const int Medium = 1;
    public const int High = 2;

    public static readonly List<Difficulty> Values = new()
    {
        new Difficulty { Name = "Low", Description = "Nízká", Value = Low },
        new Difficulty { Name = "Medium", Description = "Střední", Value = Medium },
        new Difficulty { Name = "High", Description = "Vysoká", Value = High },
    };


    public static int MinValue => Values.Min(v => v.Value);
    public static int MaxValue => Values.Max(v => v.Value);

    public static string[] Descriptions => Values.Select(v => v.Description).ToArray();
}