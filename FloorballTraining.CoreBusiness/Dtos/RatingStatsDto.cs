using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness.Dtos;

[NotMapped]
public class RatingStatsDto
{
    public int TotalRatings { get; set; }
    public double AverageGrade { get; set; }
    public int[] GradeDistribution { get; set; } = new int[5]; // index 0 = grade 1, index 4 = grade 5
    public int RatedAppointments { get; set; }
    public int CoachRatings { get; set; }
    public int PlayerRatings { get; set; }
}
