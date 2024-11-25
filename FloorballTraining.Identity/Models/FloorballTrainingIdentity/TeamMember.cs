using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("TeamMembers", Schema = "dbo")]
    public partial class TeamMember
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? TeamId { get; set; }

        public Team Team { get; set; }

        [Required]
        public int MemberId { get; set; }

        public Member Member { get; set; }

        public bool IsCoach { get; set; }

        public bool IsPlayer { get; set; }
    }
}