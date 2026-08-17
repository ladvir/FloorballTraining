using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.API.Dtos.Auth
{
    public class SetActiveClubDto
    {
        [Required]
        public int ClubId { get; set; }
    }
}
