using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Places", Schema = "dbo")]
    public partial class Place
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public string Name { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Width { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Length { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Environment { get; set; }

        public ICollection<Appointment> Appointments { get; set; }

        public ICollection<Training> Trainings { get; set; }
    }
}