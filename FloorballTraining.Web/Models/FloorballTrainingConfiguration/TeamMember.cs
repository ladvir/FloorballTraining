using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("TeamMembers", Schema = "dbo")]
    public partial class TeamMember
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ConcurrencyCheck]
        public int? TeamId { get; set; }

        public Team Team { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int MemberId { get; set; }

        public Member Member { get; set; }

        [ConcurrencyCheck]
        public bool IsCoach { get; set; }

        [ConcurrencyCheck]
        public bool IsPlayer { get; set; }
    }
}