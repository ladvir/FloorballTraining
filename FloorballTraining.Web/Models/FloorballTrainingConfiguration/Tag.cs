using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Tags", Schema = "dbo")]
    public partial class Tag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Color { get; set; }

        [ConcurrencyCheck]
        public int? ParentTagId { get; set; }

        public Tag Tag1 { get; set; }

        [ConcurrencyCheck]
        public bool IsTrainingGoal { get; set; }

        public ICollection<ActivityTag> ActivityTags { get; set; }

        public ICollection<Tag> Tags1 { get; set; }

        public ICollection<Training> Trainings { get; set; }

        public ICollection<Training> Trainings1 { get; set; }

        public ICollection<Training> Trainings2 { get; set; }
    }
}