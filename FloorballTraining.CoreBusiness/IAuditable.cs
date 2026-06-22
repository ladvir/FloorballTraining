namespace FloorballTraining.CoreBusiness;

public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? CreatedByUserId { get; set; }
    string? UpdatedByUserId { get; set; }
}
