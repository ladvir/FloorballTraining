using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace FloorballTraining.CoreBusiness
{
    public partial class ApplicationRole : IdentityRole
    {
        [JsonIgnore] public ICollection<ApplicationUser> Users { get; set; } = [];

    }
}