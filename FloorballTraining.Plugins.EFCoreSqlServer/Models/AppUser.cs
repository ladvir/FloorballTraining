using Microsoft.AspNetCore.Identity;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Models
{
    public class AppUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int? DefaultClubId { get; set; }
        public int? DefaultTeamId { get; set; }
    }
}
