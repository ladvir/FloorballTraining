namespace FloorballTraining.CoreBusiness.Dtos;

public class Intensity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Value { get; set; }

    public string Color { get; set; } = null!;
}