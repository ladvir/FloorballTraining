using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("Places", Schema = "dbo")]
    public partial class Place
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public int Width { get; set; }

        [Required]
        public int Length { get; set; }

        [Required]
        public int Environment { get; set; }

        public ICollection<Appointment> Appointments { get; set; }

        public ICollection<Training> Trainings { get; set; }
    }
}