using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("Members", Schema = "dbo")]
    public partial class Member
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public int ClubId { get; set; }

        public Club Club { get; set; }

        public bool HasClubRoleMainCoach { get; set; }

        public bool HasClubRoleManager { get; set; }

        public bool HasClubRoleSecretary { get; set; }

        public ICollection<TeamMember> TeamMembers { get; set; }
    }
}