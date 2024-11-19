using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FloorballTraining.Web.Models.FloorballTrainingConfiguration
{
    [Table("RepeatingPatterns", Schema = "dbo")]
    public partial class RepeatingPattern
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int RepeatingFrequency { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int Interval { get; set; }

        [Column(TypeName="datetime2")]
        [Required]
        [ConcurrencyCheck]
        public DateTime StartDate { get; set; }

        [Column(TypeName="datetime2")]
        [ConcurrencyCheck]
        public DateTime? EndDate { get; set; }

        [Required]
        [ConcurrencyCheck]
        public int InitialAppointmentId { get; set; }

        public Appointment Appointment { get; set; }
    }
}