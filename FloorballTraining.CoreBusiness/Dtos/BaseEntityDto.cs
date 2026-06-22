using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.CoreBusiness.Dtos;

[NotMapped]
public abstract class BaseEntityDto
{
    public int Id { get; set; }

    /// <summary>
    /// Opaque concurrency token. Returned by GET; must be echoed back in PUT to enable
    /// optimistic-concurrency detection (returns 409 if the row was modified since the GET).
    /// </summary>
    public byte[]? RowVersion { get; set; }
}