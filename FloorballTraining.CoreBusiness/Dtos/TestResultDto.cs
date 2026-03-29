using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness.Dtos;

[NotMapped]
public class TestResultDto
{
    public int Id { get; set; }
    public int TestDefinitionId { get; set; }
    public string? TestName { get; set; }
    public int MemberId { get; set; }
    public string? MemberName { get; set; }
    public double? NumericValue { get; set; }
    public int? GradeOptionId { get; set; }
    public string? GradeLabel { get; set; }
    public DateTime TestDate { get; set; }
    public string? Note { get; set; }
    public string RecordedByUserId { get; set; } = string.Empty;
    public string? RecordedByUserName { get; set; }
    public string? ColourCode { get; set; }
    public DateTime CreatedAt { get; set; }
}
