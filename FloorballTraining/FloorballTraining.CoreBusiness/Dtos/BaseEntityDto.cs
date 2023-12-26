using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness.Dtos;

[NotMapped]
public abstract class BaseEntityDto
{
    public int Id { get; set; }
}