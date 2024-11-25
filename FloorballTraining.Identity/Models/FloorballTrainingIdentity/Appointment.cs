using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("Appointments", Schema = "dbo")]
    public partial class Appointment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        [Column(TypeName="datetime2")]
        [Required]
        public DateTime Start { get; set; }

        [Column(TypeName="datetime2")]
        [Required]
        public DateTime End { get; set; }

        [Required]
        public int AppointmentType { get; set; }

        public int? RepeatingPatternId { get; set; }

        [Required]
        public int LocationId { get; set; }

        public Place Place { get; set; }

        [Required]
        public int TeamId { get; set; }

        public Team Team { get; set; }

        public int? ParentAppointmentId { get; set; }

        public Appointment Appointment1 { get; set; }

        public int? TrainingId { get; set; }

        public Training Training { get; set; }

        public ICollection<Appointment> Appointments1 { get; set; }

        public ICollection<RepeatingPattern> RepeatingPatterns { get; set; }
    }
}