using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Members", Schema = "dbo")]
    public partial class Member
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Email { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int ClubId { get; set; }

        public Club Club { get; set; }

        [ConcurrencyCheck]
        public bool HasClubRoleMainCoach { get; set; }

        [ConcurrencyCheck]
        public bool HasClubRoleManager { get; set; }

        [ConcurrencyCheck]
        public bool HasClubRoleSecretary { get; set; }

        public ICollection<TeamMember> TeamMembers { get; set; }
    }
}