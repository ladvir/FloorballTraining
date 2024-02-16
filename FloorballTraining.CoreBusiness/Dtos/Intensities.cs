namespace FloorballTraining.CoreBusiness.Dtos;

public static class Intensities
{
    public const int Low = 0;
    public const int Medium = 1;
    public const int High = 2;

    public const string ColorLow = "";
    public const string ColorMedium = "";
    public const string ColorHigh = "";

    public static readonly List<Intensity> Values = new()
    {
        new Intensity { Name = "Low", Description = "Nízká", Value = Low, Color=ColorLow },
        new Intensity { Name = "Medium", Description = "Střední", Value = Medium, Color = ColorMedium},
        new Intensity { Name = "High", Description = "Vysoká", Value = High, Color = ColorHigh },
    };


    public static int MinValue => Values.Min(v => v.Value);
    public static int MaxValue => Values.Max(v => v.Value);

    public static string[] Descriptions => Values.Select(v => v.Description).ToArray();
}