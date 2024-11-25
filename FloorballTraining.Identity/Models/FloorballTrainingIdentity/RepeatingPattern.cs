using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Identity.Models.FloorballTrainingIdentity
{
    [Table("RepeatingPatterns", Schema = "dbo")]
    public partial class RepeatingPattern
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int RepeatingFrequency { get; set; }

        [Required]
        public int Interval { get; set; }

        [Column(TypeName="datetime2")]
        [Required]
        public DateTime StartDate { get; set; }

        [Column(TypeName="datetime2")]
        public DateTime? EndDate { get; set; }

        [Required]
        public int InitialAppointmentId { get; set; }

        public Appointment Appointment { get; set; }
    }
}