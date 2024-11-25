using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("Teams", Schema = "dbo")]
    public partial class Team
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public int AgeGroupId { get; set; }

        public AgeGroup AgeGroup { get; set; }

        [Required]
        public int ClubId { get; set; }

        public Club Club { get; set; }

        public ICollection<Appointment> Appointments { get; set; }

        public ICollection<TeamMember> TeamMembers { get; set; }
    }
}