using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness;

public class TrainingAgeGroup
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Key]
    public int? TrainingAgeGroupId { get; set; }

    public Training? Training { get; set; }
    public int? TrainingId { get; set; }

    public AgeGroup? AgeGroup { get; set; } = null!;
    public int? AgeGroupId { get; set; }
}