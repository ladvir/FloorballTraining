using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness;

public class ActivityAgeGroup
{
    [Key]
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ActivityAgeGroupId { get; set; }
    public Activity? Activity { get; set; }
    public int? ActivityId { get; set; }

    public AgeGroup? AgeGroup { get; set; }

    public int? AgeGroupId { get; set; }
}