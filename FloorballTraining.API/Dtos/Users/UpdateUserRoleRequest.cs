using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.API.Dtos.Users
{
    public class UpdateUserRoleRequest
    {
        [Required]
        public required string Role { get; set; }
    }
}
