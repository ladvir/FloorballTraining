using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("Appointments", Schema = "dbo")]
    public partial class Appointment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ConcurrencyCheck]
        public string Name { get; set; }

        [ConcurrencyCheck]
        public string Description { get; set; }

        [Column(TypeName="datetime2")]
        [Required]
        [ConcurrencyCheck]
        public DateTime Start { get; set; }

        [Column(TypeName="datetime2")]
        [Required]
        [ConcurrencyCheck]
        public DateTime End { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int AppointmentType { get; set; }

        [ConcurrencyCheck]
        public int? RepeatingPatternId { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int LocationId { get; set; }

        public Place Place { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int TeamId { get; set; }

        public Team Team { get; set; }

        [ConcurrencyCheck]
        public int? ParentAppointmentId { get; set; }

        public Appointment Appointment1 { get; set; }

        [ConcurrencyCheck]
        public int? TrainingId { get; set; }

        public Training Training { get; set; }

        public ICollection<Appointment> Appointments1 { get; set; }

        public ICollection<RepeatingPattern> RepeatingPatterns { get; set; }
    }
}