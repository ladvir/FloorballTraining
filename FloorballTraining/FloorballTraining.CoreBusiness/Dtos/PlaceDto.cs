namespace FloorballTraining.CoreBusiness.Dtos;

public class PlaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int Width { get; set; }
    public int Length { get; set; }

    public string Environment { get; set; } = string.Empty;
}