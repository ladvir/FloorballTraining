namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityEquipmentDto : BaseEntityDto
{
    public int ActivityId { get; set; }
    public ActivityDto? Activity { get; set; }

    public int EquipmentId { get; set; }
    public EquipmentDto? Equipment { get; set; }
}