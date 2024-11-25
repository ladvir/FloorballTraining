using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace FloorballTraining.CoreBusiness
{
    public class ApplicationUser : IdentityUser
    {
        [JsonIgnore, IgnoreDataMember]
        public override string PasswordHash { get; set; } = string.Empty;

        [NotMapped]
        public string Password { get; set; } = string.Empty;

        [NotMapped]
        public string ConfirmPassword { get; set; } = string.Empty;

        [JsonIgnore, IgnoreDataMember, NotMapped]
        public string Name
        {
            get => UserName;
            set => UserName = value;
        }

        public ICollection<ApplicationRole> Roles { get; set; } = [];
    }
}