using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness;

[NotMapped]
public abstract class BaseEntity
{
    public int Id { get; set; }
}